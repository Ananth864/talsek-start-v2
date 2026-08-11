import { useCallback } from 'react'
import { useShortlistFlow } from '#/hooks/use-shortlist-flow'
import type { ShortlistJobContext } from '#/hooks/use-shortlist-flow'
import type {
  JobApplicationRow,
  JobStageRow,
} from '#/server/fn/job-applications'
import type { JobWithCompanyRow } from '#/server/fn/jobs'

type UseCrossJobShortlistActionsParams = {
  applications: JobApplicationRow[]
  jobsById: Map<string, JobWithCompanyRow>
  stagesByJobId: Map<string, JobStageRow[]>
  companyId: string | null
  canSendReachout: boolean
}

/**
 * Shortlist flow for the cross-Job Candidates page. Thin adapter over
 * `useShortlistFlow` — resolves Job and ordered Job Stages per Job Application
 * before preparation (ADR-0028 §4), and uses search-surface missing copy.
 */
export function useCrossJobShortlistActions({
  applications,
  jobsById,
  stagesByJobId,
  companyId,
  canSendReachout,
}: UseCrossJobShortlistActionsParams) {
  const resolveJobContext = useCallback(
    (application: JobApplicationRow | null): ShortlistJobContext => {
      if (!application) {
        return { job: null, stages: [], surface: 'search' }
      }
      return {
        job: jobsById.get(application.job_id) ?? null,
        stages: stagesByJobId.get(application.job_id) ?? [],
        surface: 'search',
      }
    },
    [jobsById, stagesByJobId],
  )

  return useShortlistFlow({
    companyId,
    canSendReachout,
    applications,
    resolveJobContext,
  })
}
