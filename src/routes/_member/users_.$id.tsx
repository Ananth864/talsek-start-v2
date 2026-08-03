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
import { Badge } from '#/components/ui/badge'
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
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
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
              className="text-2xl font-semibold tracking-tight"
              data-testid="member-detail-name"
            >
              {memberName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {member?.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {member?.must_change_password ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleResendInvite()}
              disabled={resending}
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
            <Badge variant="outline">
              {member.role === 'admin' ? 'Admin' : 'Member'}
            </Badge>
          ) : null}
        </div>
      </header>

      <main className="flex-1 space-y-4 p-4">
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
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading member details…</span>
            </div>
          </div>
        ) : error || !member ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-muted-foreground">
            <span>
              {error instanceof Error
                ? error.message
                : 'Unable to load member details.'}
            </span>
            <Button variant="outline" asChild>
              <Link to="/users">Back to team members</Link>
            </Button>
          </div>
        ) : (
          <Card data-testid="member-permissions-card">
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                Control what this member can do in the workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
                {MEMBER_PERMISSIONS_META.map(
                  ({ key, label, description }) => (
                    <div
                      key={key}
                      className="flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <Label
                          htmlFor={`permission-${key}`}
                          className="text-sm font-medium"
                        >
                          {label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {description}
                        </p>
                      </div>
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
                  ),
                )}
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasPermissionChanges || saving}
                  onClick={() =>
                    setPermissions({ ...initialPermissions })
                  }
                  data-testid="permissions-reset"
                >
                  Reset
                </Button>
                <Button
                  size="sm"
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
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
