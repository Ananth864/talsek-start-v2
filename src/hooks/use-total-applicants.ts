import { useQuery } from '@tanstack/react-query'
import { jobApplicationsQueryOptions } from '#/hooks/use-job-applications'

/**
 * Active applicant count for a Job card (source `useTotalApplicants`).
 * Reuses the board query + cache so the selected Job's fetch is shared with
 * CandidatesList; other cards load their own counts on mount.
 */
export function useTotalApplicants(
  jobId: string,
  companyId: string | null | undefined,
) {
  return useQuery({
    ...jobApplicationsQueryOptions(jobId, companyId),
    select: (applications) =>
      applications.filter((app) => app.status === 'active').length,
  })
}
