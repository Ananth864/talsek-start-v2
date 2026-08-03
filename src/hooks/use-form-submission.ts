import { queryOptions, useQuery } from '@tanstack/react-query'
import { fetchFormSubmission } from '#/server/fn/candidate-profile'

export const formSubmissionQueryKey = (
  candidateId: string | null,
  jobId: string | null,
) => ['form-submission', candidateId, jobId] as const

export const formSubmissionQueryOptions = (
  candidateId: string | null,
  jobId: string | null,
  enabled = true,
) =>
  queryOptions({
    queryKey: formSubmissionQueryKey(candidateId, jobId),
    queryFn: () =>
      fetchFormSubmission({
        data: { candidateId: candidateId!, jobId: jobId! },
      }),
    enabled: !!candidateId && !!jobId && enabled,
    staleTime: 30_000,
  })

/**
 * Form Submission + Form Config for a Candidate on a Job (source
 * `useFormSubmission`). Enable only for `processing_source === 'form'`.
 */
export function useFormSubmission(
  candidateId: string | null,
  jobId: string | null,
  enabled = true,
) {
  return useQuery(formSubmissionQueryOptions(candidateId, jobId, enabled))
}
