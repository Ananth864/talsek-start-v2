import { queryOptions } from '@tanstack/react-query'
import { fetchJobs } from '#/server/fn/jobs'
import { jobsQueryKey } from '#/lib/jobs-shared'

/** Company Jobs list — shared key so loaders and components hit the same cache. */
export const jobsQueryOptions = (companyId: string | null) =>
  queryOptions({
    queryKey: jobsQueryKey(companyId),
    queryFn: () => fetchJobs(),
  })
