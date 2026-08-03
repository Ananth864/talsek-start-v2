import { createFileRoute, Link, redirect, useNavigate, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { getAuthState, signIn, signInWithGoogle } from '#/server/fn/auth'
import { safeReturnTo } from '#/lib/auth-shared'
import { AuthLayout } from '#/components/auth/auth-layout'
import { AuthEmailSeparator } from '#/components/auth/auth-email-separator'
import { GoogleOAuthButton } from '#/components/auth/google-oauth-button'
import { PasswordInput } from '#/components/auth/password-input'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Card,
  CardContent,
  CardFooter,
} from '#/components/ui/card'

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
  const [showPassword, setShowPassword] = useState(false)
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
    // PKCE verifier cookies were flushed in signInWithGoogle (ADR-0008).
    window.location.href = res.url
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Talsek account"
    >
      <Card data-testid="auth-card" className="border-0 shadow-lg">
        <CardContent className="space-y-8 pt-8">
          <GoogleOAuthButton
            onClick={onGoogle}
            loading={googleLoading}
            disabled={loading}
          />

          <AuthEmailSeparator />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <form
            data-testid="auth-email-form"
            onSubmit={onSubmit}
            className="space-y-6"
          >
            <div className="space-y-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || googleLoading}
                required
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || googleLoading}
                visible={showPassword}
                onToggleVisible={() => setShowPassword((v) => !v)}
                required
              />
            </div>

            <div className="text-right">
              <Link
                to="/forgot-password"
                data-testid="forgot-password-link"
                className="text-primary text-sm hover:underline"
              >
                Forgot your password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || googleLoading}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>

        <CardFooter>
          <p
            data-testid="auth-secondary-link"
            className="text-muted-foreground w-full text-center text-sm"
          >
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
