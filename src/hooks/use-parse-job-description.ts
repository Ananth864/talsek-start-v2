import { useState } from 'react'
import { parseJobDescription } from '#/server/fn/jobs'
import type { ParseJobInput } from '#/server/fn/jobs'

/**
 * Port of the source's `useParseJobDescription`. Calls the user-scoped server
 * function (the edge-function HTTP invoke is gone). Returns ephemeral wizard
 * fields only — nothing lands in the React Query cache, so this is a pending
 * wrapper rather than `useMutation` (no query keys to invalidate). On failure
 * the dialog still advances to manual entry; toasts stay at the call site.
 */
export function useParseJobDescription() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (input: ParseJobInput) => {
    setIsPending(true)
    try {
      return await parseJobDescription({ data: input })
    } finally {
      setIsPending(false)
    }
  }

  return { isPending, mutateAsync }
}
