import { useCallback } from 'react'
import { useShortlistFlow } from '#/hooks/use-shortlist-flow'
import type { ShortlistJobContext } from '#/hooks/use-shortlist-flow'
import type {
  JobApplicationRow,
  JobStageRow,
} from '#/server/fn/job-applications'
import type { JobWithCompanyRow } from '#/server/fn/jobs'

type UseShortlistActionsParams = {
  job: JobWithCompanyRow
  stages: JobStageRow[]
  applications: JobApplicationRow[]
  companyId: string | null
  canSendReachout: boolean
}

/**
 * Board-level Shortlist flow for the Candidate board. Thin adapter over
 * `useShortlistFlow` — holds one Job + Job Stages set for the whole board.
 */
export function useShortlistActions({
  job,
  stages,
  applications,
  companyId,
  canSendReachout,
}: UseShortlistActionsParams) {
  const resolveJobContext = useCallback(
    (_application: JobApplicationRow | null): ShortlistJobContext => ({
      job,
      stages,
      surface: 'board',
    }),
    [job, stages],
  )

  return useShortlistFlow({
    companyId,
    canSendReachout,
    applications,
    resolveJobContext,
  })
}
