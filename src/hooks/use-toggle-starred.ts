import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toggleJobApplicationStarred } from '#/server/fn/job-applications'
import { JOB_APPLICATIONS_QUERY_KEY_PREFIX } from '#/lib/job-applications-shared'
import { CANDIDATE_SEARCH_QUERY_KEY_PREFIX } from '#/lib/candidate-search-shared'
import type { ToggleJobApplicationStarredInput } from '#/server/fn/job-applications'

/**
 * Port of the source's `useToggleStarred`. Invokes the user-scoped
 * `toggleJobApplicationStarred` server function and invalidates the
 * Job Applications + Candidates-search caches on success. Starred-only
 * UPDATEs are skipped by the realtime bridge (source parity), so this
 * invalidation is the refresh path.
 */
export function useToggleStarred() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ToggleJobApplicationStarredInput) =>
      toggleJobApplicationStarred({ data: input }),
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
