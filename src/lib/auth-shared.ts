import { z } from 'zod'

/**
 * Pure auth helpers shared between client routes and server functions (no
 * server-only imports). Kept out of `src/server/` so the client can import it.
 */

/**
 * Open-redirect-safe relative path, or `null`. A valid return-to must start
 * with `/` and not `//` (protocol-relative). See ADR-0008.
 */
export function safeReturnTo(path: unknown): string | null {
  if (typeof path !== 'string') return null
  if (!path.startsWith('/') || path.startsWith('//')) return null
  return path
}

/** Source-app password rules: at least 8 chars with upper, lower, and a digit. */
export const passwordRules = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

export const PASSWORD_RULE_MESSAGE =
  'Password must be at least 8 characters and include upper, lower, and a digit.'

/**
 * Shared Zod field enforcing the full password rule — used by both the client
 * form validation and the `signUp` / `updatePassword` server validators so the
 * rule lives in one place.
 */
export const passwordField = z
  .string()
  .min(8)
  .regex(passwordRules, PASSWORD_RULE_MESSAGE)
