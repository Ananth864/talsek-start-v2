import { createServerFn } from '@tanstack/react-start'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth'
import type { Database } from '#/integrations/supabase/types'

/**
 * Job Applications read + write path — the candidate pipeline board (tickets
 * #6 read, #8 mutations). Ports the source's `useCandidates` / `useJobStages`
 * read surface and the star / reject / stage-move write surface behind
 * user-scoped server functions so Row-Level Security owns company scoping
 * (ADR-0004): there is no manual `.eq('job.company_id', …)` filter anywhere
 * here (the source carried one; it is deleted in the port). The select shape,
 * the `active`/`rejected` status window, the `final_score` ordering, and the
 * `['job-applications', jobId, companyId]` / `['job-stages', jobId, companyId]`
 * query keys (see `src/lib/job-applications-shared.ts`) match the source
 * verbatim so mutation/realtime invalidation ports unchanged.
 *
 * The source serves the board from a per-stage *infinite* query
 * (`candidates-by-stage-infinite`). The read path here uses the source's
 * job-wide `useCandidates` shape as the single board query and groups by stage
 * client-side — this gives a clean SSR first paint (one prefetch in the loader)
 * while keeping the realtime-invalidatable `['job-applications', jobId]` key.
 * Paginated per-stage fetching ports with later write-path tickets.
 * See ADR-0011 / ADR-0013.
 */

/**
 * Canonical Job Applications query builder. Embeds the owning **Candidate**
 * (for email) and the application's current **Job Stage** with its **Hiring
 * Stage** (name + order, for grouping/tabbing). Mirrors the source's
 * `jobApplicationSelect`, trimmed to the board's read surface: the `job` embed
 * is dropped because RLS owns company scoping (no `.eq('job.company_id')`) and
 * the selected Job context already comes from the Jobs list. Defined as a
 * function of the user-scoped client so the same call serves the handler and
 * the `JobApplicationRow` type derivation.
 *
 * `ai_analysis`, `email_content`, and the raw `match_score` are selected for
 * the candidate profile detail (#7): the dialog reads the same cached board row
 * (same query key), so its data is consistent with the board by construction.
 * Both JSON columns are typed concrete (unknown-free) so the default
 * server-function serializer carries them (ADR-0009 §1).
 */
export function jobApplicationsQuery(client: SupabaseClient<Database>) {
  return client
    .from('job_applications')
    .select(
      `id, candidate_id, candidate_name, job_id, current_stage_id, status,
       final_score, match_score, meets_all_non_negotiables,
       preferred_requirements_matched, processing_source, resume_url, starred,
       created_at, updated_at,
       parsed_candidate_data, ai_analysis, email_content,
       candidate:candidates(id, email),
       current_stage:job_stages(id, stage_id, stage_order, hiring_stage:hiring_stages(id, name))`,
    )
    .order('final_score', { ascending: false })
}

/** A Job Application row with its embedded Candidate + current Job Stage. */
export type JobApplicationRow = NonNullable<
  Awaited<ReturnType<typeof jobApplicationsQuery>>['data']
>[number]

/**
 * Canonical Job Stages query builder — the selected Job's pipeline, ordered by
 * `stage_order`. Used to render the stage tabs in pipeline order (including
 * stages that currently hold zero candidates, which grouping the applications
 * would hide). The source fetches these via `useJobStages`.
 */
export function jobStagesQuery(client: SupabaseClient<Database>) {
  return client
    .from('job_stages')
    .select(`id, job_id, stage_id, stage_order, hiring_stage:hiring_stages(id, name)`)
    .order('stage_order', { ascending: true })
}

/** A Job Stage row with its embedded Hiring Stage. */
export type JobStageRow = NonNullable<
  Awaited<ReturnType<typeof jobStagesQuery>>['data']
>[number]

/**
 * The board status window: only `active` and `rejected` Job Applications are
 * shown in the candidate board (source parity). `pending` / `processing` /
 * `failed` / `failed_validation` / `hired` are surfaced through the Processing
 * Status summary, not the board list.
 */
const BOARD_STATUSES = ['active', 'rejected'] as const

