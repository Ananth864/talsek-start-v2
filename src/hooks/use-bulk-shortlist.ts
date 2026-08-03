import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bulkShortlistJobApplications } from '#/server/fn/bulk'
import type { BulkShortlistJobApplicationsInput } from '#/server/fn/bulk'
import { JOB_APPLICATIONS_QUERY_KEY_PREFIX } from '#/lib/job-applications-shared'

/**
 * Bulk Shortlist: send Reachouts + advance stages for selected Job Applications
 * (#21). Reuses the single-shortlist send path server-side.
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
