import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Loader2, RefreshCcw } from 'lucide-react'
import {
  resendInvite,
  updateMemberPermissions,
} from '#/server/fn/team'
import { useInvalidateTeam, useTeamMember } from '#/hooks/use-team'
import {
  MEMBER_PERMISSIONS_DEFAULT,
  MEMBER_PERMISSIONS_META,
  normalizeMemberPermissions,
} from '#/lib/permissions-shared'
import type {
  MemberPermissionKey,
  MemberPermissions,
} from '#/lib/permissions-shared'
import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import { Switch } from '#/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_member/users_/$id')({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: TeamMemberDetailPage,
})

function TeamMemberDetailPage() {
  const { companyId } = Route.useRouteContext()
  const { id: memberId } = Route.useParams()
  const navigate = useNavigate()
  const invalidate = useInvalidateTeam(companyId)

  const {
    data: member,
    isLoading,
    error,
    refetch,
  } = useTeamMember(companyId, memberId)

  const [permissions, setPermissions] = useState<MemberPermissions>({
    ...MEMBER_PERMISSIONS_DEFAULT,
  })
  const [initialPermissions, setInitialPermissions] =
    useState<MemberPermissions>({ ...MEMBER_PERMISSIONS_DEFAULT })
  const [saving, setSaving] = useState(false)
  const [resending, setResending] = useState(false)
  const [banner, setBanner] = useState<{
    kind: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    if (!member) return
    const normalized = normalizeMemberPermissions(member.permissions)
    setPermissions({ ...normalized })
    setInitialPermissions({ ...normalized })
  }, [member])

  const memberName = useMemo(() => {
    if (!member) return 'Unknown member'
    const parts = [member.first_name, member.last_name].filter(Boolean)
    return parts.length ? parts.join(' ') : member.email
  }, [member])

  const hasPermissionChanges = useMemo(
    () => JSON.stringify(permissions) !== JSON.stringify(initialPermissions),
    [permissions, initialPermissions],
  )

  const handlePermissionToggle = (
    key: MemberPermissionKey,
    checked: boolean,
  ) => {
    setPermissions((previous) => ({
      ...previous,
      [key]: checked,
    }))
  }

  const handleSave = async () => {
    if (!member || !companyId) return
    setSaving(true)
    setBanner(null)
    try {
      const result = await updateMemberPermissions({
        data: {
          companyId,
          memberId: member.id,
          permissions: normalizeMemberPermissions(permissions),
        },
      })
      setPermissions({ ...result.permissions })
      setInitialPermissions({ ...result.permissions })
      setBanner({ kind: 'success', message: result.message })
      invalidate()
      void refetch()
    } catch (err) {
      setBanner({
        kind: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Failed to update permissions',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleResendInvite = async () => {
    if (!member || !companyId) return
    if (!member.must_change_password) {
      setBanner({
        kind: 'error',
        message: 'This member has already set their password.',
      })
      return
    }

    setResending(true)
    setBanner(null)
    try {
      const result = await resendInvite({
        data: { companyId, memberId: member.id },
      })
      setBanner({ kind: 'success', message: result.message })
    } catch (err) {
      setBanner({
        kind: 'error',
        message:
          err instanceof Error ? err.message : 'Failed to resend invite',
      })
    } finally {
      setResending(false)
    }
  }

  return (
    <div
      className="flex min-h-svh flex-col bg-background text-foreground"
      data-testid="member-detail-page"
    >
      <header className="border-b border-border bg-card">
        <div className="px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => void navigate({ to: '/users' })}
                data-testid="back-to-team"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1
                  className="text-2xl font-semibold md:text-3xl"
                  data-testid="member-detail-name"
                >
                  {memberName}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {member?.email}
                </p>
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-3">
              {member?.must_change_password ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleResendInvite()}
                  disabled={resending}
                  className="flex items-center"
                  data-testid="resend-invite-button"
                >
                  {resending ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <RefreshCcw className="mr-2 h-3.5 w-3.5" />
                      Resend invite
                    </>
                  )}
                </Button>
              ) : null}
              {member ? (
                <span
                  className={cn(
                    'rounded-md border px-2 py-0.5 text-xs font-medium',
                    member.role === 'admin'
                      ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                      : 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
                  )}
                >
                  {member.role === 'admin' ? 'Admin' : 'Member'}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="min-w-0 flex-1 px-6 py-8">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          {banner ? (
            <div
              className={cn(
                'rounded-md border px-3 py-2 text-sm',
                banner.kind === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-destructive/20 bg-destructive/10 text-destructive',
              )}
              data-testid="member-detail-banner"
            >
              {banner.message}
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading member details…</span>
              </div>
            </div>
          ) : error || !member ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border text-muted-foreground">
              <span>
                {error instanceof Error
                  ? error.message
                  : 'Member not found or no longer part of your company.'}
              </span>
              <Button variant="outline" asChild>
                <Link to="/users">Back to team members</Link>
              </Button>
            </div>
          ) : (
            <>
              <Card className="bg-card" data-testid="member-permissions-card">
                <CardHeader>
                  <CardTitle>Workspace Permissions</CardTitle>
                  <CardDescription>
                    Toggle permissions to reflect the member&apos;s current
                    access rights.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {MEMBER_PERMISSIONS_META.map(
                    ({ key, label, description }) => (
                      <div
                        key={key}
                        className="flex items-start justify-between rounded-lg border border-border bg-muted/40 p-4"
                        data-testid="permission-row"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">
                            {description}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 pl-4">
                          <Label htmlFor={`permission-${key}`} className="sr-only">
                            {label}
                          </Label>
                          <Switch
                            id={`permission-${key}`}
                            data-testid={`permission-${key}`}
                            checked={permissions[key]}
                            onCheckedChange={(checked) =>
                              handlePermissionToggle(key, checked)
                            }
                            disabled={saving}
                          />
                        </div>
                      </div>
                    ),
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  disabled={!hasPermissionChanges || saving}
                  onClick={() => setPermissions({ ...initialPermissions })}
                  data-testid="permissions-reset"
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  disabled={!hasPermissionChanges || saving}
                  onClick={() => void handleSave()}
                  data-testid="permissions-save"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
