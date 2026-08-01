import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

/**
 * Client + build-time environment. Server-only secrets live in
 * `src/server/lib/env.ts` and are never inlined into the client bundle.
 */
export const env = createEnv({
  server: {},
  clientPrefix: 'VITE_',
  client: {
    VITE_SUPABASE_URL: z.string().url(),
    VITE_SUPABASE_ANON_KEY: z.string().min(1),
    VITE_SENTRY_DSN: z.string().optional(),
    VITE_APP_TITLE: z.string().min(1).optional(),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
})
