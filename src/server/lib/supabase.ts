import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import {
  getRequestHeader,
  setResponseHeader,
} from '@tanstack/react-start/server'
import { getServerEnv } from './env'
import { parseCookieHeader, serializeCookie } from './cookies'
import type { Database } from '#/integrations/supabase/types'

/**
 * Per-request Supabase client backed by the user's auth cookies. Because the
 * access token is sent on every query, Row-Level Security scopes all reads to
 * the Member's company — no manual `company_id` filtering needed (ADR-4).
 */
export function getSupabaseServerClient() {
  const serverEnv = getServerEnv()
  return createServerClient<Database>(
    serverEnv.SUPABASE_URL,
    serverEnv.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(getRequestHeader('cookie'))
        },
        setAll(cookiesToSet) {
          // Supabase may chunk the auth token across several cookies; pass them
          // as an array so all values are preserved on a single Set-Cookie header.
          setResponseHeader(
            'Set-Cookie',
            cookiesToSet.map((c) =>
              serializeCookie(c.name, c.value, c.options as never),
            ),
          )
        },
      },
    },
  )
}

/** Service-role client — bypasses RLS. Session-less operations only (ADR-4). */
export function getAdminClient() {
  const serverEnv = getServerEnv()
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
