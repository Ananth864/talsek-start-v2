import type { JobApplicationRow, JobStageRow } from '#/server/fn/job-applications'

export type StageInfo = {
  id: string
  name: string
}

/**
 * Next-stage helpers for a Job Application in a Job's ordered pipeline.
 * Ports the source's `useCandidateStageNavigation` as pure functions so the
 * card can resolve the Shortlist target without a React hook.
 */
export function nextStageForApplication(
  application: Pick<JobApplicationRow, 'current_stage'>,
  jobStages: JobStageRow[],
): StageInfo | null {
  if (jobStages.length === 0) return null

  const currentIndex = jobStages.findIndex(
    (s) => s.id === application.current_stage.id,
  )
  if (currentIndex < 0 || currentIndex >= jobStages.length - 1) return null

  const next = jobStages[currentIndex + 1]
  return {
    id: next.id,
    name: next.hiring_stage.name || 'Next Stage',
  }
}

export function currentStageName(
  application: Pick<JobApplicationRow, 'current_stage'>,
): string {
  return application.current_stage.hiring_stage.name || 'Current Stage'
}
