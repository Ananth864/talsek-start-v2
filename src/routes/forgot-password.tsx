import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle, Mail, RefreshCw } from 'lucide-react'
import { getAuthState, requestPasswordReset } from '#/server/fn/auth'
import {
  AuthBackLink,
  AuthCenteredShell,
} from '#/components/auth/auth-centered-shell'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '#/components/ui/card'

export const Route = createFileRoute('/forgot-password')({
  beforeLoad: async () => {
    const { user } = await getAuthState()
    if (user) throw redirect({ to: '/dashboard' })
  },
  component: ForgotPasswordPage,
})

/** Mask an email for the success card, e.g. `a***e@acme.com`. */
function maskEmail(email: string) {
  const [name, domain] = email.split('@')
  if (!domain || name.length < 2) return email
  return `${name[0]}${'*'.repeat(Math.max(name.length - 2, 1))}${
    name[name.length - 1]
  }@${domain}`
}

const SUCCESS_STEPS = [
  'Check your email inbox (and spam folder) for the reset link',
  "Click the 'Reset Password' link in the email, if you received it",
  'Create your new password and sign in',
] as const

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [emailSent, setEmailSent] = useState<string | null>(null)
  const masked = useMemo(
    () => (emailSent ? maskEmail(emailSent) : ''),
    [emailSent],
  )

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Non-revealing: the UI always shows the success card, regardless of whether
    // the address exists (Supabase does not surface user-existence on reset).
    await requestPasswordReset({ data: { email } })
    setLoading(false)
    setEmailSent(email)
    setSent(true)
  }

  const resetForm = () => {
    setSent(false)
    setEmailSent(null)
    setEmail('')
  }

  return (
    <AuthCenteredShell
      backLink={
        !sent ? (
          <AuthBackLink to="/signin">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to sign in
          </AuthBackLink>
        ) : undefined
      }
    >
      <Card data-testid="auth-card" className="border-0 shadow-lg">
        <CardHeader className="space-y-1 pb-6">
          <div className="text-center">
            {sent ? (
              <>
                <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <CheckCircle className="text-primary h-8 w-8" aria-hidden />
                </div>
                <h1 className="text-2xl font-bold">Check your email</h1>
                <p className="text-muted-foreground mt-2">
                  If an account exists, you'll receive password reset
                  instructions shortly.
                </p>
              </>
            ) : (
              <>
                <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <Mail className="text-primary h-8 w-8" aria-hidden />
                </div>
                <h1 className="text-2xl font-bold">Forgot your password?</h1>
                <p className="text-muted-foreground mt-2">
                  Enter your email and we'll send you reset instructions
                </p>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {sent ? (
            <div className="space-y-6">
              <div className="bg-muted/50 space-y-2 rounded-lg border p-4">
                <p className="text-sm font-medium">
                  Password reset email sent to:
                </p>
                <p className="bg-muted rounded px-2 py-1 font-mono text-sm">
                  {masked || 'your email'}
                </p>
                <p className="text-muted-foreground text-sm">
                  If an account exists for this address, a reset link is on its
                  way.
                </p>
              </div>

              <div
                data-testid="forgot-success-steps"
                className="text-muted-foreground space-y-3 text-sm"
              >
                <p className="text-foreground font-medium">What to do next:</p>
                <div className="space-y-3">
                  {SUCCESS_STEPS.map((step, index) => (
                    <div key={step} className="flex items-start gap-3">
                      <div className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-medium">
                        {index + 1}
                      </div>
                      <p>{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={resetForm}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  Send to different email
                </Button>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => navigate({ to: '/signin' })}
                >
                  Back to sign in
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? (
                  'Sending…'
                ) : (
                  <>
                    <Mail className="h-4 w-4" aria-hidden />
                    Send reset link
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>

        {!sent && (
          <CardFooter>
            <p
              data-testid="auth-secondary-link"
              className="text-muted-foreground w-full text-center text-sm"
            >
              Remember your password?{' '}
              <Link
                to="/signin"
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        )}
      </Card>
    </AuthCenteredShell>
  )
}
