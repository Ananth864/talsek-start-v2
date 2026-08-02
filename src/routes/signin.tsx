import { createFileRoute, redirect, useNavigate, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { getAuthState, signIn, signInWithGoogle } from '#/server/fn/auth'
import { safeReturnTo } from '#/lib/auth-shared'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

export const Route = createFileRoute('/signin')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: async () => {
    const { user } = await getAuthState()
    if (user) throw redirect({ to: '/dashboard' })
  },
  component: SignInPage,
})

/** Validated return path, or `/dashboard` if absent/invalid (open-redirect guard). */
function resolveReturnTo(raw: string | undefined) {
  return safeReturnTo(raw) ?? '/dashboard'
}

function SignInPage() {
  const navigate = useNavigate()
  const { redirect: redirectParam } = useSearch({ from: '/signin' })
  const returnTo = resolveReturnTo(redirectParam)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await signIn({ data: { email, password } })
    setLoading(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    // Typed navigate for the common case; sanitized full-path reload for deep
    // links (TanStack Router types `to` to known routes only).
    if (returnTo === '/dashboard') {
      navigate({ to: '/dashboard' })
    } else {
      window.location.assign(returnTo)
    }
  }

  const onGoogle = async () => {
    setGoogleLoading(true)
    setError(null)
    const res = await signInWithGoogle({
      data: { returnTo: returnTo === '/dashboard' ? undefined : returnTo },
    })
    if (!res.ok) {
      setGoogleLoading(false)
      setError(res.error)
      return
    }
    // Hand off to Google's consent screen; the browser returns to /auth/callback.
    window.location.href = res.url
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in to Talsek</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="relative py-1 text-center text-xs text-muted-foreground">
            <span className="relative z-10 bg-card px-2">or</span>
            <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onGoogle}
            disabled={googleLoading || loading}
          >
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <a href="/forgot-password" className="hover:text-foreground">
              Forgot password?
            </a>
            <span className="mx-2">·</span>
            <a href="/signup" className="hover:text-foreground">
              Create account
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
