import { createFileRoute } from '@tanstack/react-router'
import { CandidatesSearchPage } from '#/components/candidates/candidates-search-page'
import type { CandidatesSearchUrlState } from '#/components/candidates/candidates-search-page'

function parseOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/**
 * Cross-job Candidates page — search/filter every Job Application in the
 * Member's company and export the filtered set (ticket #27).
 */
export const Route = createFileRoute('/_member/candidates')({
  validateSearch: (search: Record<string, unknown>): CandidatesSearchUrlState => ({
    name: parseOptionalString(search.name),
    jobId: parseOptionalString(search.jobId),
    stage: parseOptionalString(search.stage),
    minScore: parseOptionalString(search.minScore),
    starred:
      search.starred === true ||
      search.starred === '1' ||
      search.starred === 'true'
        ? true
        : undefined,
    fulfilledNN:
      search.fulfilledNN === true ||
      search.fulfilledNN === '1' ||
      search.fulfilledNN === 'true'
        ? true
        : undefined,
  }),
  component: CandidatesRoute,
})

function CandidatesRoute() {
  const { companyId, userId, canSendReachout } = Route.useRouteContext()
  const search = Route.useSearch()

  return (
    <CandidatesSearchPage
      companyId={companyId}
      userId={userId}
      canSendReachout={canSendReachout}
      search={search}
    />
  )
}
