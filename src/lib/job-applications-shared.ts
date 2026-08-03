import type { AIAnalysisJson } from '#/integrations/supabase/types'
import type { JobApplicationRow } from '#/server/fn/job-applications'

/**
 * Shared Job Applications helpers — query keys (ADR-0007) and small read-surface
 * helpers reused by the candidate board. Kept client-safe (types + pure
 * functions) so the route loader, the components, and later server functions
 * all reference the single source of truth.
 */

/**
 * The candidate-board query key, namespaced by the Job + the Member's company
 * id. Matches the source's `['job-applications', jobId, currentCompany?.id]`
 * verbatim so mutation and realtime invalidation (which predicate-match on the
 * `'job-applications'` prefix) port unchanged. The company id namespaces the
 * cache; the realtime hook additionally checks `key[1] === jobId`.
 */
export const jobApplicationsQueryKey = (
  jobId: string | null | undefined,
  companyId: string | null | undefined,
) => ['job-applications', jobId ?? null, companyId ?? null] as const

/**
 * Prefix used by mutation hooks to invalidate every Job Applications cache
 * (source parity with `['job-applications']` predicate matches). Exact keys
 * remain `jobApplicationsQueryKey(jobId, companyId)`.
 */
export const JOB_APPLICATIONS_QUERY_KEY_PREFIX = ['job-applications'] as const

/**
 * The Job's pipeline-stages query key. Matches the source's
 * `['job-stages', jobId, currentCompany?.id]` verbatim.
 */
export const jobStagesQueryKey = (
  jobId: string | null | undefined,
  companyId: string | null | undefined,
) => ['job-stages', jobId ?? null, companyId ?? null] as const

/**
 * Display label + Badge variant for a Job Application's `status`
 * (`job_application_status_enum`). The board window is `active` / `rejected`;
 * the other Processing Statuses are listed for completeness (summary surface).
 */
export function applicationStatusMeta(status: string): {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
} {
  switch (status) {
    case 'active':
      return { label: 'Active', variant: 'default' }
    case 'rejected':
      return { label: 'Rejected', variant: 'destructive' }
    case 'hired':
      return { label: 'Hired', variant: 'default' }
    case 'processing':
      return { label: 'Processing', variant: 'secondary' }
    case 'pending':
      return { label: 'Pending', variant: 'secondary' }
    case 'failed':
    case 'failed_validation':
      return { label: 'Failed', variant: 'destructive' }
    default:
      return { label: status, variant: 'outline' }
  }
}

/**
 * The persisted normalized match score used to order the board and to render
 * the score ring. Clamped to 0–100 and rounded (source parity: the ring shows
 * a percentage). `final_score` is the AI-pipeline's persisted score; the
 * source recomputes it client-side via `computeDynamicScore`, which ports with
 * the candidate write-path domain (ADR-0011).
 */
export function normalizedMatchScore(application: JobApplicationRow): number {
  const raw = Number(application.final_score)
  if (!Number.isFinite(raw)) return 0
  return Math.min(100, Math.max(0, Math.round(raw)))
}

/**
 * Badge variant for a match score — the profile detail's header badge and
 * Final Score presentation (source parity: 70/40 thresholds). Lives here so
 * the mapping has one owner alongside `scoreBand` (which owns the finer
 * 80/60/40 ring/border palette — a distinct presentational scale, also from
 * the source).
 */
export function matchBadgeVariant(
  score: number,
): 'default' | 'secondary' | 'destructive' {
  if (score >= 70) return 'default'
  if (score >= 40) return 'secondary'
  return 'destructive'
}

/**
 * Score-band presentation for a candidate card. Matches source
 * `getScoreColor` / `getCardBorderColor` (green ≥80, yellow ≥40, red otherwise).
 * `stroke` is a `text-*` class used with SVG `stroke="currentColor"`.
 */
export function scoreBand(score: number): { stroke: string; border: string } {
  if (score >= 80)
    return { stroke: 'text-green-500', border: 'border-l-green-500' }
  if (score >= 40)
    return { stroke: 'text-yellow-500', border: 'border-l-yellow-500' }
  return { stroke: 'text-red-500', border: 'border-l-red-500' }
}

/**
 * ADR-0012 §1: `ai_analysis` is typed non-null but pre-pipeline / failed rows
 * can be null or missing analysis sections. Callers treat the return as partial.
 */
export type RuntimeAiAnalysis = {
  preferred_requirements_analysis?: {
    details?: AIAnalysisJson['preferred_requirements_analysis']['details']
  }
  non_negotiables_analysis?: {
    details?: AIAnalysisJson['non_negotiables_analysis']['details']
  }
  individual_scores?: { overall_fit_score?: number }
} | null

export function aiAnalysisOf(
  application: Pick<JobApplicationRow, 'ai_analysis'>,
): RuntimeAiAnalysis {
  const value: unknown = application.ai_analysis
  if (value == null || typeof value !== 'object') return null
  return value
}
