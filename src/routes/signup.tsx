import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { getAuthState, signUp, signInWithGoogle } from '#/server/fn/auth'
import { passwordRules, PASSWORD_RULE_MESSAGE } from '#/lib/auth-shared'
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

export const Route = createFileRoute('/signup')({
  beforeLoad: async () => {
    const { user } = await getAuthState()
    if (user) throw redirect({ to: '/dashboard' })
  },
  component: SignUpPage,
})

// The full password rule also lives on the `signUp` server validator
// (src/lib/auth-shared), so client and server stay in sync.

function SignUpPage() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!passwordRules.test(password)) {
      setError(PASSWORD_RULE_MESSAGE)
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }
    setLoading(true)
    const res = await signUp({
      data: { email, password, firstName, lastName },
    })
    setLoading(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    navigate({ to: '/confirm-email', search: { email } })
  }

  const onGoogle = async () => {
    setGoogleLoading(true)
    setError(null)
    const res = await signInWithGoogle({ data: {} })
    if (!res.ok) {
      setGoogleLoading(false)
      setError(res.error)
      return
    }
    // PKCE verifier flushed in signInWithGoogle (ADR-0008).
    window.location.href = res.url
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join thousands of companies using Talsek"
    >
      <Card data-testid="auth-card" className="border-0 shadow-lg">
        <CardContent className="space-y-6 pt-6">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="space-y-6">
            <GoogleOAuthButton
              onClick={onGoogle}
              loading={googleLoading}
              disabled={loading}
            />

            <AuthEmailSeparator />

            <form
              data-testid="auth-email-form"
              onSubmit={onSubmit}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    autoComplete="given-name"
                    autoFocus
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading || googleLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading || googleLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@company.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || googleLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || googleLoading}
                  visible={showPassword}
                  onToggleVisible={() => setShowPassword((v) => !v)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || googleLoading}
                  visible={showConfirmPassword}
                  onToggleVisible={() => setShowConfirmPassword((v) => !v)}
                  toggleTestId="confirm-password-visibility-toggle"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || googleLoading}
              >
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </form>
          </div>
        </CardContent>

        <CardFooter>
          <p
            data-testid="auth-secondary-link"
            className="text-muted-foreground w-full text-center text-sm"
          >
            Already have an account?{' '}
            <Link to="/signin" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
