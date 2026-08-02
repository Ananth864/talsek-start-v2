import { createServerFn } from '@tanstack/react-start'
import type { SupabaseClient } from '@supabase/supabase-js'
import { authMiddleware } from '../middleware/auth'
import type { Database } from '#/integrations/supabase/types'

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
 * are enumerated explicitly rather than `*`: two JSON columns
 * (`parsed_job_data`, `screening_interview_information`) are placeholder-typed
 * (`unknown`) for later domains and are neither part of the Jobs read surface
 * nor serializable across the server-function boundary, so they are omitted
 * here. When those domains land a concrete type, add the columns back. Defined
 * as a function of the user-scoped client so the same call serves the handler
 * and the `JobWithCompanyRow` type derivation.
 */
export function jobsQuery(client: SupabaseClient<Database>) {
  return client
    .from('jobs')
    .select(
      `id, company_id, title, status, created_at, location, salary_range,
       job_posting_link, job_description_raw, forwarding_email, forwarding_code,
       preferred_requirements, non_negotiables,
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
