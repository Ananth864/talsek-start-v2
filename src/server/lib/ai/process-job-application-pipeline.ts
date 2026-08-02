import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  EmailContentJson,
  ResumeExtractionJson,
} from '#/integrations/supabase/types'
import { normalizeRequirementList } from '#/lib/requirements'
import { logAIError } from './ai-services'
import {
  deterministicEmailInsights,
  deterministicJobMatchWrite,
  deterministicResumeExtraction,
  shouldUseAiPipelineStub,
} from './pipeline-stub'
import { runEmailAnalysis } from './run-email-analysis'
import { runJobMatchAnalysis } from './run-job-match-analysis'
import { runResumeExtraction } from './run-resume-extraction'

export type ProcessJobApplicationPipelineInput = {
  applicationId: string
  /**
   * When true, skip Resume Extraction and score existing
   * `parsed_candidate_data` (bulk-upload path — ticket #10).
   */
  skipExtraction?: boolean
}

export type ProcessJobApplicationPipelineResult = {
  success: true
  applicationId: string
  extractedName: string
  finalScore: number
  matchScore: number
  emailAnalysisRan: boolean
  stubUsed: boolean
  message: string
}

export class InsufficientCreditsError extends Error {
  readonly code = 'INSUFFICIENT_CREDITS' as const
  readonly required: number
  readonly available: number

  constructor(message: string, required: number, available: number) {
    super(message)
    this.name = 'InsufficientCreditsError'
    this.required = required
    this.available = available
  }
}

function isValidationError(error: Error): boolean {
  return (
    error.message.includes('validation') ||
    error.message.includes('schema') ||
    error.message.includes('invalid') ||
    error.name === 'ZodError'
  )
}

