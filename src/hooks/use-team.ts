import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchTeamMember,
  fetchTeamMembers,
} from '#/server/fn/team'
import type { TeamMemberRow } from '#/server/fn/team'

export const teamMembersQueryKey = (companyId: string | null) =>
  ['companies', companyId, 'members'] as const

export const teamMemberQueryKey = (
  companyId: string | null,
  memberId: string | null,
) => ['companies', companyId, 'members', memberId] as const

export const teamMembersQueryOptions = (companyId: string | null) =>
  queryOptions({
    queryKey: teamMembersQueryKey(companyId),
    queryFn: () => fetchTeamMembers({ data: { companyId: companyId! } }),
    enabled: !!companyId,
    staleTime: 30_000,
  })

export const teamMemberQueryOptions = (
  companyId: string | null,
  memberId: string | null,
) =>
  queryOptions({
    queryKey: teamMemberQueryKey(companyId, memberId),
    queryFn: () =>
      fetchTeamMember({
        data: { companyId: companyId!, memberId: memberId! },
      }),
    enabled: !!companyId && !!memberId,
    staleTime: 30_000,
  })

export function useTeamMembers(companyId: string | null) {
  return useQuery(teamMembersQueryOptions(companyId))
}

export function useTeamMember(
  companyId: string | null,
  memberId: string | null,
) {
  return useQuery(teamMemberQueryOptions(companyId, memberId))
}

export function useInvalidateTeam(companyId: string | null) {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({
      queryKey: teamMembersQueryKey(companyId),
    })
  }
}

export type { TeamMemberRow }
