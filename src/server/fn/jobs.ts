import { createServerFn } from '@tanstack/react-start'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth'
import { serverEnv } from '../lib/env'
import { generateObjectWithRetry } from '../lib/ai/ai-services'
import { jobParsingSchema } from '../lib/ai/schemas'
import { getJobDescriptionParsingPrompt } from '../lib/ai/prompts'
import type {
  Database,
  ParsedJobDataJson,
  RequirementItemJson,
  ScreeningInterviewInformationJson,
} from '#/integrations/supabase/types'

/**
 * Jobs read path. This is the port of the source's `selectJobsWithCompany` /
 * `useJobs` read path (ADR-0007), moved behind a user-scoped server function so
 * Row-Level Security owns company scoping (ADR-0004) — there is no manual
 * `.eq('company_id', …)` filter anywhere in this layer. The select shape, the
 * ordering, and the `['jobs', companyId]` query key (see `jobsQueryKey`) match
 * the source verbatim so later mutation/realtime invalidation ports unchanged.
 */

/**
 * Canonical Job query builder. Embeds the owning **Company** and the Job's
 * **Form Config** (apply form), matching the source's `jobSelect`. The columns
 * are enumerated explicitly rather than `*`: historically two JSON columns
 * (`parsed_job_data`, `screening_interview_information`) were placeholder-typed
 * (`unknown`) and omitted because they were neither part of the read surface
 * nor serializable across the server-function boundary. With #5 narrowing them
 * to concrete shapes (`ParsedJobDataJson` / `ScreeningInterviewInformationJson`)
 * they are now typed AND serializable, so they are re-added here (ADR-0009 §1).
 * Defined as a function of the user-scoped client so the same call serves the
 * handler and the `JobWithCompanyRow` type derivation.
 */
export function jobsQuery(client: SupabaseClient<Database>) {
  return client
    .from('jobs')
    .select(
      `id, company_id, title, status, created_at, location, salary_range,
       job_posting_link, job_description_raw, forwarding_email, forwarding_code,
       preferred_requirements, non_negotiables,
       parsed_job_data, screening_interview_information,
       companies(id, name),
       job_form_configs(id, form_url_token, is_enabled, expires_at)`,
    )
    .order('created_at', { ascending: false })
}

/** A Job row with its embedded Company + Form Config (source: `JobWithCompanyRow`). */
export type JobWithCompanyRow = NonNullable<
  Awaited<ReturnType<typeof jobsQuery>>['data']
>[number]

/**
 * Member's company Jobs, scoped by RLS via the user-scoped client. The list is
 * ordered newest-first (source parity). No company filter is applied here —
 * RLS on the attached client enforces it (ADR-0004).
 */
export const fetchJobs = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { data, error } = await jobsQuery(context.supabase)
    if (error) throw new Error(`Failed to load jobs: ${error.message}`)
    return data
  })

/**
 * The current Member's profile — company membership (`company_id`) plus
 * capabilities (`permissions`) and the embedded Company. Provides the company id
 * used to namespace the Jobs query key client- and server-side, and the
 * capability flags later enforced in application code (ADR-0004). Scoped by an
 * identity filter (`id = auth.uid()`) plus RLS; it is *not* a company filter.
 */
export const fetchMemberProfile = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from('profiles')
      .select(
        `id, company_id, first_name, last_name, email, role, permissions,
         companies(id, name)`,
      )
      .eq('id', context.session.user.id)
      .maybeSingle()
    if (error) throw new Error(`Failed to load member profile: ${error.message}`)
    return data
  })

// ─── Jobs write path (#5) ────────────────────────────────────────────────
//
// Ports the source's `parse-job-description` + `create-job` edge functions as
// user-scoped server functions (ADR-0002/ADR-0004). Two deliberate improvements
// over the source:
//   1. `canCreateJob` is enforced authoritatively inside `createJob` (the source
//      only gated client-side). ADR-0004 puts capability checks in the fn.
//   2. The INSERT runs on the user-scoped client, so RLS owns it (the source
//      used the service-role admin client, bypassing RLS). See ADR-0010 for the
//      RLS audit + the resulting admin-only INSERT consequence.

/**
 * Screening-interview configuration schema, matching
 * `ScreeningInterviewInformationJson`. For `resume_only` the dialog sends the
 * default shape; for `resume_interview` it builds from the logistics form
 * (joining date, location mode, shift, travel — #28).
 */
const screeningInterviewInformationSchema = z.object({
  expected_joining_date: z.enum([
    'Immediately (0-1 Month)',
    'In 1-2 Months',
    'In 2-3 Months',
  ]),
  job_type: z.object({
    mode: z.enum([
      'Remote (Anywhere)',
      'Remote (In Country)',
      'Hybrid',
      'Work From office',
    ]),
    location: z.string(),
    work_arrangement: z.string(),
  }),
  shift_timings: z.object({
    start: z.string(),
    end: z.string(),
  }),
  travel_requirements: z.string(),
}) satisfies z.ZodType<ScreeningInterviewInformationJson>

