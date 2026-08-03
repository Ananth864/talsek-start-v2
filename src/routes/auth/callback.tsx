import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect } from 'react'
import { exchangeAuthCode, consumeAuthReturnTo } from '#/server/fn/auth'

/**
 * OAuth PKCE callback. Supabase redirects here with `?code=`; the loader
 * exchanges it for a session (cookies are written inside the server function),
 * then the browser is sent on to the return-to path or the dashboard.
 * No code (e.g. a direct visit) bounces to sign-in.
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
    return { ok: res.ok, returnTo: returnTo ?? '/dashboard' }
  },
  component: CallbackPage,
})

function CallbackPage() {
  const { ok, returnTo } = Route.useLoaderData()

  useEffect(() => {
    // returnTo is a sanitized relative path (server-validated), so a full reload
    // is safe and lets SSR render the destination with the session cookie set.
    window.location.assign(ok ? returnTo : '/signin')
  }, [ok, returnTo])

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <p className="text-sm text-muted-foreground">
        {ok ? 'Signing you in…' : 'Sign-in failed. Redirecting…'}
      </p>
    </div>
  )
}
