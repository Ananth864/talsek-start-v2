import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle, Mail, RefreshCw } from 'lucide-react'
import {
  getAuthState,
  exchangeAuthCode,
  resendConfirmation,
  signOut,
} from '#/server/fn/auth'
import {
  AuthBackLink,
  AuthCenteredShell,
} from '#/components/auth/auth-centered-shell'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Card, CardContent, CardHeader } from '#/components/ui/card'

export const Route = createFileRoute('/confirm-email')({
  validateSearch: (search: Record<string, unknown>): { code?: string; email?: string } => ({
    code: typeof search.code === 'string' ? search.code : undefined,
    email: typeof search.email === 'string' ? search.email : undefined,
  }),
  loaderDeps: ({ search }) => ({ code: search.code }),
  beforeLoad: async ({ search }) => {
    // Already signed in and not mid-confirmation → nothing to do here.
    if (!search.code) {
      const { user } = await getAuthState()
      if (user) throw redirect({ to: '/dashboard' })
    }
  },
  loader: async ({ deps }) => {
    if (!deps.code) return { mode: 'resend' as const }
    const res = await exchangeAuthCode({ data: { code: deps.code } })
    return res.ok
      ? { mode: 'confirmed' as const }
      : { mode: 'error' as const, error: res.error }
  },
  component: ConfirmEmailPage,
})

const RESEND_COOLDOWN = 60

function ConfirmEmailPage() {
  const { code, email: initialEmail } = Route.useSearch()
  const loader = Route.useLoaderData()
  const navigate = useNavigate()
  const [email, setEmail] = useState(initialEmail ?? '')
  const [cooldown, setCooldown] = useState(initialEmail ? RESEND_COOLDOWN : 0)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  // Source SimpleResendEmail starts a 60s cooldown after landing from sign-up.
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const onResend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || cooldown > 0) return
    setSending(true)
    setNotice(null)
    const res = await resendConfirmation({ data: { email } })
    setSending(false)
    if (res.ok) {
      setNotice('Confirmation email sent. Check your inbox.')
      setEmailSent(true)
      setCooldown(RESEND_COOLDOWN)
    } else {
      setNotice(res.error)
    }
  }

  const onContinue = async () => {
    // Source behaviour: sign out after confirmation so the user logs in fresh.
    await signOut()
    navigate({ to: '/signin' })
  }

  // Clicked the email link — PKCE code exchange already ran in the loader.
  if (code && loader.mode === 'confirmed') {
    return (
      <AuthCenteredShell showBrand>
        <Card data-testid="auth-card" className="border-0 shadow-lg">
          <CardContent className="space-y-6 pt-8 text-center">
            <div className="bg-primary/10 mx-auto flex h-20 w-20 items-center justify-center rounded-full">
              <CheckCircle className="text-primary h-12 w-12" aria-hidden />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Email Confirmed Successfully!</h1>
              <p className="text-muted-foreground text-sm">
                Welcome to Talsek! Your email is confirmed.
              </p>
            </div>
            <Button className="w-full" onClick={onContinue}>
              Continue to sign in
            </Button>
          </CardContent>
        </Card>
      </AuthCenteredShell>
    )
  }

  if (code && loader.mode === 'error') {
    return (
      <AuthCenteredShell showBrand>
        <Card data-testid="auth-card" className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <h1 className="text-2xl font-bold">Confirmation link invalid</h1>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground text-sm">
              {loader.error}. The link may be expired or already used.
            </p>
            <Button asChild className="w-full" variant="outline">
              <Link to="/signup">Try signing up again</Link>
            </Button>
            <AuthBackLink to="/signin" className="mb-0 justify-center">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to sign in
            </AuthBackLink>
          </CardContent>
        </Card>
      </AuthCenteredShell>
    )
  }

  if (emailSent) {
    return (
      <AuthCenteredShell showBrand>
        <Card data-testid="auth-card" className="border-0 shadow-lg">
          <CardContent className="space-y-6 pt-8 text-center">
            <div className="bg-primary/10 mx-auto flex h-20 w-20 items-center justify-center rounded-full">
              <CheckCircle className="text-primary h-12 w-12" aria-hidden />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Email Sent!</h1>
              <p className="text-muted-foreground text-sm">
                A new confirmation email has been sent
                {email ? (
                  <>
                    {' '}
                    to <strong>{email}</strong>
                  </>
                ) : null}
                .
              </p>
            </div>
            <p className="bg-muted rounded-lg border p-4 text-sm">
              Please check your inbox and spam folder. The new confirmation link
              will be valid for 24 hours.
            </p>
            {cooldown > 0 && (
              <p className="text-muted-foreground text-sm">
                You can resend again in {cooldown}s
              </p>
            )}
            <Button
              variant="outline"
              className="w-full gap-2"
              disabled={cooldown > 0}
              onClick={() => setEmailSent(false)}
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend again'}
            </Button>
            <AuthBackLink to="/signin" className="mb-0 justify-center">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to sign in
            </AuthBackLink>
          </CardContent>
        </Card>
      </AuthCenteredShell>
    )
  }

  // Landed directly (e.g. right after sign-up) — show the "check your email" /
  // resend UI.
  return (
    <AuthCenteredShell showBrand>
      <Card data-testid="auth-card" className="border-0 shadow-lg">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Mail className="text-primary h-8 w-8" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold">Check your email</h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center text-sm">
            We sent a confirmation link
            {initialEmail ? ` to ${initialEmail}` : ''}. Click it to activate
            your account.
          </p>
          <form onSubmit={onResend} className="space-y-3">
            {!initialEmail && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}
            <Button
              type="submit"
              variant="outline"
              className="w-full gap-2"
              disabled={sending || cooldown > 0 || !email}
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              {cooldown > 0
                ? `Resend in ${cooldown}s`
                : sending
                  ? 'Sending…'
                  : 'Resend confirmation email'}
            </Button>
            {notice && (
              <p className="text-muted-foreground text-sm">{notice}</p>
            )}
          </form>
          <div className="flex justify-center">
            <AuthBackLink to="/signin" className="mb-0">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to sign in
            </AuthBackLink>
          </div>
        </CardContent>
      </Card>
    </AuthCenteredShell>
  )
}
