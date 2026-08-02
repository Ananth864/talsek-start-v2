import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  exchangeAuthCode,
  updatePassword,
  signOut,
} from '#/server/fn/auth'
import { passwordRules, PASSWORD_RULE_MESSAGE } from '#/lib/auth-shared'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

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
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

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
    setTimeout(() => navigate({ to: '/signin' }), 1500)
  }

  if (!exchangeOk) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Link expired or invalid</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This password-reset link is invalid or has expired.
            </p>
            <p className="text-sm">
              <a href="/forgot-password" className="hover:text-foreground">
                Request a new link
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
        </CardHeader>
        <CardContent>
          {done ? (
            <p className="text-sm">
              Password updated. Redirecting to sign in…
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating…' : 'Update password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
