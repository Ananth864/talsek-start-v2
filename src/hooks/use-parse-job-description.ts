import { useMutation } from '@tanstack/react-query'
import { parseJobDescription } from '#/server/fn/jobs'
import type { ParseJobInput } from '#/server/fn/jobs'

/**
 * Port of the source's `useParseJobDescription`. Calls the user-scoped server
 * function (the edge-function HTTP invoke is gone). On failure the dialog still
 * advances to manual entry, so this hook surfaces the error without side
 * effects beyond an optional toast (handled at the call site).
 */
export function useParseJobDescription() {
  return useMutation({
    mutationFn: (input: ParseJobInput) => parseJobDescription({ data: input }),
  })
}
