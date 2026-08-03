import { useQuery, queryOptions } from '@tanstack/react-query'
import { fetchJobApplications } from '#/server/fn/job-applications'
import { jobApplicationsQueryKey } from '#/lib/job-applications-shared'

/**
 * Port of the source's `useCandidates` (job-wide candidate board query), moved
 * behind the user-scoped `fetchJobApplications` server fn (ADR-0004/ADR-0007).
 * The query key matches the source's `['job-applications', jobId, companyId]`
 * verbatim so realtime/mutation invalidation ports unchanged. `staleTime:
 * Infinity` matches the SPA — refetches are driven by realtime invalidation
 * (`useJobApplicationsSubscription`), not time-based staleness.
 */
export function jobApplicationsQueryOptions(
  jobId: string | null | undefined,
  companyId: string | null | undefined,
) {
  return queryOptions({
    queryKey: jobApplicationsQueryKey(jobId, companyId),
    queryFn: () => fetchJobApplications({ data: { jobId: jobId! } }),
    enabled: Boolean(jobId) && Boolean(companyId),
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useJobApplications(
  jobId: string | null | undefined,
  companyId: string | null | undefined,
) {
  return useQuery(jobApplicationsQueryOptions(jobId, companyId))
}
