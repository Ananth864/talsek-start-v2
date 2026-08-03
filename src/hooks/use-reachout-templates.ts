import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchReachoutTemplates,
  saveReachoutTemplate,
} from '#/server/fn/templates'
import type {
  ReachoutTemplate,
  TemplateKind,
} from '#/lib/reachout-template-shared'

export const reachoutTemplatesQueryKey = (companyId: string | null) =>
  ['reachout-templates', companyId] as const

export const reachoutTemplatesQueryOptions = (companyId: string | null) =>
  queryOptions({
    queryKey: reachoutTemplatesQueryKey(companyId),
    queryFn: () => fetchReachoutTemplates(),
    enabled: !!companyId,
    staleTime: 60_000,
  })

export function useReachoutTemplates(companyId: string | null) {
  return useQuery(reachoutTemplatesQueryOptions(companyId))
}

export function useSaveReachoutTemplate(companyId: string | null) {
  const queryClient = useQueryClient()
  return async (kind: TemplateKind, template: Omit<ReachoutTemplate, 'created_at'>) => {
    const result = await saveReachoutTemplate({
      data: {
        kind,
        template: {
          subject: template.subject,
          body: template.body,
          reply_to_email: template.reply_to_email,
        },
      },
    })
    await queryClient.invalidateQueries({
      queryKey: reachoutTemplatesQueryKey(companyId),
    })
    return result
  }
}
