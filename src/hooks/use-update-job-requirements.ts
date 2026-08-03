import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateJobRequirements } from '#/server/fn/jobs'
import { JOBS_QUERY_KEY_PREFIX } from '#/lib/jobs-shared'
import { JOB_APPLICATIONS_QUERY_KEY_PREFIX } from '#/lib/job-applications-shared'
import type { UpdateJobRequirementsInput } from '#/server/fn/jobs'

/**
 * Port of the source's `useUpdateJobRequirements`. Invokes the user-scoped
 * `updateJobRequirements` server function (permission + RLS) and invalidates
 * Jobs + Job Applications caches so Job Details and the candidate-board
 * requirement counts refresh (source parity on jobs + applications keys).
 */
export function useUpdateJobRequirements() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateJobRequirementsInput) =>
      updateJobRequirements({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY_PREFIX })
      void queryClient.invalidateQueries({
        queryKey: JOB_APPLICATIONS_QUERY_KEY_PREFIX,
      })
    },
  })
}
