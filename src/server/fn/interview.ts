import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  CandidateTokenError,
  candidateTokenMiddleware,
} from '../middleware/candidate-token'
import { checkIpRateLimit } from '../lib/rate-limit'
import {
  processInterviewResponse,
  toPublicQuestion,
} from '../lib/ai/interview-conversation'
import { transcribeInterviewAudio } from '../lib/ai/interview-transcribe'
import { shouldUseAiPipelineStub } from '../lib/ai/pipeline-stub'

function asInterviewError(error: unknown): never {
  if (error instanceof CandidateTokenError) throw error
  throw error instanceof Error ? error : new Error(String(error))
}

/**
 * Public session GET by token. No rate limit. Only `pending` sessions are
 * welcome-stage eligible (source InterviewPage client validation parity —
 * no mid-session resume).
 */
export const getInterviewByToken = createServerFn({ method: 'GET' })
  .middleware([
    candidateTokenMiddleware({
      kind: 'interview',
      rateLimit: false,
      requireStatus: 'pending',
    }),
  ])
  .validator(z.object({ token: z.string().min(1) }))
  .handler(async ({ context }) => {
    const interviewSession = context.interviewSession!
    return {
      sessionId: interviewSession.id,
      candidateName: interviewSession.candidateName,
      jobTitle: interviewSession.jobTitle,
      companyName: interviewSession.companyName,
      expiresAt: interviewSession.expiresAt,
      status: interviewSession.status,
      totalQuestions: interviewSession.interviewContext.questions.length,
    }
  })

/**
 * Start interview: pending → in_progress, charge `screening_interview`
 * credits (fail-open after status flip), return first question.
 */
export const startInterview = createServerFn({ method: 'POST' })
  .middleware([
    candidateTokenMiddleware({
      kind: 'interview',
      rateLimit: false,
      requireStatus: 'pending',
    }),
  ])
  .validator(z.object({ token: z.string().min(1) }))
  .handler(async ({ context }) => {
    try {
      const { admin } = context
      const interviewSession = context.interviewSession!

      const stub = shouldUseAiPipelineStub()
      let pendingCreditCost: number | undefined

      if (!stub) {
        const { data: creditCost, error: costError } = await admin.rpc(
          'get_company_service_cost',
          {
            p_company_id: interviewSession.companyId,
            p_service_code: 'screening_interview',
          },
        )
        if (costError) {
          throw new Error('Failed to determine service cost')
        }
        const effectiveCost = creditCost || 400

        const { data: balanceData } = await admin.rpc(
          'get_company_credit_balance',
          { p_company_id: interviewSession.companyId },
        )
        const currentBalance = balanceData || 0
        if (currentBalance < effectiveCost) {
          throw new Error(
            `Insufficient credits. Available: ${currentBalance}, Requested: ${effectiveCost}`,
          )
        }

        // Charge after the status flip below (same order as source).
        pendingCreditCost = effectiveCost
      }

      const { data: updateData, error: updateError } = await admin
        .from('interview_sessions')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', interviewSession.id)
        .eq('status', 'pending')
        .select('id')

      if (updateError) {
        throw new Error('Failed to start interview session')
      }
      if (updateData.length === 0) {
        throw new CandidateTokenError(
          'INTERVIEW_ALREADY_STARTED',
          'This interview has already been started',
        )
      }

      if (!stub && pendingCreditCost !== undefined) {
        const { data: creditResult, error: creditError } = await admin.rpc(
          'consume_company_credits',
          {
            p_company_id: interviewSession.companyId,
            p_amount: pendingCreditCost,
            p_description: `Screening Interview - ${interviewSession.candidateName}`,
            p_reference_type: 'interview_session',
            p_reference_id: interviewSession.id,
            p_transaction_type: 'screening_interview',
          },
        )

        const creditRow = creditResult?.[0]
        if (creditError || !creditRow?.success) {
          // Interview started but charge failed — prefer free interview over
          // charge-without-service (source interview-start parity).
          console.error(
            '[interview-start] Credit consumption failed AFTER interview started',
            creditError || creditRow?.error_message,
            'session:',
            interviewSession.id,
          )
        }
      }

      if (interviewSession.interviewContext.questions.length === 0) {
        throw new Error(
          'Interview configuration error - no questions available',
        )
      }
      const firstQuestion = interviewSession.interviewContext.questions[0]

      return {
        success: true as const,
        sessionId: interviewSession.id,
        candidateName: interviewSession.candidateName,
        jobTitle: interviewSession.jobTitle,
        companyName: interviewSession.companyName,
        firstQuestion: toPublicQuestion(firstQuestion),
        totalQuestions: interviewSession.interviewContext.questions.length,
      }
    } catch (error) {
      asInterviewError(error)
    }
  })

