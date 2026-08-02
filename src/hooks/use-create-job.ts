import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createJob } from '#/server/fn/jobs'
import { JOBS_QUERY_KEY_PREFIX } from '#/lib/jobs-shared'
import type { CreateJobInput } from '#/server/fn/jobs'

/**
 * Port of the source's `useCreateJob`. Invokes the user-scoped `createJob`
 * server function and invalidates the Jobs list on success using the `['jobs']`
 * prefix (source parity — `jobsQueryKey` is `['jobs', companyId]`), so the new
 * Job appears in the list (#4) via a refetch. No optimistic update: the server
 * is the authority (RLS + `canCreateJob`) and the row's final shape (wrapped
 * requirements, forwarding email, pipeline stages) is only correct post-insert.
 */
export function useCreateJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateJobInput) => createJob({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY_PREFIX })
    },
  })
}
