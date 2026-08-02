import { createFileRoute, redirect } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { getAuthState, requestPasswordReset } from '#/server/fn/auth'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

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

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const masked = useMemo(() => maskEmail(email), [email])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Non-revealing: the UI always shows the success card, regardless of whether
    // the address exists (Supabase does not surface user-existence on reset).
    await requestPasswordReset({ data: { email } })
    setLoading(false)
    setSent(true)
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-3">
              <p className="text-sm">
                If an account exists for{' '}
                <span className="font-medium">{masked || 'your email'}</span>, a
                reset link is on its way.
              </p>
              <p className="text-sm text-muted-foreground">
                Check your inbox (and spam) for a link to choose a new password.
              </p>
              <p className="text-center text-sm">
                <a href="/signin" className="hover:text-foreground">
                  Back to sign in
                </a>
              </p>
            </div>
          ) : (
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <a href="/signin" className="hover:text-foreground">
                  Back to sign in
                </a>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
