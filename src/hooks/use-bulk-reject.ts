import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bulkRejectJobApplications } from '#/server/fn/bulk'
import type { BulkRejectJobApplicationsInput } from '#/server/fn/bulk'
import { JOB_APPLICATIONS_QUERY_KEY_PREFIX } from '#/lib/job-applications-shared'

/**
 * Bulk reject selected Job Applications (#21). Source `BulkRejectModal` parity.
 */
export function useBulkReject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BulkRejectJobApplicationsInput) =>
      bulkRejectJobApplications({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: JOB_APPLICATIONS_QUERY_KEY_PREFIX,
      })
    },
  })
}
