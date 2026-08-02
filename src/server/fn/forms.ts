import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import type { FormQuestion, FormSubmissionDataJson } from '#/integrations/supabase/types'
import {
  CandidateTokenError,
  candidateTokenMiddleware,
} from '../middleware/candidate-token'
import {
  InsufficientCreditsError,
  processJobApplicationPipeline,
} from '../lib/ai/process-job-application-pipeline'

const MANDATORY_QUESTIONS: FormQuestion[] = [
  {
    id: 'name',
    baseId: 'name',
    type: 'text',
    label: 'Full Name',
    placeholder: 'Enter your full name',
    required: true,
    isMandatory: true,
    isCustom: false,
  },
  {
    id: 'email',
    baseId: 'email',
    type: 'email',
    label: 'Email Address',
    placeholder: 'Enter your email address',
    required: true,
    isMandatory: true,
    isCustom: false,
  },
  {
    id: 'phone',
    baseId: 'phone',
    type: 'number',
    label: 'Phone Number',
    placeholder: 'Enter your phone number',
    required: true,
    isMandatory: true,
    isCustom: false,
  },
  {
    id: 'resume',
    baseId: 'resume',
    type: 'file',
    label: 'Resume',
    required: true,
    isMandatory: true,
    isCustom: false,
  },
]

function buildQuestions(
  jobSpecific: FormQuestion[] | null,
  template: FormQuestion[] | null,
): FormQuestion[] {
  // Source parity: only fall back to the template when `questions` is nullish,
  // not when it is an explicit empty snapshot.
  const base = jobSpecific !== null ? jobSpecific : (template ?? [])
  const mandatoryIds = new Set(MANDATORY_QUESTIONS.map((q) => q.baseId || q.id))
  const nonMandatory = base
    .filter((q) => !mandatoryIds.has(q.baseId || q.id))
    .map((q) =>
      q.isCustom
        ? {
            ...q,
            required: true,
            placeholder: q.placeholder ?? 'Enter your response to the question',
          }
        : q,
    )
  return [...MANDATORY_QUESTIONS, ...nonMandatory]
}

function asFormError(error: unknown): never {
  if (error instanceof CandidateTokenError) throw error
  if (error instanceof InsufficientCreditsError) {
    throw new Error(
      'This job is temporarily not accepting applications. Please try again later.',
    )
  }
  throw error instanceof Error ? error : new Error(String(error))
}

/**
 * Public get-form by token. No IP rate limit (source form-get-form parity);
 * token validity still goes through `candidateTokenMiddleware`.
 */
export const getFormByToken = createServerFn({ method: 'GET' })
  .middleware([candidateTokenMiddleware({ kind: 'form', rateLimit: false })])
  .validator(z.object({ token: z.string().min(1) }))
  .handler(async ({ context }) => {
    const { formConfig } = context
    return {
      jobTitle: formConfig.jobTitle,
      companyName: formConfig.companyName,
      questions: buildQuestions(
        formConfig.questions,
        formConfig.formTemplateQuestions.length > 0
          ? formConfig.formTemplateQuestions
          : null,
      ),
      expiresAt: formConfig.expiresAt,
      customQuestionText: formConfig.customQuestionText,
      jobLink: formConfig.jobLink ?? undefined,
      jobDescriptionRaw: formConfig.jobDescriptionRaw ?? undefined,
    }
  })

const prepareUploadInputSchema = z.object({
  token: z.string().min(1),
  email: z.email('Valid email address is required'),
})

/**
 * Token-gated signed Storage upload URL. Client uploads the PDF directly to
 * Supabase Storage (ADR-0003); the submit fn receives only the path.
 */
export const prepareFormResumeUpload = createServerFn({ method: 'POST' })
  .middleware([candidateTokenMiddleware({ kind: 'form', rateLimit: false })])
  .validator(prepareUploadInputSchema)
  .handler(async ({ data, context }) => {
    try {
      const { admin, formConfig } = context

      const { data: candidateId, error: candidateError } = await admin.rpc(
        'find_or_create_candidate',
        { candidate_email: data.email },
      )
      if (candidateError || !candidateId) {
        throw new Error('Failed to create candidate record')
      }

      const timestamp = Date.now()
      const path = `${formConfig.companyId}/${formConfig.jobId}/${candidateId}_${timestamp}.pdf`

      const { data: signed, error: signedError } = await admin.storage
        .from('resumes')
        .createSignedUploadUrl(path)

      if (signedError) {
        throw new Error(
          `Failed to prepare resume upload: ${signedError.message}`,
        )
      }

      return {
        path: signed.path,
        token: signed.token,
        signedUrl: signed.signedUrl,
        candidateId,
      }
    } catch (error) {
      asFormError(error)
    }
  })

const submitFormInputSchema = z
  .object({
    token: z.string().min(1),
    name: z.string().min(1, 'Full name is required'),
    email: z.email('Valid email address is required'),
    phone: z.string().min(1, 'Phone number is required'),
    /** Storage path previously written via `prepareFormResumeUpload`. */
    resumePath: z.string().min(1, 'Resume path is required'),
    salary: z.coerce.number().min(0).optional(),
    currentSalary: z.coerce.number().min(0).optional(),
    experience: z.coerce.number().min(0).optional(),
    noticePeriod: z.coerce.number().min(0).optional(),
    qualification: z
      .enum(['High School', "Bachelor's", "Master's", 'PhD', 'Post Doc'])
      .optional(),
    relocation: z.enum(['Yes', 'No']).optional(),
    github: z.url().optional().or(z.literal('')),
  })
  .catchall(
    z.union([
      z.string().refine((val) => {
        if (!val) return true
        const wordCount = val
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0).length
        return wordCount <= 150
      }, 'Custom question response must be 150 words or less'),
      z.number(),
      z.boolean(),
    ]),
  )

