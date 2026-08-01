import { createMiddleware } from '@tanstack/react-start'
import { requireUserClient } from '../lib/supabase'

/**
 * Loads the Member's session and attaches the user-scoped Supabase client to
 * the server-function context. Compose onto any protected server function.
 * Company scoping is enforced by RLS on the attached client (ADR-4).
 */
export const authMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const { client, session } = await requireUserClient()
    return next({ context: { supabase: client, session } })
  },
)
