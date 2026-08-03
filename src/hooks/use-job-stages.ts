import { useQuery, queryOptions } from '@tanstack/react-query'
import { fetchJobStages } from '#/server/fn/job-applications'
import { jobStagesQueryKey } from '#/lib/job-applications-shared'

/**
 * Port of the source's `useJobStages` — the selected Job's pipeline stages in
 * `stage_order`, behind the user-scoped `fetchJobStages` server fn. Feeds the
 * stage tabs (in pipeline order, including stages that currently hold zero
 * candidates). Key matches the source's
 * `['job-stages', jobId, companyId]` verbatim.
 */
export function jobStagesQueryOptions(
  jobId: string | null | undefined,
  companyId: string | null | undefined,
) {
  return queryOptions({
    queryKey: jobStagesQueryKey(jobId, companyId),
    queryFn: () => fetchJobStages({ data: { jobId: jobId! } }),
    enabled: Boolean(jobId) && Boolean(companyId),
    // Source useJobStages: stages rarely change.
    staleTime: 10 * 60 * 1000,
  })
}

export function useJobStages(
  jobId: string | null | undefined,
  companyId: string | null | undefined,
) {
  return useQuery(jobStagesQueryOptions(jobId, companyId))
}