/**
 * Public form submit by token. Rate-limited (3/min/IP). Creates form_submissions
 * + job_applications, then awaits the Resume AI pipeline with the admin client
 * (ADR-0014 / ADR-0015) — no fire-and-forget.
 */
export const submitFormApplication = createServerFn({ method: 'POST' })
  .middleware([candidateTokenMiddleware({ kind: 'form', rateLimit: true })])
  .validator(submitFormInputSchema)
  .handler(async ({ data, context }) => {
    try {
      const { admin, formConfig, clientIp, userAgent } = context

      // Path must match the company/job prefix issued by prepareFormResumeUpload.
      const expectedPrefix = `${formConfig.companyId}/${formConfig.jobId}/`
      if (
        !data.resumePath.startsWith(expectedPrefix) ||
        data.resumePath.includes('..') ||
        !data.resumePath.toLowerCase().endsWith('.pdf')
      ) {
        throw new Error('Invalid resume path')
      }

      const { data: resumeMeta, error: resumeStatError } = await admin.storage
        .from('resumes')
        .list(`${formConfig.companyId}/${formConfig.jobId}`, {
          search: data.resumePath.split('/').pop() ?? data.resumePath,
          limit: 1,
        })
      if (resumeStatError) {
        throw new Error(`Failed to verify resume upload: ${resumeStatError.message}`)
      }
      if (resumeMeta.length === 0) {
        throw new Error('Resume file not found in Storage — upload before submitting')
      }

      // Credit gate (source form-submit parity). Stub pipeline skips consume later.
      const { data: serviceCost } = await admin.rpc('get_company_service_cost', {
        p_company_id: formConfig.companyId,
        p_service_code: 'resume_screening',
      })
      const effectiveCost = serviceCost ?? 5
      const { data: creditBalance, error: creditError } = await admin.rpc(
        'get_company_credit_balance',
        { p_company_id: formConfig.companyId },
      )
      if (
        !creditError &&
        (typeof creditBalance !== 'number' || creditBalance < effectiveCost)
      ) {
        throw new Error(
          'This job is temporarily not accepting applications. Please try again later.',
        )
      }

      const { data: dupCount, error: dupError } = await admin.rpc(
        'check_duplicate_application_email',
        {
          candidate_email: data.email,
          target_job_id: formConfig.jobId,
        },
      )
      if (!dupError && dupCount !== 0) {
        throw new Error('You have already applied to this job')
      }

      const { data: candidateId, error: candidateError } = await admin.rpc(
        'find_or_create_candidate',
        { candidate_email: data.email },
      )
      if (candidateError || !candidateId) {
        throw new Error('Failed to create candidate record')
      }

      // Resume path should contain this candidate id (issued at prepare time).
      const fileName = data.resumePath.split('/').pop() ?? ''
      if (!fileName.startsWith(`${candidateId}_`)) {
        throw new Error('Resume path does not match applicant email')
      }

      const submissionData: FormSubmissionDataJson = {
        phone: data.phone,
        salary: data.salary,
        currentSalary: data.currentSalary,
        experience: data.experience,
        noticePeriod: data.noticePeriod,
        qualification: data.qualification,
        relocation: data.relocation,
        github: data.github,
        ...Object.fromEntries(
          Object.entries(data)
            .filter(([key]) => key.startsWith('customQuestion_'))
            .map(([key, value]) => [key, String(value)]),
        ),
      }

      const { data: submission, error: submissionError } = await admin
        .from('form_submissions')
        .insert({
          job_form_config_id: formConfig.id,
          candidate_id: candidateId,
          submission_data: submissionData,
          resume_path: data.resumePath,
          ip_address: clientIp,
          user_agent: userAgent,
          processing_status: 'pending',
        })
        .select('id')
        .single()

      if (submissionError) {
        throw new Error(
          `Failed to save form submission: ${submissionError.message}`,
        )
      }

      const { data: firstStage, error: stageError } = await admin
        .from('job_stages')
        .select('id')
        .eq('job_id', formConfig.jobId)
        .order('stage_order', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (stageError || !firstStage) {
        throw new Error(
          'This job is not configured to accept applications yet (missing hiring stages).',
        )
      }

      const { data: application, error: applicationError } = await admin
        .from('job_applications')
        .insert({
          job_id: formConfig.jobId,
          candidate_id: candidateId,
          resume_url: data.resumePath,
          current_stage_id: firstStage.id,
          status: 'pending',
          processing_source: 'form',
        })
        .select('id')
        .single()

      if (applicationError) {
        throw new Error(
          `Failed to create job application: ${applicationError.message}`,
        )
      }

      const applicationId = application.id
      await processJobApplicationPipeline(admin, { applicationId })

      await admin
        .from('form_submissions')
        .update({
          processing_status: 'processed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', submission.id)

      return {
        success: true as const,
        submissionId: submission.id,
        applicationId,
        message:
          'Your application has been submitted successfully and is being processed.',
      }
    } catch (error) {
      asFormError(error)
    }
  })
