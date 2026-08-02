import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  getAuthState,
  exchangeAuthCode,
  resendConfirmation,
  signOut,
} from '#/server/fn/auth'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

export const Route = createFileRoute('/confirm-email')({
  validateSearch: (search: Record<string, unknown>): { code?: string; email?: string } => ({
    code: typeof search.code === 'string' ? search.code : undefined,
    email: typeof search.email === 'string' ? search.email : undefined,
  }),
  beforeLoad: async ({ search }) => {
    // Already signed in and not mid-confirmation → nothing to do here.
    if (!search.code) {
      const { user } = await getAuthState()
      if (user) throw redirect({ to: '/dashboard' })
    }
  },
  loaderDeps: ({ search }) => ({ code: search.code }),
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
  const [cooldown, setCooldown] = useState(0)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const onResend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || cooldown > 0) return
    setSending(true)
    setNotice(null)
    const res = await resendConfirmation({ data: { email } })
    setSending(false)
    if (res.ok) {
      setNotice('Confirmation email sent. Check your inbox.')
      setCooldown(RESEND_COOLDOWN)
      const tick = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) {
            clearInterval(tick)
            return 0
          }
          return c - 1
        })
      }, 1000)
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
      <div className="flex min-h-svh items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Email confirmed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              Welcome to Talsek! Your email is confirmed.
            </p>
            <Button className="w-full" onClick={onContinue}>
              Continue to sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (code && loader.mode === 'error') {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Confirmation link invalid</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {loader.error}. The link may be expired or already used.
            </p>
            <p className="text-sm">
              <a href="/signup" className="hover:text-foreground">
                Try signing up again
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Landed directly (e.g. right after sign-up) — show the "check your email" /
  // resend UI.
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link{initialEmail ? ` to ${initialEmail}` : ''}.
            Click it to activate your account.
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
              className="w-full"
              disabled={sending || cooldown > 0}
            >
              {cooldown > 0
                ? `Resend in ${cooldown}s`
                : sending
                  ? 'Sending…'
                  : 'Resend confirmation email'}
            </Button>
            {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
          </form>
          <p className="text-center text-sm">
            <a href="/signin" className="hover:text-foreground">
              Back to sign in
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
