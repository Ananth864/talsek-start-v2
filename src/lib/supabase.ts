import { createBrowserClient } from '@supabase/ssr'
import { env } from '#/env'
import type { Database } from '#/integrations/supabase/types'

/**
 * Browser Supabase client. The session lives in httpOnly cookies managed by
 * `@supabase/ssr`; this client reads/writes them and authorises Realtime +
 * Storage requests with the user's access token. Used for client-only work
 * (Realtime subscriptions, direct Storage uploads). All reads/mutations of
 * business data go through server functions instead.
 */
export const supabaseBrowser = createBrowserClient<Database>(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY,
)
