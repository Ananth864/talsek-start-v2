import { createFileRoute, redirect } from '@tanstack/react-router'
import { exchangeAuthCode, consumeAuthReturnTo } from '#/server/fn/auth'

/**
 * OAuth PKCE callback. Supabase redirects here with `?code=`; the loader
 * exchanges it for a session and immediately throws a server-side redirect
 * to the return-to path, so the browser does a single 307 hop and never
 * downloads or hydrates an intermediate "signing you in" page. The session
 * Set-Cookie written by the exchange reaches the browser: the start server
 * merges pending event cookies into any non-2xx response, redirects
 * included. No code (e.g. a direct visit) bounces to sign-in.
 */
export const Route = createFileRoute('/auth/callback')({
  validateSearch: (search: Record<string, unknown>): { code?: string } => ({
    code: typeof search.code === 'string' ? search.code : undefined,
  }),
  loaderDeps: ({ search }) => ({ code: search.code }),
  beforeLoad: async ({ search }) => {
    if (!search.code) throw redirect({ to: '/signin' })
  },
  loader: async ({ deps }) => {
    const res = await exchangeAuthCode({ data: { code: deps.code! } })
    const { returnTo } = await consumeAuthReturnTo()
    // `href` because returnTo is a server-sanitized arbitrary path (ADR-0008);
    // typed `to` only accepts known routes.
    throw redirect({
      href: res.ok ? (returnTo ?? '/dashboard') : '/signin',
    })
  },
})
