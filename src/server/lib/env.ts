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
    // AI providers (ADR-0005). Optional: when absent, AI-backed server functions
    // fall back to a deterministic stub so the flow is exercisable in dev/E2E
    // without real provider credentials. Production sets these.
    OPENAI_API_KEY: z.string().min(1).optional(),
    OPENAI_BASE_URL: z.string().url().optional(),
    GROK_API_KEY: z.string().min(1).optional(),
    // Gemini — Resume Extraction primary + Email Analysis fallback (#9).
    GEMINI_API_KEY: z.string().min(1).optional(),
    // When "1"/"true", the Resume AI pipeline returns deterministic stubs
    // (skips provider calls + credit consume). Playwright sets this so E2E
    // exercises the sync chain without multi-minute hedged AI calls (ADR-0014).
    AI_PIPELINE_STUB: z.enum(['1', 'true']).optional(),
    // Upstash Redis for Applicant IP rate limits (ADR-0015). Optional: when
    // absent, `checkIpRateLimit` falls back to an in-process sliding window
    // so local/E2E still reject overruns.
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  },
  clientPrefix: 'NO_CLIENT_',
  client: {},
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
