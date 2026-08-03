import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { CheckCircle, Lock, XCircle } from 'lucide-react'
import {
  exchangeAuthCode,
  updatePassword,
  signOut,
} from '#/server/fn/auth'
import { passwordRules, PASSWORD_RULE_MESSAGE } from '#/lib/auth-shared'
import { AuthCenteredShell } from '#/components/auth/auth-centered-shell'
import { PasswordInput } from '#/components/auth/password-input'
import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import { Card, CardContent, CardHeader } from '#/components/ui/card'
import { cn } from '#/lib/utils'

function passwordStrength(password: string) {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
  }
}

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, unknown>): { code?: string } => ({
    code: typeof search.code === 'string' ? search.code : undefined,
  }),
  beforeLoad: async ({ search }) => {
    // A code is required to establish the recovery session.
    if (!search.code) throw redirect({ to: '/forgot-password' })
  },
  loaderDeps: ({ search }) => ({ code: search.code }),
  loader: async ({ deps }) => {
    const res = await exchangeAuthCode({ data: { code: deps.code! } })
    return { exchangeOk: res.ok }
  },
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const navigate = useNavigate()
  const { exchangeOk } = Route.useLoaderData()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (!done || countdown <= 0) {
      if (done && countdown === 0) navigate({ to: '/signin' })
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [done, countdown, navigate])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!passwordRules.test(password)) {
      setError(PASSWORD_RULE_MESSAGE)
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    const res = await updatePassword({ data: { password } })
    setLoading(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    // Match source behaviour: sign the user out after a reset so they
    // re-authenticate with the new password.
    await signOut()
    setDone(true)
  }

  if (!exchangeOk) {
    return (
      <AuthCenteredShell showBrand>
        <Card data-testid="auth-card" className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <div className="bg-destructive/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
              <XCircle className="text-destructive h-12 w-12" aria-hidden />
            </div>
            <h1 className="text-2xl font-bold">Invalid Reset Link</h1>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-muted-foreground text-sm">
              This password reset link is invalid or has already been used.
            </p>
            <p className="bg-muted text-muted-foreground rounded-lg border p-4 text-sm">
              Please request a new password reset link from the sign in page.
            </p>
            <Button asChild className="w-full">
              <Link to="/signin">Back to Sign In</Link>
            </Button>
            <p className="text-sm">
              <Link
                to="/forgot-password"
                className="text-primary hover:underline"
              >
                Request a new link
              </Link>
            </p>
          </CardContent>
        </Card>
      </AuthCenteredShell>
    )
  }

  return (
    <AuthCenteredShell showBrand>
      <Card data-testid="auth-card" className="border-0 shadow-lg">
        <CardContent className="space-y-6 pt-8">
          {done ? (
            <div className="space-y-6 text-center">
              <div className="bg-primary/10 mx-auto flex h-20 w-20 items-center justify-center rounded-full">
                <CheckCircle className="text-primary h-12 w-12" aria-hidden />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">
                  Password Updated Successfully!
                </h1>
                <p className="text-muted-foreground text-sm">
                  Your password has been changed. You can now sign in with your
                  new password.
                </p>
              </div>
              <p className="bg-muted rounded-lg border p-4 text-sm">
                Redirecting to sign in page in {countdown} seconds...
              </p>
              <Button
                className="w-full"
                onClick={() => navigate({ to: '/signin' })}
              >
                Continue to Sign In
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold">Create New Password</h1>
                <p className="text-muted-foreground text-sm">
                  Enter your new password below. Make sure it's strong and
                  secure.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <PasswordInput
                    id="password"
                    placeholder="Enter your new password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    visible={showPassword}
                    onToggleVisible={() => setShowPassword((v) => !v)}
                    required
                  />
                  {password ? (
                    <ul className="space-y-1 text-sm" aria-live="polite">
                      {(
                        [
                          ['minLength', 'At least 8 characters'],
                          ['hasUppercase', 'One uppercase letter'],
                          ['hasLowercase', 'One lowercase letter'],
                          ['hasNumbers', 'One number'],
                        ] as const
                      ).map(([key, label]) => {
                        const met = passwordStrength(password)[key]
                        return (
                          <li
                            key={key}
                            className={cn(
                              'flex items-center gap-2',
                              met ? 'text-primary' : 'text-muted-foreground',
                            )}
                          >
                            {met ? (
                              <CheckCircle className="h-3 w-3" aria-hidden />
                            ) : (
                              <XCircle className="h-3 w-3" aria-hidden />
                            )}
                            {label}
                          </li>
                        )
                      })}
                    </ul>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm New Password</Label>
                  <PasswordInput
                    id="confirm"
                    placeholder="Confirm your new password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    disabled={loading}
                    visible={showConfirm}
                    onToggleVisible={() => setShowConfirm((v) => !v)}
                    toggleTestId="confirm-password-visibility-toggle"
                    required
                  />
                  {confirm && password ? (
                    <p
                      className={cn(
                        'flex items-center gap-2 text-sm',
                        password === confirm
                          ? 'text-primary'
                          : 'text-destructive',
                      )}
                    >
                      {password === confirm ? (
                        <CheckCircle className="h-3 w-3" aria-hidden />
                      ) : (
                        <XCircle className="h-3 w-3" aria-hidden />
                      )}
                      {password === confirm
                        ? 'Passwords match'
                        : 'Passwords do not match'}
                    </p>
                  ) : null}
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={loading || !password || !confirm}
                >
                  <Lock className="h-4 w-4" aria-hidden />
                  {loading ? 'Updating Password...' : 'Update Password'}
                </Button>
              </form>

              <div className="bg-muted/50 rounded-lg border p-4">
                <div className="flex items-start gap-2">
                  <Lock className="text-primary mt-0.5 h-5 w-5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Security Tips:</p>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>Use a unique password you haven't used elsewhere</li>
                      <li>Consider using a password manager</li>
                      <li>Make sure it's easy for you to remember</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </AuthCenteredShell>
  )
}
