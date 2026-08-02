import { createMiddleware } from '@tanstack/react-start'
import { getRequestHeader, getRequestIP } from '@tanstack/react-start/server'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, FormQuestionsJson } from '#/integrations/supabase/types'
import { getAdminClient } from '../lib/supabase'
import { checkIpRateLimit } from '../lib/rate-limit'
import type { RateLimitBucket } from '../lib/rate-limit'

export type CandidateTokenKind = 'form' | 'interview'

export class CandidateTokenError extends Error {
  readonly code:
    | 'FORM_NOT_FOUND'
    | 'FORM_DISABLED'
    | 'FORM_EXPIRED'
    | 'RATE_LIMITED'
    | 'INTERVIEW_NOT_FOUND'

  constructor(
    code: CandidateTokenError['code'],
    message: string,
  ) {
    super(message)
    this.name = 'CandidateTokenError'
    this.code = code
  }
}

export type FormTokenContext = {
  id: string
  jobId: string
  companyId: string
  isEnabled: boolean
  expiresAt: string | null
  /** Job-specific snapshot; empty array means mandatory-only (no template fallback). */
  questions: FormQuestionsJson
  customQuestionText: Record<string, string>
  formTemplateQuestions: FormQuestionsJson
  jobTitle: string
  companyName: string
  jobLink: string | null
  jobDescriptionRaw: string | null
  jobStatus: string | null
}

type CandidateTokenMiddlewareOptions = {
  kind: CandidateTokenKind
  /**
   * When true (default), enforce the IP sliding-window limit for this kind.
   * Form GET / signed-upload prep pass `false` so a single apply journey is not
   * burned by the source's 3/min submit budget (ADR-0015).
   */
  rateLimit?: boolean
}

function resolveClientIp(): string {
  const forwarded = getRequestHeader('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  const realIp = getRequestHeader('x-real-ip')
  if (realIp) return realIp.trim()
  const cfIp = getRequestHeader('cf-connecting-ip')
  if (cfIp) return cfIp.trim()
  return getRequestIP({ xForwardedFor: true }) ?? 'unknown'
}

function rateLimitBucket(kind: CandidateTokenKind): RateLimitBucket {
  return kind === 'form' ? 'form-submit' : 'interview'
}

async function loadFormTokenContext(
  admin: SupabaseClient<Database>,
  token: string,
): Promise<FormTokenContext> {
  const { data, error } = await admin
    .from('job_form_configs')
    .select(
      `
      id,
      is_enabled,
      expires_at,
      questions,
      custom_question_text,
      form_templates ( questions ),
      jobs (
        id,
        title,
        company_id,
        status,
        job_posting_link,
        job_description_raw,
        companies ( name )
      )
    `,
    )
    .eq('form_url_token', token)
    .maybeSingle()

  if (error || !data) {
    throw new CandidateTokenError(
      'FORM_NOT_FOUND',
      'Form not found or has expired',
    )
  }

  // Nested job join is required for company/path scoping; treat missing as 404.
  const job = data.jobs as {
    id: string
    title: string
    company_id: string
    status: string | null
    job_posting_link: string | null
    job_description_raw: string | null
    companies: { name: string } | null
  } | null
  if (!job) {
    throw new CandidateTokenError(
      'FORM_NOT_FOUND',
      'Form not found or has expired',
    )
  }

  if (!data.is_enabled) {
    throw new CandidateTokenError('FORM_DISABLED', 'Form is disabled')
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    throw new CandidateTokenError('FORM_EXPIRED', 'Form has expired')
  }

  const templateQuestions = data.form_templates.questions

  return {
    id: data.id,
    jobId: job.id,
    companyId: job.company_id,
    isEnabled: data.is_enabled,
    expiresAt: data.expires_at,
    // Empty array is a valid job-specific snapshot (= mandatory-only); do not
    // coerce to null or get-form falls back to the company template (source
    // form-get-form: `Array.isArray(questions) ? questions : null`).
    questions: data.questions,
    customQuestionText: data.custom_question_text,
    formTemplateQuestions: templateQuestions,
    jobTitle: job.title || 'Job Application',
    companyName: job.companies?.name || 'Company',
    jobLink: job.job_posting_link,
    jobDescriptionRaw: job.job_description_raw,
    jobStatus: job.status,
  }
}

/**
 * Applicant token middleware — validates a form (or, later, interview) token,
 * attaches the admin client + config to context, and optionally enforces IP
 * rate limiting. Symmetric counterpart to `authMiddleware` (spec §Applicant
 * token flows; ADR-0004 / ADR-0015).
 */
export function candidateTokenMiddleware(
  options: CandidateTokenMiddlewareOptions,
) {
  const rateLimit = options.rateLimit ?? true

  return createMiddleware({ type: 'function' })
    .validator(
      z
        .object({
          token: z.string().min(1, 'Form token is required'),
        })
        .passthrough(),
    )
    .server(async ({ next, data }) => {
      const clientIp = resolveClientIp()

      if (rateLimit) {
        const result = await checkIpRateLimit(
          rateLimitBucket(options.kind),
          clientIp,
        )
        if (!result.success) {
          throw new CandidateTokenError(
            'RATE_LIMITED',
            'Rate limit exceeded. Maximum 3 form submissions per minute. Try again after 1 minute.',
          )
        }
      }

      const admin = getAdminClient()

      if (options.kind === 'interview') {
        throw new CandidateTokenError(
          'INTERVIEW_NOT_FOUND',
          'Interview token flows are not implemented yet',
        )
      }

      const formConfig = await loadFormTokenContext(admin, data.token)

      return next({
        context: {
          admin,
          clientIp,
          formConfig,
          userAgent: getRequestHeader('user-agent') ?? 'unknown',
        },
      })
    })
}
