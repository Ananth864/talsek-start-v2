/**
 * Cross-job Candidates page search — filter shape + query key (ticket #27).
 * Matches the source's `CandidateSearchFilters` / `['candidate-search', …]`
 * so URL sync and cache invalidation stay obvious.
 */

export type CandidateSearchFilters = {
  name?: string
  jobId?: string
  starredOnly?: boolean
  stageName?: string
  fulfilledNonNegotiables?: boolean
  minMatchScore?: number
}

/** Hardcoded Hiring Stage names offered on the Candidates page (source parity). */
export const CANDIDATE_SEARCH_STAGE_OPTIONS = [
  { value: 'Resume Screening', label: 'Resume Screening' },
  { value: 'Screening Interview', label: 'Screening Interview' },
  { value: 'Final Reachout', label: 'Final Reachout' },
] as const

export const candidateSearchQueryKey = (
  companyId: string | null | undefined,
  filters: CandidateSearchFilters | null,
) => ['candidate-search', companyId ?? null, filters] as const

export const CANDIDATE_SEARCH_QUERY_KEY_PREFIX = ['candidate-search'] as const

/** True when at least one meaningful filter is set (Search stays disabled otherwise). */
export function hasCandidateSearchFilters(
  filters: CandidateSearchFilters,
): boolean {
  return Boolean(
    filters.name?.trim() ||
      filters.jobId ||
      filters.stageName ||
      typeof filters.minMatchScore === 'number' ||
      filters.starredOnly ||
      filters.fulfilledNonNegotiables,
  )
}
