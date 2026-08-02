import { useMutation, useQueryClient } from '@tanstack/react-query'
import { moveJobApplicationStage } from '#/server/fn/job-applications'
import { JOB_APPLICATIONS_QUERY_KEY_PREFIX } from '#/lib/job-applications-shared'
import type { MoveJobApplicationStageInput } from '#/server/fn/job-applications'

/**
 * Advances a Job Application to another Job Stage (the stage-move half of
 * source shortlist). Reachout send is deferred to #16; this mutation only
 * updates `current_stage_id`. Realtime also invalidates on stage change.
 */
export function useMoveJobApplicationStage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: MoveJobApplicationStageInput) =>
      moveJobApplicationStage({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: JOB_APPLICATIONS_QUERY_KEY_PREFIX,
      })
    },
  })
}
