import { useMutation, useQueryClient } from '@tanstack/react-query'
import { rejectJobApplication } from '#/server/fn/job-applications'
import { JOB_APPLICATIONS_QUERY_KEY_PREFIX } from '#/lib/job-applications-shared'
import { CANDIDATE_SEARCH_QUERY_KEY_PREFIX } from '#/lib/candidate-search-shared'
import type { RejectJobApplicationInput } from '#/server/fn/job-applications'

/**
 * Port of the source's `useRejectCandidate`. Sets `status` to `rejected` via
 * the user-scoped server function. No optimistic remove: the board's status
 * window includes `rejected`, so the card stays visible with the Rejected
 * badge after refetch (ADR-0010-style server authority). Realtime also
 * invalidates on status change. Also refreshes the cross-job Candidates search.
 */
export function useRejectCandidate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RejectJobApplicationInput) =>
      rejectJobApplication({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: JOB_APPLICATIONS_QUERY_KEY_PREFIX,
      })
      void queryClient.invalidateQueries({
        queryKey: CANDIDATE_SEARCH_QUERY_KEY_PREFIX,
      })
    },
  })
}
