import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import {
  getCookies,
  setCookie,
  getRequestUrl,
} from '@tanstack/react-start/server'
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

/**
 * Verified identity for the current request, via JWT signature check
 * (`getClaims()`). Use for authorization decisions in route guards and the
 * session middleware — never `getSession()`, whose cookie-backed payload is not
 * trusted (ADR-0008). Returns a minimal `{ id, email }` or `null`.
 */
export async function getVerifiedUser() {
  const { client, flushCookies } = getSupabaseServerClient()
  const { data, error } = await client.auth.getClaims()
  flushCookies()
  if (error || !data) return null
  const claims = data.claims
  const id = typeof claims.sub === 'string' ? claims.sub : null
  const email = typeof claims.email === 'string' ? claims.email : null
  if (!id) return null
  return { id, email }
}

/**
 * Builds the user-scoped Supabase client for protected server functions.
 * Verifies identity via `getClaims()` (throws `UNAUTHORIZED` if invalid), then
 * exposes the cookie-backed client and session tokens. RLS re-validates the
 * token at the Postgres layer on every query, so the session is only a carrier.
 */
export async function requireUserClient() {
  const { client, flushCookies } = getSupabaseServerClient()
  const user = await getVerifiedUser()
  if (!user) throw new Error('UNAUTHORIZED')
  const {
    data: { session },
  } = await client.auth.getSession()
  flushCookies()
  if (!session) throw new Error('UNAUTHORIZED')
  return { client, session, user }
}

/**
 * Absolute origin of the incoming request (e.g. `http://localhost:3000`,
 * `https://app.example.com`). Used to build Supabase email/OAuth redirect URLs
 * under SSR, where `window.location` is unavailable. Honors Vercel's forwarded
 * host/proto headers (ADR-0008).
 */
export function getRequestOrigin() {
  const url = getRequestUrl({ xForwardedHost: true, xForwardedProto: true })
  return `${url.protocol}//${url.host}`
}
