import type { JobApplicationRow, JobStageRow } from '#/server/fn/job-applications'

/** Stage-adaptive card surface — consolidates the source's three card families. */
export type CandidateCardStageKind = 'resume' | 'interview' | 'final'

export function stageKindFromName(
  stageName: string | null | undefined,
): CandidateCardStageKind {
  if (stageName === 'Screening Interview') return 'interview'
  if (stageName === 'Final Reachout') return 'final'
  return 'resume'
}

export function applicationStageKind(
  application: JobApplicationRow,
): CandidateCardStageKind {
  return stageKindFromName(application.current_stage.hiring_stage.name)
}

/** True when the Job's pipeline includes a Screening Interview Job Stage. */
export function jobHasInterviewStage(stages: JobStageRow[]): boolean {
  return stages.some(
    (stage) => stage.hiring_stage.name === 'Screening Interview',
  )
}

export function interviewStatusColor(status: string): string {
  if (status === 'completed') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
  }
  return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
}

export function interviewScoreColor(percent: number | null): string {
  if (percent === null) {
    return 'border-border bg-muted text-muted-foreground'
  }
  if (percent >= 70) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
  }
  if (percent >= 40) {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
  }
  return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
}
