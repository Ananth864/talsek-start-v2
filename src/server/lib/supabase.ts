import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import { serverEnv } from './env'
import type { Database } from '#/integrations/supabase/types'

/**
 * Per-request Supabase client backed by the user's auth cookies (read/written
 * via TanStack Start's cookie API). Because the access token rides every
 * request, Row-Level Security scopes all reads to the Member's company — no
 * manual `company_id` filtering (ADR-4).
 */
export function getSupabaseServerClient() {
  return createServerClient<Database>(
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
            setCookie(c.name, c.value, c.options)
          }
        },
      },
    },
  )
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
  const client = getSupabaseServerClient()
  const {
    data: { session },
  } = await client.auth.getSession()
  if (!session) throw new Error('UNAUTHORIZED')
  return { client, session }
}
