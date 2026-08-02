import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bulkShortlistJobApplications } from '#/server/fn/bulk'
import type { BulkShortlistJobApplicationsInput } from '#/server/fn/bulk'
import { JOB_APPLICATIONS_QUERY_KEY_PREFIX } from '#/lib/job-applications-shared'

/**
 * Bulk stage advance for selected Job Applications (ticket #10).
 * Reachout send is deferred to #16 (ADR-0016).
 */
export function useBulkShortlist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BulkShortlistJobApplicationsInput) =>
      bulkShortlistJobApplications({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: JOB_APPLICATIONS_QUERY_KEY_PREFIX,
      })
    },
  })
}
