import { useQuery, queryOptions } from '@tanstack/react-query'
import { fetchJobApplications } from '#/server/fn/job-applications'
import { jobApplicationsQueryKey } from '#/lib/job-applications-shared'

/**
 * Port of the source's `useCandidates` (job-wide candidate board query), moved
 * behind the user-scoped `fetchJobApplications` server fn (ADR-0004/ADR-0007).
 * The query key matches the source's `['job-applications', jobId, companyId]`
 * verbatim so realtime/mutation invalidation ports unchanged. `staleTime` is
 * left at React Query's default and refetches are driven by the realtime
 * subscription (`useJobApplicationsSubscription`), mirroring the source's
 * invalidation-only model.
 */
export function jobApplicationsQueryOptions(
  jobId: string | null | undefined,
  companyId: string | null | undefined,
) {
  return queryOptions({
    queryKey: jobApplicationsQueryKey(jobId, companyId),
    queryFn: () => fetchJobApplications({ data: { jobId: jobId! } }),
    enabled: Boolean(jobId) && Boolean(companyId),
  })
}

export function useJobApplications(
  jobId: string | null | undefined,
  companyId: string | null | undefined,
) {
  return useQuery(jobApplicationsQueryOptions(jobId, companyId))
}
