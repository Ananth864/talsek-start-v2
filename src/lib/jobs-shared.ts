import type { JobWithCompanyRow } from '#/server/fn/jobs'

/**
 * Shared Jobs helpers — query keys (ADR-0007) and small read-surface helpers
 * reused by the Jobs list and detail components. Kept client-safe (types + pure
 * functions) so the route loader, the components, and later server functions all
 * reference the single source of truth.
 */

/**
 * The Jobs list query key, namespaced by the Member's company id. Matches the
 * source's `['jobs', currentCompany?.id]` verbatim so mutation and realtime
 * invalidation (which use the `['jobs']` prefix) port unchanged.
 */
export const jobsQueryKey = (companyId: string | null | undefined) =>
  ['jobs', companyId ?? null] as const

/**
 * The Jobs query-key prefix used by create/update mutations (and, later,
 * realtime) to invalidate every company-namespaced Jobs query. Centralised here
 * so the prefix value lives next to `jobsQueryKey` rather than being re-literalled
 * at each invalidation site (ADR-0009 §2).
 */
export const JOBS_QUERY_KEY_PREFIX = ['jobs'] as const

/**
 * Currency symbol by ISO code, used to format a Job's salary range for storage
 * (source parity: `${symbol}${amount}`). Client-safe so the create dialog and
 * the server fn share one table.
 */
export const SALARY_CURRENCY_PREFIX = {
  USD: '$',
  INR: '₹',
} as const

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  closed: 'Closed',
}

/** Display label + Badge variant for a Job's `status` (job_status_enum). */
export function jobStatusMeta(status: string): {
  label: string
  variant: 'default' | 'secondary'
} {
  return {
    label: STATUS_LABEL[status] ?? status,
    variant: status === 'active' ? 'default' : 'secondary',
  }
}

/**
 * A Job's Form Config, if any. The relation is one-to-many at the DB level but a
 * Job has at most one active config; this returns the first or `null` and is the
 * single place that knows the array-is-really-singular shape.
 */
export function getFormConfig(job: JobWithCompanyRow) {
  return job.job_form_configs.length > 0 ? job.job_form_configs[0] : null
}
