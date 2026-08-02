import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import { serverEnv } from './env'
import type { Database } from '#/integrations/supabase/types'

type PendingCookie = { name: string; value: string; options?: object }

/**
 * Per-request Supabase client backed by the user's auth cookies.
 *
 * Supabase-ssr's `setAll` fires *inside* its awaited auth calls, which is not
 * the handler's synchronous frame — so writes are stashed and flushed by the
 * caller via `flushCookies()` immediately after the await (the documented
 * pattern for setting response headers from a server function). Reads use
 * `getCookies()` directly.
 */
export function getSupabaseServerClient() {
  const pending: PendingCookie[] = []

  const client = createServerClient<Database>(
    serverEnv.SUPABASE_URL,
    serverEnv.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return Object.entries(getCookies()).map(([name, value]) => ({
            name,
            value,
          }))
        },
        setAll(cookiesToSet) {
          for (const c of cookiesToSet) {
            pending.push({ name: c.name, value: c.value, options: c.options })
          }
        },
      },
    },
  )

  /** Apply any cookies Supabase queued. Call right after the auth `await`. */
  function flushCookies() {
    for (const c of pending) setCookie(c.name, c.value, c.options)
  }

  return { client, flushCookies }
}

/** Service-role client — bypasses RLS. Session-less operations only (ADR-4). */
export function getAdminClient() {
  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set — required for admin/webhook/cron flows.',
    )
  }
  return createClient<Database>(
    serverEnv.SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/** Returns the cookie-backed client plus the active session, or throws. */
export async function requireUserClient() {
  const { client } = getSupabaseServerClient()
  const {
    data: { session },
  } = await client.auth.getSession()
  if (!session) throw new Error('UNAUTHORIZED')
  return { client, session }
}
