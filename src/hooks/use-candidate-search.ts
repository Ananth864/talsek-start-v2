import { useQuery, queryOptions } from '@tanstack/react-query'
import { fetchCandidateSearch } from '#/server/fn/job-applications'
import {
  candidateSearchQueryKey,
  hasCandidateSearchFilters,
} from '#/lib/candidate-search-shared'
import type { CandidateSearchFilters } from '#/lib/candidate-search-shared'

/**
 * Cross-job Candidates search (ticket #27). Ports the source's
 * `useCandidateSearch` behind the user-scoped `fetchCandidateSearch` server fn
 * (ADR-0004 / ADR-0007). Enabled only after the Member submits at least one
 * filter.
 */
export function candidateSearchQueryOptions(
  companyId: string | null | undefined,
  filters: CandidateSearchFilters | null,
  enabled: boolean,
) {
  return queryOptions({
    queryKey: candidateSearchQueryKey(companyId, filters),
    queryFn: () => fetchCandidateSearch({ data: filters! }),
    enabled:
      Boolean(enabled) &&
      Boolean(companyId) &&
      Boolean(filters) &&
      hasCandidateSearchFilters(filters!),
  })
}

export function useCandidateSearch(
  companyId: string | null | undefined,
  filters: CandidateSearchFilters | null,
  enabled: boolean,
) {
  return useQuery(candidateSearchQueryOptions(companyId, filters, enabled))
}
