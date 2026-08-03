import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth'
import { getAdminClient, getRequestOrigin } from '../lib/supabase'
import {
  InsufficientCreditsError,
  processJobApplicationPipeline,
} from '../lib/ai/process-job-application-pipeline'
import {
  deterministicResumeExtraction,
  shouldUseAiPipelineStub,
} from '../lib/ai/pipeline-stub'
import { runResumeExtraction } from '../lib/ai/run-resume-extraction'
import { isEmailStub } from '../lib/email'
import { sendReachoutAndAdvance } from '../lib/reachout-send'
import type { ResumeExtractionJson } from '#/integrations/supabase/types'

/**
 * Bulk resume upload + bulk Shortlist Reachout + bulk reject (#10 / #21).
 * Client uploads PDFs to Storage; server functions receive paths only
 * (ADR-0003 / ADR-0016). Bulk Shortlist reuses `sendReachoutAndAdvance`
 * (ADR-0023 / ADR-0024).
 */

const MAX_BULK_SHORTLIST = 10
const MAX_BULK_REJECT = 100
const BULK_REACHOUT_DELAY_MS = 500

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const jobIdSchema = z.object({
  jobId: z.string().uuid(),
})

function emailIsValid(email: string | null | undefined): email is string {
  if (!email) return false
  const trimmed = email.trim().toLowerCase()
  if (!trimmed || trimmed === 'not mentioned') return false
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)
}

export type BulkResumeUploadReason =
  | 'ok'
  | 'missing_email'
  | 'invalid_file'
  | 'insufficient_credits'
  | 'credit_check_failed'
  | 'error'

export type BulkResumeUploadResult = {
  success: boolean
  reason: BulkResumeUploadReason
  message: string
  candidateEmail?: string
  candidateId?: string
  applicationId?: string
}

/**
 * Mint a Storage path + signed upload URL for one bulk resume. Proves Job
 * access via RLS on the user-scoped client, then uses the admin client only
 * to create the signed URL (ADR-0016).
 */
export const prepareBulkResumeUpload = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(jobIdSchema)
  .handler(async ({ data, context }) => {
    const { data: job, error: jobError } = await context.supabase
      .from('jobs')
      .select('id, company_id')
      .eq('id', data.jobId)
      .single()

    if (jobError) {
      throw new Error('Job not found or inaccessible.')
    }

    const path = `${job.company_id}/${job.id}/${crypto.randomUUID()}.pdf`
    const admin = getAdminClient()
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
    }
  })

const processBulkSchema = z.object({
  jobId: z.string().uuid(),
  /** Storage path previously written via `prepareBulkResumeUpload`. */
  resumePath: z.string().min(1),
  /** Optional Member override; wins over AI-extracted email. */
  email: z.union([z.string().email(), z.literal('')]).optional(),
})

export type ProcessBulkResumeUploadInput = z.infer<typeof processBulkSchema>

/**
 * Process one bulk-uploaded resume path: verify Storage object, extract (or
 * stub), resolve email, create/overwrite Job Application, await match with
 * `skipExtraction: true` (ADR-0014 §7 / ADR-0016).
 */
