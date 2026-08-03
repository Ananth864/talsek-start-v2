import { useMutation, useQueryClient } from '@tanstack/react-query'
import { shortlistJobApplication } from '#/server/fn/job-applications'
import type { ShortlistJobApplicationInput } from '#/server/fn/job-applications'
import { JOB_APPLICATIONS_QUERY_KEY_PREFIX } from '#/lib/job-applications-shared'
import { CANDIDATE_SEARCH_QUERY_KEY_PREFIX } from '#/lib/candidate-search-shared'

/**
 * Shortlist mutation — sends the Reachout then advances stage (#20).
 * Also invalidates the cross-job Candidates search cache (#27).
 */
export function useShortlistJobApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ShortlistJobApplicationInput) =>
      shortlistJobApplication({ data: input }),
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