/** Shared input for the read functions: the selected Job id. */
const jobIdParamSchema = z.object({ jobId: z.string().min(1) })

/**
 * The selected Job's candidate pipeline, scoped by RLS via the user-scoped
 * client. Filters to the Job and the board status window, ordered by
 * `final_score` descending (source parity). No company filter is applied — RLS
 * on the attached client enforces it (ADR-0004).
 */
export const fetchJobApplications = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(jobIdParamSchema)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await jobApplicationsQuery(context.supabase)
      .eq('job_id', data.jobId)
      .in('status', [...BOARD_STATUSES])
    if (error) throw new Error(`Failed to load candidates: ${error.message}`)
    return rows
  })

/**
 * The selected Job's pipeline stages in order (source: `useJobStages`). Scoped
 * by RLS via the user-scoped client; filtered to the Job only.
 */
export const fetchJobStages = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(jobIdParamSchema)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await jobStagesQuery(context.supabase).eq(
      'job_id',
      data.jobId,
    )
    if (error) throw new Error(`Failed to load job stages: ${error.message}`)
    return rows
  })

// ─── Job Applications write path (#8) ────────────────────────────────────
//
// Ports the source's client-side star / reject updates and the stage-advance
// half of shortlist as user-scoped server functions (ADR-0002/ADR-0004). The
// Reachout send (source `bulk-shortlist-candidates` edge fn) is deferred
// to the bulk-shortlist / reachout tickets (#10 / #16); Shortlist on the card
// advances `current_stage_id` only. UPDATEs run on `context.supabase`, so the
// admin-only `job_applications` UPDATE RLS policy applies (ADR-0013).

const applicationIdSchema = z.object({
  applicationId: z.string().min(1),
})

const toggleStarredSchema = applicationIdSchema.extend({
  starred: z.boolean(),
})

const moveStageSchema = applicationIdSchema.extend({
  jobId: z.string().min(1),
  targetStageId: z.string().min(1),
})

export type ToggleJobApplicationStarredInput = z.infer<typeof toggleStarredSchema>
export type RejectJobApplicationInput = z.infer<typeof applicationIdSchema>
export type MoveJobApplicationStageInput = z.infer<typeof moveStageSchema>

/**
 * Toggle the starred flag on a Job Application (source: `useToggleStarred`).
 */
export const toggleJobApplicationStarred = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(toggleStarredSchema)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from('job_applications')
      .update({ starred: data.starred })
      .eq('id', data.applicationId)
    if (error) {
      throw new Error(`Failed to update favorite: ${error.message}`)
    }
    return { ok: true as const }
  })

/**
 * Reject a Job Application by setting `status` to `rejected` (source:
 * `useRejectCandidate`). The row stays in the board status window
 * (`active`/`rejected`); the card shows the Rejected badge.
 */
export const rejectJobApplication = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(applicationIdSchema)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from('job_applications')
      .update({ status: 'rejected' })
      .eq('id', data.applicationId)
    if (error) {
      throw new Error(`Failed to reject candidate: ${error.message}`)
    }
    return { ok: true as const }
  })

/**
 * Move a Job Application to another Job Stage on the same Job (the stage
 * advance half of source shortlist). Verifies the target stage belongs to the
 * declared Job before writing — the client supplies `jobId` for the check; RLS
 * still owns company scoping on both tables.
 */
export const moveJobApplicationStage = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(moveStageSchema)
  .handler(async ({ data, context }) => {
    const { data: stage, error: stageError } = await context.supabase
      .from('job_stages')
      .select('id, job_id')
      .eq('id', data.targetStageId)
      .maybeSingle()
    if (stageError) {
      throw new Error(`Failed to resolve target stage: ${stageError.message}`)
    }
    if (!stage || stage.job_id !== data.jobId) {
      throw new Error('Target stage does not belong to this job')
    }

    const { error } = await context.supabase
      .from('job_applications')
      .update({ current_stage_id: data.targetStageId })
      .eq('id', data.applicationId)
      .eq('job_id', data.jobId)
    if (error) {
      throw new Error(`Failed to move candidate: ${error.message}`)
    }
    return { ok: true as const }
  })