const parseJobInputSchema = z.object({
  title: z.string().min(1),
  location: z.string().optional().default(''),
  salary: z.string().optional().default(''),
  jobDescription: z.string().optional().default(''),
  companyName: z.string().optional().default(''),
})

const createJobInputSchema = z.object({
  title: z.string().min(1).max(200),
  jobPostingLink: z.string().optional().default(''),
  location: z.string().optional().default(''),
  salaryRange: z.string().optional().default(''),
  jobDescription: z.string().optional().default(''),
  preferredRequirements: z.array(z.string()).default([]),
  nonNegotiables: z.array(z.string()).default([]),
  serviceType: z.enum(['resume_only', 'resume_interview']),
  parsedJobData: jobParsingSchema,
  screeningInterviewInformation: screeningInterviewInformationSchema,
})

/**
 * Deterministic stand-in for the AI parse, used when no provider credentials
 * are configured (dev/E2E). The spec mandates E2E mock the non-deterministic AI
 * output; rather than wire a browser-side intercept (the parse now runs
 * server-side), the server fn itself returns a deterministic derivation from
 * the pasted JD when keys are absent. Production sets the keys and runs the real
 * `generateObject`. The shape is always a valid `ParsedJobData`.
 */
function deterministicParse(jd: {
  title: string
  jobDescription: string
}): ParsedJobDataJson {
  const lines = jd.jobDescription
    .split(/\n|\.(?=\s)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  const preferred = lines.slice(0, 2)
  const nonNegotiables = lines.slice(2, 4)
  return {
    preferred_requirements:
      preferred.length > 0
        ? preferred
        : [`Preferred qualification for ${jd.title}`],
    non_negotiables:
      nonNegotiables.length > 0
        ? nonNegotiables
        : [`Core requirement for ${jd.title}`],
    role_readiness_summary: '',
    role_readiness_questions: [],
  }
}

/**
 * Parses a pasted job description into structured requirements via the Vercel
 * AI SDK's `generateObject` (hedged, OpenAI primary → Grok fallback — ADR-0005).
 * Falls back to a deterministic derivation when no provider keys are present so
 * the flow is exercisable without credentials. Runs on a verified session.
 */
export const parseJobDescription = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(parseJobInputSchema)
  .handler(async ({ data }) => {
    // The real `generateObject` runs whenever a provider key is configured.
    // When none are present — the no-credentials default — the fn returns a
    // deterministic derivation so the parse → review → create flow is still
    // exercisable in dev/E2E without provider credentials. See ADR-0010 §5.
    if (!serverEnv.OPENAI_API_KEY && !serverEnv.GROK_API_KEY) {
      return deterministicParse(data)
    }
    const { object } = await generateObjectWithRetry({
      primaryModel: 'openai',
      fallbackModel: serverEnv.GROK_API_KEY ? 'grok' : undefined,
      schema: jobParsingSchema,
      operationName: 'Job Description Parsing',
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: getJobDescriptionParsingPrompt({
            title: data.title,
            salary_range: data.salary,
            job_description_raw: data.jobDescription,
          }),
        },
      ],
    })
    return object
  })

/** 6-char `[a-z0-9]` forwarding code (source parity). */
function generateForwardingCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/** Wraps plain requirement strings into the stored `{id, text, include}` shape. */
function wrapRequirements(
  reqs: string[],
  prefix: 'preferred' | 'non_negotiable',
): RequirementItemJson[] {
  return reqs
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text, index) => ({
      id: `${prefix}_${index + 1}`,
      text,
      include: true,
    }))
}

/**
 * Creates the Job's pipeline stages based on service type. Mirrors the source's
 * `create-job` edge function: looks the global **Hiring Stages** up by name and
 * inserts **Job Stages** in order. Errors here are logged but do not fail the
 * Job creation (source parity) — the Job row is already committed.
 */
async function createJobStages(
  client: SupabaseClient<Database>,
  jobId: string,
  serviceType: 'resume_only' | 'resume_interview',
) {
  const stageNames =
    serviceType === 'resume_only'
      ? ['Resume Screening', 'Final Reachout']
      : ['Resume Screening', 'Screening Interview', 'Final Reachout']

  const { data: stages, error } = await client
    .from('hiring_stages')
    .select('id, name')
    .in('name', stageNames)
  if (error || stages.length === 0) {
    console.error('[createJob] Failed to load hiring stages:', error?.message)
    return
  }

  const rows = stageNames.flatMap((name, index) => {
    const stage = stages.find((s) => s.name === name)
    return stage
      ? [{ job_id: jobId, stage_id: stage.id, stage_order: index + 1 }]
      : []
  })
  if (rows.length === 0) return

  const { error: insertError } = await client.from('job_stages').insert(rows)
  if (insertError) {
    console.error('[createJob] Failed to create job stages:', insertError.message)
  }
}

/**
 * Creates a Job. Enforces `canCreateJob` (application capability — ADR-0004)
 * then INSERTs on the user-scoped client so RLS re-validates company membership
 * and the admin-only INSERT policy (`user_is_company_admin`) at the Postgres
 * layer (ADR-0010). Returns the new Job id + the generated forwarding email so
 * the dialog can surface them on success.
 */
