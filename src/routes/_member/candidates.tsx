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
  // Prefetch + dehydrate the shell data (Jobs list + board view preference)
  // for SSR first paint (ADR-0007). The candidate search itself is
  // user-action-gated in the component and stays client-side.
  // Client-side: no prefetch — the page's first render is the empty-prompt
  // shell, and the mounted hooks fetch what the filters need (keeping cold
  // first-navigation free of extra module/requests contention).
  // Lazy imports keep these off the client route chunk entirely.
  loader: async ({ context }) => {
    if (!context.companyId || typeof document !== 'undefined') return
    const settle = (p: Promise<unknown>) => p.catch(() => undefined)
    const [{ jobsQueryOptions }, { candidateListViewQueryOptions }] =
      await Promise.all([
        import('#/hooks/use-jobs'),
        import('#/hooks/use-candidate-list-view'),
      ])
    await Promise.all([
      settle(context.queryClient.ensureQueryData(jobsQueryOptions(context.companyId))),
      settle(context.queryClient.ensureQueryData(candidateListViewQueryOptions(context.userId))),
    ])
  },
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