async function markFailed(
  client: SupabaseClient<Database>,
  applicationId: string,
  error: Error,
) {
  await client
    .from('job_applications')
    .update({
      status: isValidationError(error) ? 'failed_validation' : 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
}

/**
 * Synchronous Resume AI pipeline — Resume Extraction → Job Match Analysis →
 * optional Email Analysis, all awaited in one request (ADR-0003 / ADR-0014).
 * Collapses the source's fire-and-forget edge-function chain into in-process
 * calls. Accepts any Supabase client: Members pass the user-scoped client
 * (RLS); session-less callers (#11 form/email, #10 bulk) pass `getAdminClient()`.
 */
export async function processJobApplicationPipeline(
  client: SupabaseClient<Database>,
  input: ProcessJobApplicationPipelineInput,
): Promise<ProcessJobApplicationPipelineResult> {
  const { applicationId, skipExtraction = false } = input
  const stub = shouldUseAiPipelineStub()
  const now = () => new Date().toISOString()

  try {
    const { data: jobApplication, error: applicationError } = await client
      .from('job_applications')
      .select(
        `
        id, candidate_id, job_id, resume_url, status, processing_source,
        parsed_candidate_data, email_content, candidate_name,
        jobs!inner (
          id, title, company_id, parsed_job_data,
          preferred_requirements, non_negotiables,
          companies!fk_jobs_company_id ( id, name )
        )
      `,
      )
      .eq('id', applicationId)
      .single()

    if (applicationError) {
      throw new Error(
        `Failed to fetch job application: ${applicationError.message}`,
      )
    }

    const job = jobApplication.jobs
    const companyId = job.company_id
    const companyName = job.companies.name

    if (!skipExtraction) {
      const { error: processingError } = await client
        .from('job_applications')
        .update({ status: 'processing', updated_at: now() })
        .eq('id', applicationId)
      if (processingError) {
        console.warn(
          `[pipeline] Failed to set processing status:`,
          processingError.message,
        )
      }
    }

    let extracted: ResumeExtractionJson

    if (skipExtraction) {
      const existing = jobApplication.parsed_candidate_data
      if (!existing.name || existing.name === 'not mentioned') {
        throw new Error(
          'No parsed candidate data found — resume extraction may have failed',
        )
      }
      extracted = existing
    } else if (stub) {
      extracted = deterministicResumeExtraction(applicationId)
    } else {
      const resumeUrl = jobApplication.resume_url
      if (!resumeUrl) {
        throw new Error('Job Application has no resume_url in Storage')
      }

      const { data: fileData, error: downloadError } = await client.storage
        .from('resumes')
        .download(resumeUrl)

      if (downloadError) {
        throw new Error(`Failed to download resume: ${downloadError.message}`)
      }

      const resumeBytes = new Uint8Array(await fileData.arrayBuffer())
      const extraction = await runResumeExtraction({ resumeBytes })
      extracted = extraction.extracted
      console.log(`[pipeline] Resume Extraction complete:`, {
        applicationId,
        name: extracted.name,
        modelUsed: extraction.modelUsed,
        fallbackUsed: extraction.fallbackUsed,
      })
    }

    if (!skipExtraction) {
      const { error: saveExtractError } = await client
        .from('job_applications')
        .update({
          candidate_name: extracted.name,
          parsed_candidate_data: extracted,
          updated_at: now(),
        })
        .eq('id', applicationId)

      if (saveExtractError) {
        throw new Error(
          `Failed to save extracted data: ${saveExtractError.message}`,
        )
      }
    }

    // Credits — skipped in stub mode so E2E re-runs do not drain the company.
    if (!stub) {
      const { data: creditCost, error: costError } = await client.rpc(
        'get_company_service_cost',
        {
          p_company_id: companyId,
          p_service_code: 'resume_screening',
        },
      )
      if (costError) {
        throw new Error('Failed to determine service cost')
      }
      // Source defaults to 5 when the RPC returns null; the generated type is
      // `number`, so fall back only when the value is missing/zero-ish.
      const effectiveCost = creditCost > 0 ? creditCost : 5

      const { data: creditResult, error: creditError } = await client.rpc(
        'consume_company_credits',
        {
          p_company_id: companyId,
          p_amount: effectiveCost,
          p_description: `Resume Screening - ${extracted.name}`,
          p_reference_type: 'job_application',
          p_reference_id: applicationId,
          p_transaction_type: 'resume_screening',
        },
      )
      if (creditError) {
        throw new Error('Failed to process credits for resume screening')
      }
      const creditConsumeResult = creditResult[0]
      if (!creditConsumeResult.success) {
        throw new InsufficientCreditsError(
          creditConsumeResult.error_message || 'Insufficient credits',
          effectiveCost,
          creditConsumeResult.remaining_balance,
        )
      }
    }

    const preferred = normalizeRequirementList(
      job.preferred_requirements,
      'preferred',
    )
    const nonNegotiables = normalizeRequirementList(
      job.non_negotiables,
      'non_negotiable',
    )

    const matchWrite = stub
      ? deterministicJobMatchWrite({ preferred, nonNegotiables })
      : await runJobMatchAnalysis({
          extracted,
          jobTitle: job.title,
          companyName,
          preferredRequirements: job.preferred_requirements,
          nonNegotiables: job.non_negotiables,
          parsedJobData: job.parsed_job_data,
        })

    const { error: matchSaveError } = await client
      .from('job_applications')
      .update({
        match_score: matchWrite.matchScore,
        final_score: matchWrite.finalScore,
        meets_all_non_negotiables: matchWrite.meetsAllNonNegotiables,
        preferred_requirements_matched: matchWrite.preferredRequirementsMet,
        ai_analysis: matchWrite.aiAnalysis,
        updated_at: now(),
      })
      .eq('id', applicationId)

    if (matchSaveError) {
      throw new Error(
        `Failed to save analysis results: ${matchSaveError.message}`,
      )
    }

    const { error: activeError } = await client
      .from('job_applications')
      .update({ status: 'active', updated_at: now() })
      .eq('id', applicationId)

    if (activeError) {
      console.warn(
        `[pipeline] Failed to set active status:`,
        activeError.message,
      )
    }

    let emailAnalysisRan = false
    const shouldAnalyzeEmail = jobApplication.processing_source === 'email'
    const emailContent = jobApplication.email_content as EmailContentJson | null
    const emailBody = emailContent?.email_body

    if (shouldAnalyzeEmail && emailBody) {
      try {
        const insights = stub
          ? deterministicEmailInsights()
          : (await runEmailAnalysis({
              candidateName: extracted.name || 'Candidate',
              emailBody,
            })).insights

        const { error: emailSaveError } = await client
          .from('job_applications')
          .update({
            email_content: {
              email_body: emailBody,
              email_analysis: insights,
            },
            updated_at: now(),
          })
          .eq('id', applicationId)

        if (emailSaveError) {
          console.warn(
            `[pipeline] Email analysis save failed (non-critical):`,
            emailSaveError.message,
          )
        } else {
          emailAnalysisRan = true
        }
      } catch (emailError) {
        // Soft-fail — application stays active (source parity).
        logAIError(emailError, 'Email Insights Extraction', { applicationId })
        console.warn(
          `[pipeline] Email analysis failed — continuing with active status`,
        )
      }
    }

    return {
      success: true,
      applicationId,
      extractedName: extracted.name,
      finalScore: matchWrite.finalScore,
      matchScore: matchWrite.matchScore,
      emailAnalysisRan,
      stubUsed: stub,
      message: emailAnalysisRan
        ? 'Resume pipeline completed (extraction → match → email) in one request'
        : 'Resume pipeline completed (extraction → match) in one request',
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logAIError(err, 'Resume AI Pipeline', { applicationId })

    // Insufficient credits: source returns 402 without marking failed.
    if (!(error instanceof InsufficientCreditsError)) {
      try {
        await markFailed(client, applicationId, err)
      } catch (dbError) {
        console.error(`[pipeline] Failed to save error state:`, dbError)
      }
    }

    throw err
  }
}