const conversationInputSchema = z.object({
  token: z.string().min(1),
  questionId: z.string().min(1),
  response: z.string().min(1),
})

/**
 * Process one interview turn (all question types + AI tool-calling).
 * Rate-limited at 15/min/IP (source interview-conversation).
 */
export const submitInterviewResponse = createServerFn({ method: 'POST' })
  .middleware([
    candidateTokenMiddleware({
      kind: 'interview',
      rateLimit: true,
      requireStatus: 'in_progress',
    }),
  ])
  .validator(conversationInputSchema)
  .handler(async ({ data, context }) => {
    try {
      return await processInterviewResponse(
        context.admin,
        context.interviewSession!,
        data.questionId,
        data.response,
      )
    } catch (error) {
      asInterviewError(error)
    }
  })

/**
 * Mint a signed Storage upload URL for interview audio (ADR-0003).
 * Path: `{companyId}/{jobId}/interview-audio/{sessionId}/{uuid}.webm`
 * in the existing `resumes` bucket (service-role signed URL).
 */
export const prepareInterviewAudioUpload = createServerFn({ method: 'POST' })
  .middleware([
    candidateTokenMiddleware({
      kind: 'interview',
      rateLimit: false,
      requireStatus: 'in_progress',
    }),
  ])
  .validator(z.object({ token: z.string().min(1) }))
  .handler(async ({ context }) => {
    try {
      const { admin } = context
      const interviewSession = context.interviewSession!
      const path = `${interviewSession.companyId}/${interviewSession.jobId}/interview-audio/${interviewSession.id}/${crypto.randomUUID()}.webm`

      const { data: signed, error: signedError } = await admin.storage
        .from('resumes')
        .createSignedUploadUrl(path)

      if (signedError) {
        throw new Error(
          `Failed to prepare audio upload: ${signedError.message}`,
        )
      }

      return {
        path: signed.path,
        token: signed.token,
        signedUrl: signed.signedUrl,
      }
    } catch (error) {
      asInterviewError(error)
    }
  })

const transcribeInputSchema = z.object({
  token: z.string().min(1),
  audioPath: z.string().min(1),
})

/**
 * Transcribe audio previously uploaded to Storage. Own rate limit bucket
 * (10/min/IP) — separate from conversation turns.
 */
export const transcribeInterviewAudioFn = createServerFn({ method: 'POST' })
  .middleware([
    candidateTokenMiddleware({
      kind: 'interview',
      rateLimit: false,
      requireStatus: 'in_progress',
    }),
  ])
  .validator(transcribeInputSchema)
  .handler(async ({ data, context }) => {
    try {
      const rate = await checkIpRateLimit(
        'interview-transcribe',
        context.clientIp,
      )
      if (!rate.success) {
        throw new CandidateTokenError(
          'RATE_LIMITED',
          'Rate limit exceeded. Maximum 10 transcriptions per minute. Try again after 1 minute.',
        )
      }

      const { interviewSession, admin } = {
        interviewSession: context.interviewSession!,
        admin: context.admin,
      }
      const expectedPrefix = `${interviewSession.companyId}/${interviewSession.jobId}/interview-audio/${interviewSession.id}/`
      if (
        !data.audioPath.startsWith(expectedPrefix) ||
        data.audioPath.includes('..') ||
        !data.audioPath.endsWith('.webm')
      ) {
        throw new Error('Invalid audio storage path')
      }

      const folder = data.audioPath.split('/').slice(0, -1).join('/')
      const fileName = data.audioPath.split('/').pop() ?? data.audioPath
      const { data: exists, error: existsError } = await admin.storage
        .from('resumes')
        .list(folder, {
          search: fileName,
          limit: 1,
        })

      if (existsError) {
        throw new Error(
          `Failed to verify audio upload: ${existsError.message}`,
        )
      }
      if (exists.length === 0) {
        throw new Error(
          'Audio file not found in Storage — upload before transcribing',
        )
      }

      const result = await transcribeInterviewAudio(admin, data.audioPath)
      return {
        text: result.text,
        language: result.language,
        duration: result.duration,
      }
    } catch (error) {
      asInterviewError(error)
    }
  })