export const processBulkResumeUpload = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(processBulkSchema)
  .handler(async ({ data, context }): Promise<BulkResumeUploadResult> => {
    const client = context.supabase

    try {
      const { data: job, error: jobError } = await client
        .from('jobs')
        .select('id, company_id')
        .eq('id', data.jobId)
        .single()

      if (jobError) {
        return {
          success: false,
          reason: 'invalid_file',
          message: 'Job not found or inaccessible.',
        }
      }

      const expectedPrefix = `${job.company_id}/${job.id}/`
      if (
        !data.resumePath.startsWith(expectedPrefix) ||
        data.resumePath.includes('..') ||
        !data.resumePath.toLowerCase().endsWith('.pdf')
      ) {
        return {
          success: false,
          reason: 'invalid_file',
          message: 'Invalid resume path.',
        }
      }

      const fileName = data.resumePath.split('/').pop() ?? data.resumePath
      const { data: resumeMeta, error: resumeStatError } = await client.storage
        .from('resumes')
        .list(`${job.company_id}/${job.id}`, {
          search: fileName,
          limit: 1,
        })
      if (resumeStatError) {
        return {
          success: false,
          reason: 'invalid_file',
          message: `Failed to verify resume upload: ${resumeStatError.message}`,
        }
      }
      if (!resumeMeta.some((obj) => obj.name === fileName)) {
        return {
          success: false,
          reason: 'invalid_file',
          message:
            'Resume file not found in Storage — upload before processing.',
        }
      }

      const stub = shouldUseAiPipelineStub()

      if (!stub) {
        const { data: serviceCost, error: costError } = await client.rpc(
          'get_company_service_cost',
          {
            p_company_id: job.company_id,
            p_service_code: 'resume_screening',
          },
        )
        if (costError) {
          console.warn(
            '[bulk-upload] Failed to fetch service cost:',
            costError.message,
          )
        }
        const effectiveCost = serviceCost ?? 5

        const { data: creditBalance, error: creditError } = await client.rpc(
          'get_company_credit_balance',
          { p_company_id: job.company_id },
        )
        if (creditError) {
          return {
            success: false,
            reason: 'credit_check_failed',
            message:
              'Unable to verify credit balance. Please try again later.',
          }
        }
        if (
          typeof creditBalance !== 'number' ||
          creditBalance < effectiveCost
        ) {
          return {
            success: false,
            reason: 'insufficient_credits',
            message:
              typeof creditBalance === 'number'
                ? `Insufficient credits. Available: ${creditBalance}, Required: ${effectiveCost}. Please top up your account.`
                : 'Insufficient credits to process this resume. Please top up your account.',
          }
        }
      }

      let extracted: ResumeExtractionJson
      if (stub) {
        // Unique-ish stub seed from the Storage object name so parallel bulk
        // rows do not all collide on the fixed pipeline email.
        const seed = fileName.replace(/\.pdf$/i, '')
        extracted = {
          ...deterministicResumeExtraction(seed),
          email: `bulk.${seed.slice(0, 8)}@example.com`,
          name: `Bulk Candidate ${seed.slice(0, 8)}`,
        }
      } else {
        const { data: fileData, error: downloadError } = await client.storage
          .from('resumes')
          .download(data.resumePath)
        if (downloadError) {
          return {
            success: false,
            reason: 'error',
            message: `Failed to download resume: ${downloadError.message}`,
          }
        }
        const resumeBytes = new Uint8Array(await fileData.arrayBuffer())
        const extraction = await runResumeExtraction({ resumeBytes })
        extracted = extraction.extracted
      }

      const manualEmail =
        typeof data.email === 'string' && data.email.trim()
          ? data.email.trim().toLowerCase()
          : null
      const extractedEmail = extracted.email.trim().toLowerCase()
      const email = emailIsValid(manualEmail)
        ? manualEmail
        : emailIsValid(extractedEmail)
          ? extractedEmail
          : null

      if (!email) {
        return {
          success: false,
          reason: 'missing_email',
          message: 'Could not reliably extract an email from this resume.',
        }
      }

      // Keep parsed email aligned with the resolved address (manual override).
      extracted = { ...extracted, email }

      const { data: candidateId, error: candidateError } = await client.rpc(
        'find_or_create_candidate',
        { candidate_email: email },
      )
      if (candidateError || !candidateId) {
        throw new Error(
          `Failed to find/create candidate: ${candidateError?.message ?? 'unknown'}`,
        )
      }

      const { data: existingApps, error: existingFetchError } = await client
        .from('job_applications')
        .select('id')
        .eq('job_id', data.jobId)
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (existingFetchError) {
        console.warn(
          '[bulk-upload] Failed to check existing application:',
          existingFetchError.message,
        )
      }

      const existingApplicationId = existingApps?.[0]?.id ?? null

      const { data: firstStage, error: stageError } = await client
        .from('job_stages')
        .select('id')
        .eq('job_id', data.jobId)
        .order('stage_order', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (stageError) {
        return {
          success: false,
          reason: 'error',
          message:
            'This job is not configured to accept applications yet (missing hiring stages).',
        }
      }
      if (!firstStage) {
        return {
          success: false,
          reason: 'error',
          message:
            'This job is not configured to accept applications yet (missing hiring stages).',
        }
      }

      let applicationId: string

      if (existingApplicationId) {
        const { data: updated, error: updateError } = await client
          .from('job_applications')
          .update({
            resume_url: data.resumePath,
            parsed_candidate_data: extracted,
            candidate_name: extracted.name,
            status: 'pending',
            processing_source: 'bulk_upload',
            match_score: 0,
          })
          .eq('id', existingApplicationId)
          .select('id')
          .single()

        if (updateError) {
          throw new Error(
            `Failed to overwrite job application: ${updateError.message}`,
          )
        }
        applicationId = updated.id
      } else {
        const { data: inserted, error: insertError } = await client
          .from('job_applications')
          .insert({
            job_id: data.jobId,
            candidate_id: candidateId,
            resume_url: data.resumePath,
            status: 'pending',
            processing_source: 'bulk_upload',
            parsed_candidate_data: extracted,
            candidate_name: extracted.name,
            current_stage_id: firstStage.id,
          })
          .select('id')
          .single()

        if (insertError) {
          throw new Error(
            `Failed to create job application: ${insertError.message}`,
          )
        }
        applicationId = inserted.id
      }

      try {
        await processJobApplicationPipeline(client, {
          applicationId,
          skipExtraction: true,
        })
      } catch (error) {
        if (error instanceof InsufficientCreditsError) {
          return {
            success: false,
            reason: 'insufficient_credits',
            message: error.message,
            candidateEmail: email,
            candidateId,
            applicationId,
          }
        }
        throw error
      }

      return {
        success: true,
        reason: 'ok',
        candidateEmail: email,
        candidateId,
        applicationId,
        message: 'Resume processed and match analysis completed.',
      }
    } catch (error) {
      console.error('[bulk-upload] Unexpected error:', error)
      return {
        success: false,
        reason: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unexpected error during processing.',
      }
    }
  })

const bulkShortlistSchema = z.object({
  jobId: z.string().uuid(),
  applicationIds: z.array(z.string().uuid()).min(1).max(MAX_BULK_SHORTLIST),
  targetStageId: z.string().uuid(),
  templateType: z.enum(['interview', 'final']),
  customMessage: z.object({
    subject: z.string().trim().min(1).max(500),
    body: z.string().trim().min(1).max(10000),
  }),
  origin: z.string().url().optional(),
})

export type BulkShortlistJobApplicationsInput = z.infer<
  typeof bulkShortlistSchema
>

const bulkRejectSchema = z.object({
  jobId: z.string().uuid(),
  applicationIds: z.array(z.string().uuid()).min(1).max(MAX_BULK_REJECT),
})

export type BulkRejectJobApplicationsInput = z.infer<typeof bulkRejectSchema>

/**
 * Bulk Shortlist up to 10 Job Applications: send a Reachout to each (via
 * `sendReachoutAndAdvance`), then advance `current_stage_id`. Same-stage
 * selection required (source `bulk-shortlist-candidates` parity). Authoritative
 * `canSendReachout` check (ADR-0004 / ADR-0024).
 */
export const bulkShortlistJobApplications = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(bulkShortlistSchema)
  .handler(async ({ data, context }) => {
    const client = context.supabase

    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('id, email, permissions')
      .eq('id', context.session.user.id)
      .maybeSingle()
    if (profileError || !profile) {
      throw new Error('Failed to load your member profile.')
    }
    if (!profile.permissions.canSendReachout) {
      throw new Error(
        'You do not have permission to shortlist candidates. Ask a company admin to grant Send Reachouts.',
      )
    }

    const { data: targetStage, error: stageError } = await client
      .from('job_stages')
      .select('id, job_id, stage_order')
      .eq('id', data.targetStageId)
      .maybeSingle()
    if (stageError) {
      throw new Error(`Failed to resolve target stage: ${stageError.message}`)
    }
    if (!targetStage || targetStage.job_id !== data.jobId) {
      throw new Error('Target stage does not belong to this job')
    }

    const { data: applications, error: fetchError } = await client
      .from('job_applications')
      .select('id, current_stage_id, candidate_name, status')
      .eq('job_id', data.jobId)
      .in('id', data.applicationIds)

    if (fetchError) {
      throw new Error(`Failed to fetch applications: ${fetchError.message}`)
    }
    if (applications.length !== data.applicationIds.length) {
      throw new Error('One or more selected candidates were not found')
    }

    const stageIds = new Set(applications.map((a) => a.current_stage_id))
    if (stageIds.size > 1) {
      throw new Error(
        'All candidates must be in the same stage for bulk shortlisting',
      )
    }

    const currentStageId = applications[0]?.current_stage_id
    if (!currentStageId) {
      throw new Error('Selected candidates have no current stage')
    }
    const { data: currentStage, error: currentStageError } = await client
      .from('job_stages')
      .select('id, stage_order')
      .eq('id', currentStageId)
      .maybeSingle()
    if (currentStageError) {
      throw new Error('Failed to resolve current stage')
    }
    if (!currentStage) {
      throw new Error('Failed to resolve current stage')
    }
    if (targetStage.stage_order <= currentStage.stage_order) {
      throw new Error('Target stage must be further forward in the pipeline')
    }

    const origin = data.origin ?? getRequestOrigin()
    const userEmail = profile.email || context.session.user.email
    const succeeded: string[] = []
    const failed: Array<{
      applicationId: string
      candidateName: string
      error: string
    }> = []

    for (let i = 0; i < applications.length; i++) {
      const app = applications[i]
      if (app.status === 'rejected') {
        failed.push({
          applicationId: app.id,
          candidateName: app.candidate_name || 'Candidate',
          error: 'Rejected candidates cannot be shortlisted',
        })
        continue
      }

      try {
        await sendReachoutAndAdvance({
          client,
          userId: context.session.user.id,
          userEmail,
          applicationId: app.id,
          jobId: data.jobId,
          targetStageId: data.targetStageId,
          templateType: data.templateType,
          customMessage: data.customMessage,
          origin,
        })
        succeeded.push(app.id)
      } catch (error) {
        failed.push({
          applicationId: app.id,
          candidateName: app.candidate_name || 'Candidate',
          error:
            error instanceof Error ? error.message : 'Failed to shortlist',
        })
      }

      // Source rate-limits Resend (~500ms). Skip under EMAIL_STUB for E2E.
      if (!isEmailStub() && i < applications.length - 1) {
        await delay(BULK_REACHOUT_DELAY_MS)
      }
    }

    return {
      succeeded,
      failed,
      total: data.applicationIds.length,
    }
  })

/**
 * Reject selected Job Applications in one confirmed action (source
 * `BulkRejectModal` batch UPDATE). No `canSendReachout` gate — reject is a
 * separate capability from Shortlist.
 */
export const bulkRejectJobApplications = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(bulkRejectSchema)
  .handler(async ({ data, context }) => {
    const client = context.supabase

    const { data: applications, error: fetchError } = await client
      .from('job_applications')
      .select('id, candidate_name, status')
      .eq('job_id', data.jobId)
      .in('id', data.applicationIds)

    if (fetchError) {
      throw new Error(`Failed to fetch applications: ${fetchError.message}`)
    }
    if (applications.length !== data.applicationIds.length) {
      throw new Error('One or more selected candidates were not found')
    }

    const succeeded: string[] = []
    const failed: Array<{ id: string; error: string }> = []

    // Source processes in batches of 10 for UX progress; keep the same chunking.
    const batchSize = 10
    for (let i = 0; i < applications.length; i += batchSize) {
      const batch = applications.slice(i, i + batchSize)
      const batchIds = batch.map((a) => a.id)
      const { error } = await client
        .from('job_applications')
        .update({ status: 'rejected' })
        .eq('job_id', data.jobId)
        .in('id', batchIds)

      if (error) {
        for (const id of batchIds) {
          failed.push({ id, error: error.message })
        }
      } else {
        succeeded.push(...batchIds)
      }
    }

    return {
      succeeded,
      failed,
      total: data.applicationIds.length,
    }
  })
