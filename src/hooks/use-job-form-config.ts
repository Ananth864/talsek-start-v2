import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchJobFormConfig,
  upsertJobFormConfig,
} from '#/server/fn/form-management'
import type { FormQuestionInput } from '#/lib/form-questions-shared'
import { jobsQueryKey } from '#/lib/jobs-shared'

export const jobFormConfigQueryKey = (
  companyId: string | null,
  jobId: string | null,
) => ['job-form-config', companyId, jobId] as const

export const jobFormConfigQueryOptions = (
  companyId: string | null,
  jobId: string | null,
) =>
  queryOptions({
    queryKey: jobFormConfigQueryKey(companyId, jobId),
    queryFn: () => fetchJobFormConfig({ data: { jobId: jobId! } }),
    enabled: !!companyId && !!jobId,
    staleTime: 30_000,
  })

export function useJobFormConfig(
  companyId: string | null,
  jobId: string | null,
) {
  return useQuery(jobFormConfigQueryOptions(companyId, jobId))
}

export function useUpsertJobFormConfig(companyId: string | null) {
  const queryClient = useQueryClient()
  return async (input: {
    jobId: string
    isEnabled: boolean
    questions: FormQuestionInput[]
    customQuestionText: Record<string, string>
  }) => {
    const result = await upsertJobFormConfig({ data: input })
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: jobFormConfigQueryKey(companyId, input.jobId),
      }),
      queryClient.invalidateQueries({
        queryKey: jobsQueryKey(companyId),
      }),
    ])
    return result
  }
}
