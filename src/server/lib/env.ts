import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

/**
 * Server-only environment, validated with the same library as the client env
 * (`src/env.ts`) for consistency. Server-only — never imported by client code.
 * On Vercel serverless `process.env` is populated at cold start, so module-load
 * validation is safe here (unlike on edge runtimes).
 */
export const serverEnv = createEnv({
  server: {
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    // Only required for admin/webhook/cron flows; user-scoped flows work without it.
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  },
  clientPrefix: 'NO_CLIENT_',
  client: {},
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
