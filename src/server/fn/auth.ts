import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  getSupabaseServerClient,
  getVerifiedUser,
  getRequestOrigin,
} from '../lib/supabase'
import { setCookie, getCookies, deleteCookie } from '@tanstack/react-start/server'
import {
  safeReturnTo,
  passwordField,
} from '#/lib/auth-shared'

/**
 * Auth server functions for the Member surface. Every mutation calls
 * `flushCookies()` synchronously after its `await` so Set-Cookie reaches the
 * server-function response (AGENTS.md). Verified identity is established with
 * `getClaims()`, never `getSession()` (ADR-0008).
 */

const ok = { ok: true } as const

export const signIn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const { client, flushCookies } = getSupabaseServerClient()
    const { error } = await client.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    flushCookies()
    if (error) return { ok: false, error: error.message } as const
    return ok
  })

export const signUp = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      email: z.string().email(),
      password: passwordField,
      firstName: z.string().min(1),
      lastName: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const origin = getRequestOrigin()
    const { client, flushCookies } = getSupabaseServerClient()
    const { error } = await client.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${origin}/confirm-email`,
        data: { first_name: data.firstName, last_name: data.lastName },
      },
    })
    flushCookies()
    if (error) return { ok: false, error: error.message } as const
    // Email confirmation is enabled in the project, so no session returns here;
    // the client always proceeds to the /confirm-email screen.
    return ok
  })

export const signInWithGoogle = createServerFn({ method: 'POST' })
  .validator(z.object({ returnTo: z.string().optional() }))
  .handler(async ({ data }) => {
    const origin = getRequestOrigin()
    const { client, flushCookies } = getSupabaseServerClient()
    const {
      data: oauth,
      error,
    } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        skipBrowserRedirect: true,
        redirectTo: `${origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    flushCookies() // the PKCE code verifier is stored in a cookie here
    if (error || !oauth.url) {
      return { ok: false, error: error?.message ?? 'Google sign-in failed' }
    }
    const returnTo = safeReturnTo(data.returnTo)
    if (returnTo) {
      // Carry the return path through the OAuth round-trip (ADR-0008).
      setCookie('auth-return-to', returnTo, {
        path: '/',
        sameSite: 'lax',
        httpOnly: true,
        maxAge: 60 * 10,
        secure: origin.startsWith('https://'),
      })
    }
    return { ok: true, url: oauth.url } as const
  })

export const signOut = createServerFn({ method: 'POST' }).handler(async () => {
  const { client, flushCookies } = getSupabaseServerClient()
  await client.auth.signOut()
  flushCookies()
  return ok
})

/** Verified identity probe for route guards (replaces the unsafe getSession fn). */
export const getAuthState = createServerFn({ method: 'GET' }).handler(
  async () => {
    const user = await getVerifiedUser()
    return { user }
  },
)

export const requestPasswordReset = createServerFn({ method: 'POST' })
  .validator(z.object({ email: z.string().email() }))
  .handler(async ({ data }) => {
    const { client, flushCookies } = getSupabaseServerClient()
    const { error } = await client.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${getRequestOrigin()}/reset-password`,
    })
    flushCookies()
    if (error) return { ok: false, error: error.message } as const
    return ok
  })

/** Sets a new password from a recovery session established at /reset-password. */
export const updatePassword = createServerFn({ method: 'POST' })
  .validator(z.object({ password: passwordField }))
  .handler(async ({ data }) => {
    const { client, flushCookies } = getSupabaseServerClient()
    const { error } = await client.auth.updateUser({
      password: data.password,
      data: { requires_password_change: false },
    })
    flushCookies()
    if (error) return { ok: false, error: error.message } as const
    return ok
  })

export const resendConfirmation = createServerFn({ method: 'POST' })
  .validator(z.object({ email: z.string().email() }))
  .handler(async ({ data }) => {
    const { client, flushCookies } = getSupabaseServerClient()
    const { error } = await client.auth.resend({
      type: 'signup',
      email: data.email,
      options: { emailRedirectTo: `${getRequestOrigin()}/confirm-email` },
    })
    flushCookies()
    if (error) return { ok: false, error: error.message } as const
    return ok
  })

/**
 * Exchanges a PKCE `code` (delivered by OAuth or email-link redirects) for a
 * session, writing the session cookies. Shared by /auth/callback,
 * /confirm-email, and /reset-password loaders.
 */
export const exchangeAuthCode = createServerFn({ method: 'GET' })
  .validator(z.object({ code: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { client, flushCookies } = getSupabaseServerClient()
    const { error } = await client.auth.exchangeCodeForSession(data.code)
    flushCookies()
    if (error) return { ok: false, error: error.message } as const
    return ok
  })

/** Reads and clears the `auth-return-to` cookie set by `signInWithGoogle`. */
export const consumeAuthReturnTo = createServerFn({ method: 'GET' }).handler(
  async () => {
    const path = getCookies()['auth-return-to']
    if (path) deleteCookie('auth-return-to', { path: '/' })
    return { returnTo: safeReturnTo(path) }
  },
)
