import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchFormTemplate,
  updateFormTemplate,
} from '#/server/fn/form-management'
import type { FormQuestionInput } from '#/lib/form-questions-shared'

export const formTemplateQueryKey = (companyId: string | null) =>
  ['form-template', companyId] as const

export const formTemplateQueryOptions = (companyId: string | null) =>
  queryOptions({
    queryKey: formTemplateQueryKey(companyId),
    queryFn: () => fetchFormTemplate(),
    enabled: !!companyId,
    staleTime: 60_000,
  })

export function useFormTemplate(companyId: string | null) {
  return useQuery(formTemplateQueryOptions(companyId))
}

export function useUpdateFormTemplate(companyId: string | null) {
  const queryClient = useQueryClient()
  return async (questions: FormQuestionInput[]) => {
    const result = await updateFormTemplate({ data: { questions } })
    await queryClient.invalidateQueries({
      queryKey: formTemplateQueryKey(companyId),
    })
    return result
  }
}