export const createJob = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(createJobInputSchema)
  .handler(async ({ data, context }) => {
    // 1. Authoritative capability + company context (single profile read).
    const { data: profile, error: profileError } = await context.supabase
      .from('profiles')
      .select('id, company_id, permissions, companies(id, name)')
      .eq('id', context.session.user.id)
      .maybeSingle()
    if (profileError || !profile) {
      throw new Error('Failed to load your member profile.')
    }
    if (!profile.permissions.canCreateJob) {
      throw new Error('You do not have permission to create jobs.')
    }
    const companyId = profile.company_id
    if (!companyId) {
      throw new Error('Your account is not associated with a company.')
    }
    const companyName = profile.companies?.name ?? 'company'

    // 2. Forwarding email + code (source parity).
    const forwardingCode = generateForwardingCode()
    const slug = companyName.trim().toLowerCase().replace(/\s+/g, '_')
    const forwardingEmail = `${slug}-${forwardingCode}@jobs.talsek.com`

    // 3. INSERT on the user-scoped client (RLS: user_is_company_admin).
    const { data: job, error: jobError } = await context.supabase
      .from('jobs')
      .insert({
        company_id: companyId,
        title: data.title,
        job_posting_link: data.jobPostingLink,
        location: data.location,
        salary_range: data.salaryRange,
        job_description_raw: data.jobDescription,
        forwarding_email: forwardingEmail,
        forwarding_code: forwardingCode,
        preferred_requirements: wrapRequirements(
          data.preferredRequirements,
          'preferred',
        ),
        non_negotiables: wrapRequirements(data.nonNegotiables, 'non_negotiable'),
        parsed_job_data: data.parsedJobData,
        screening_interview_information: data.screeningInterviewInformation,
      })
      .select('id, forwarding_email')
      .single()
    if (jobError) {
      // An RLS rejection (non-admin) surfaces here as a permissions error.
      throw new Error(jobError.message)
    }

    // 4. Pipeline stages (best-effort, never fails the request).
    await createJobStages(context.supabase, job.id, data.serviceType)

    return { id: job.id, forwardingEmail: job.forwarding_email }
  })

// ─── Job requirements update (#23) ───────────────────────────────────────
//
// Ports the source's client-side `useUpdateJobRequirements` (direct Supabase
// UPDATE) as a permission-checked server function. The source only toggled
// include/exclude; the port also accepts add/remove of requirement rows so the
// Member can refine scoring inputs after creation (spec story 12 / ticket #23).

const requirementItemSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  include: z.boolean(),
}) satisfies z.ZodType<RequirementItemJson>

const updateJobRequirementsInputSchema = z.object({
  jobId: z.string().uuid(),
  preferred: z.array(requirementItemSchema),
  nonNegotiables: z.array(requirementItemSchema),
})

/**
 * Updates a Job's preferred + non-negotiable requirement lists. Enforces
 * `canCreateJob` (Job management capability — ADR-0004) then UPDATEs on the
 * user-scoped client so RLS re-validates company admin at Postgres
 * ("Admins can update jobs"). At least one included preferred and one
 * included non-negotiable are required (source save validation parity).
 */
export const updateJobRequirements = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(updateJobRequirementsInputSchema)
  .handler(async ({ data, context }) => {
    const { data: profile, error: profileError } = await context.supabase
      .from('profiles')
      .select('id, permissions')
      .eq('id', context.session.user.id)
      .maybeSingle()
    if (profileError || !profile) {
      throw new Error('Failed to load your member profile.')
    }
    if (!profile.permissions.canCreateJob) {
      throw new Error('You do not have permission to update job requirements.')
    }

    const preferred = data.preferred
      .map((req) => ({
        id: req.id,
        text: req.text.trim(),
        include: req.include,
      }))
      .filter((req) => req.text.length > 0)
    const nonNegotiables = data.nonNegotiables
      .map((req) => ({
        id: req.id,
        text: req.text.trim(),
        include: req.include,
      }))
      .filter((req) => req.text.length > 0)

    if (!preferred.some((req) => req.include !== false)) {
      throw new Error('Select at least one preferred requirement to save.')
    }
    if (!nonNegotiables.some((req) => req.include !== false)) {
      throw new Error('Select at least one non-negotiable requirement to save.')
    }

    const { data: job, error: updateError } = await context.supabase
      .from('jobs')
      .update({
        preferred_requirements: preferred,
        non_negotiables: nonNegotiables,
      })
      .eq('id', data.jobId)
      .select('id')
      .maybeSingle()
    if (updateError) {
      throw new Error(updateError.message)
    }
    if (!job) {
      throw new Error('Job not found or you do not have permission to update it.')
    }

    return { id: job.id }
  })

/** Re-exported create input type for the client mutation + dialog. */
export type CreateJobInput = z.infer<typeof createJobInputSchema>
export type ParseJobInput = z.infer<typeof parseJobInputSchema>
export type UpdateJobRequirementsInput = z.infer<
  typeof updateJobRequirementsInputSchema
>
