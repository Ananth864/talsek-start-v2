import { queryOptions, useQuery } from '@tanstack/react-query'
import { fetchInterviewSession } from '#/server/fn/candidate-profile'
import { checkMeetsRequirements } from '#/lib/interview-requirements'
import {
  computeInterviewScore,
  getEmptyInterviewScore,
} from '#/lib/interview-scoring'

export const interviewSessionQueryKey = (applicationId: string | null) =>
  ['interview-session', applicationId] as const

export const interviewSessionQueryOptions = (
  applicationId: string | null,
  enabled = true,
) =>
  queryOptions({
    queryKey: interviewSessionQueryKey(applicationId),
    queryFn: () =>
      fetchInterviewSession({ data: { applicationId: applicationId! } }),
    enabled: !!applicationId && enabled,
    staleTime: 30_000,
  })

/**
 * Member Interview Session for a Job Application (source `useInterviewSession`).
 * Fetches when `enabled` (typically while the profile dialog is open).
 */
export function useInterviewSession(
  applicationId: string | null,
  enabled = true,
) {
  const query = useQuery(interviewSessionQueryOptions(applicationId, enabled))
  const session = query.data ?? null

  const meetsRequirements = session?.questions_completed
    ? checkMeetsRequirements(session.questions_completed)
    : false

  const score = session
    ? computeInterviewScore(session)
    : getEmptyInterviewScore()

  return {
    session,
    isLoading: query.isLoading,
    error: query.error,
    meetsRequirements,
    score,
  }
}
