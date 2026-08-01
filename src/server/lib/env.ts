import { z } from 'zod'

/**
 * Server-only environment. On Vercel serverless these are populated in
 * `process.env` at runtime; they must never be imported by client code.
 */
const serverEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

export const getServerEnv = (): ServerEnv => serverEnvSchema.parse(process.env)
