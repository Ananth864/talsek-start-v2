import { useMutation, useQueryClient } from '@tanstack/react-query'
import { processJobApplicationPipelineFn } from '#/server/fn/resume-pipeline'
import { JOB_APPLICATIONS_QUERY_KEY_PREFIX } from '#/lib/job-applications-shared'
import type { ProcessJobApplicationPipelineFnInput } from '#/server/fn/resume-pipeline'

/**
 * Runs the synchronous Resume AI pipeline for a Job Application and
 * invalidates the board cache. Score/`ai_analysis`-only UPDATEs are skipped
 * by the realtime bridge (ADR-0013), so this invalidation is required for
 * the board/profile to refresh after a re-run.
 */
export function useProcessJobApplicationPipeline() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ProcessJobApplicationPipelineFnInput) =>
      processJobApplicationPipelineFn({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: JOB_APPLICATIONS_QUERY_KEY_PREFIX,
      })
    },
  })
}
