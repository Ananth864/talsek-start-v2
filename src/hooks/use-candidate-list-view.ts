import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  fetchCandidateListView,
  updateCandidateListView,
} from '#/server/fn/profile-preferences'
import type { CandidateListView } from '#/server/fn/profile-preferences'

export const candidateListViewQueryKey = (userId?: string | null) =>
  ['candidate-list-view', userId] as const

export const candidateListViewQueryOptions = (userId?: string | null) =>
  queryOptions({
    queryKey: candidateListViewQueryKey(userId),
    queryFn: () => fetchCandidateListView(),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

/**
 * Member's persisted candidate board layout (`profiles.candidate_list_view`).
 * Defaults to `list` until the Profile preference loads.
 */
export function useCandidateListView(userId?: string | null) {
  const queryClient = useQueryClient()
  const query = useQuery(candidateListViewQueryOptions(userId))

  const mutation = useMutation({
    mutationFn: (view: CandidateListView) =>
      updateCandidateListView({ data: { view } }),
    onSuccess: (view) => {
      queryClient.setQueryData(candidateListViewQueryKey(userId), view)
    },
  })

  const viewMode: CandidateListView = query.data ?? 'list'

  return {
    viewMode,
    isLoading: query.isLoading,
    isUpdating: mutation.isPending,
    error: mutation.error ?? query.error,
    setViewMode: (view: CandidateListView) => mutation.mutateAsync(view),
    toggleViewMode: () =>
      mutation.mutateAsync(viewMode === 'grid' ? 'list' : 'grid'),
  }
}
