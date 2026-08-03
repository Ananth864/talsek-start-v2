import { createMiddleware } from '@tanstack/react-start'
import { getRequestHeader, getRequestIP } from '@tanstack/react-start/server'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  FormQuestionsJson,
  InterviewSessionContextJson,
  QuestionCompletedJson,
  QuestionFollowUpJson,
} from '#/integrations/supabase/types'
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
    | 'INTERVIEW_EXPIRED'
    | 'INTERVIEW_ALREADY_STARTED'
    | 'INTERVIEW_COMPLETED'
    | 'INTERVIEW_INACTIVE'

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

export type InterviewTokenContext = {
  id: string
  token: string
  status: Database['public']['Enums']['interview_session_status']
  expiresAt: string | null
  currentQuestionIndex: number
  questionsCompleted: QuestionCompletedJson[]
  currentQuestionFollowUps: QuestionFollowUpJson[]
  interviewContext: InterviewSessionContextJson
  jobApplicationId: string
  candidateId: string
  jobId: string
  companyId: string
  candidateName: string
  jobTitle: string
  companyName: string
  salaryRange: string | null
}

type InterviewRequireStatus = 'pending' | 'in_progress'

type CandidateTokenMiddlewareOptions = {
  kind: CandidateTokenKind
  /**
   * When true (default), enforce the IP sliding-window limit for this kind.
   * Form GET / signed-upload prep pass `false` so a single apply journey is not
   * burned by the source's 3/min submit budget (ADR-0015). Interview start /
   * session GET / audio prep pass `false`; conversation uses the interview
   * bucket. Transcription enforces its own `interview-transcribe` bucket in
   * the handler (source: 10/min vs conversation 15/min).
   */
  rateLimit?: boolean
  /** Interview-only: require a specific session status after load. */
  requireStatus?: InterviewRequireStatus
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

function rateLimitMessage(kind: CandidateTokenKind): string {
  return kind === 'form'
    ? 'Rate limit exceeded. Maximum 3 form submissions per minute. Try again after 1 minute.'
    : 'Rate limit exceeded. Maximum 15 interview messages per minute. Try again after 1 minute.'
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

async function loadInterviewTokenContext(
  admin: SupabaseClient<Database>,
  token: string,
  requireStatus?: InterviewRequireStatus,
): Promise<InterviewTokenContext> {
  const { data, error } = await admin
    .from('interview_sessions')
    .select(
      `
      id,
      token,
      status,
      expires_at,
      current_question_index,
      questions_completed,
      current_question_follow_ups,
      interview_context,
      job_application_id,
      candidate_id,
      job_id,
      job_applications (
        candidate_name,
        jobs (
          title,
          salary_range,
          companies (
            id,
            name
          )
        )
      )
    `,
    )
    .eq('token', token)
    .maybeSingle()

  if (error || !data) {
    throw new CandidateTokenError(
      'INTERVIEW_NOT_FOUND',
      'Invalid interview link',
    )
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    throw new CandidateTokenError(
      'INTERVIEW_EXPIRED',
      'This interview link has expired',
    )
  }

  if (data.status === 'expired') {
    throw new CandidateTokenError(
      'INTERVIEW_EXPIRED',
      'This interview link has expired',
    )
  }

  if (requireStatus === 'pending') {
    if (data.status === 'completed') {
      throw new CandidateTokenError(
        'INTERVIEW_COMPLETED',
        'This interview has already been completed',
      )
    }
    if (data.status === 'in_progress') {
      throw new CandidateTokenError(
        'INTERVIEW_ALREADY_STARTED',
        'This interview has already been started',
      )
    }
  }

  if (requireStatus === 'in_progress' && data.status !== 'in_progress') {
    throw new CandidateTokenError(
      'INTERVIEW_INACTIVE',
      'Invalid or inactive interview session',
    )
  }

  const jobApplication = data.job_applications as {
    candidate_name: string | null
    jobs: {
      title: string | null
      salary_range: string
      companies: { id: string; name: string | null } | null
    } | null
  } | null

  const job = jobApplication?.jobs
  const company = job?.companies
  if (!company?.id) {
    throw new CandidateTokenError(
      'INTERVIEW_NOT_FOUND',
      'Invalid interview link',
    )
  }

  return {
    id: data.id,
    token: data.token,
    status: data.status,
    expiresAt: data.expires_at,
    currentQuestionIndex: data.current_question_index,
    questionsCompleted: data.questions_completed,
    currentQuestionFollowUps: data.current_question_follow_ups,
    interviewContext: data.interview_context,
    jobApplicationId: data.job_application_id,
    candidateId: data.candidate_id,
    jobId: data.job_id,
    companyId: company.id,
    candidateName: jobApplication?.candidate_name || 'Candidate',
    jobTitle: job?.title || 'Position',
    companyName: company.name || 'Company',
    salaryRange: job?.salary_range ?? null,
  }
}

/**
 * Applicant token middleware — validates a form or interview token, attaches
 * the admin client + config/session to context, and optionally enforces IP
 * rate limiting. Symmetric counterpart to `authMiddleware` (spec §Applicant
 * token flows; ADR-0004 / ADR-0015 / ADR-0017).
 */
export function candidateTokenMiddleware(
  options: CandidateTokenMiddlewareOptions,
) {
  const rateLimit = options.rateLimit ?? true

  return createMiddleware({ type: 'function' })
    .validator(
      z
        .object({
          token: z.string().min(1, 'Token is required'),
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
            rateLimitMessage(options.kind),
          )
        }
      }

      const admin = getAdminClient()
      const userAgent = getRequestHeader('user-agent') ?? 'unknown'

      const context: {
        admin: typeof admin
        clientIp: string
        userAgent: string
        formConfig: FormTokenContext | undefined
        interviewSession: InterviewTokenContext | undefined
      } = {
        admin,
        clientIp,
        userAgent,
        formConfig: undefined,
        interviewSession: undefined,
      }

      if (options.kind === 'interview') {
        context.interviewSession = await loadInterviewTokenContext(
          admin,
          data.token,
          options.requireStatus,
        )
      } else {
        context.formConfig = await loadFormTokenContext(admin, data.token)
      }

      return next({ context })
    })
}
