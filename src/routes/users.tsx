import { useCallback, useMemo, useState } from 'react'
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { Loader2, Plus, RotateCcw, Search, UserCog, Users } from 'lucide-react'
import { getAuthState } from '#/server/fn/auth'
import { fetchMemberProfile } from '#/server/fn/jobs'
import { inviteMember } from '#/server/fn/team'
import {
  useInvalidateTeam,
  useTeamMembers,
} from '#/hooks/use-team'
import { InviteMemberModal } from '#/components/team/invite-member-modal'
import type { InviteMemberValues } from '#/components/team/invite-member-modal'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/users')({
  beforeLoad: async () => {
    const { user } = await getAuthState()
    if (!user) {
      throw redirect({
        to: '/signin',
        search: { redirect: '/users' },
      })
    }
    const profile = await fetchMemberProfile()
    if (!profile || profile.role !== 'admin') {
      throw redirect({ to: '/dashboard' })
    }
    return {
      companyId: profile.company_id ?? null,
      isAdmin: true as const,
    }
  },
  component: TeamPage,
})

function formatName(firstName: string | null, lastName: string | null) {
  const segments = [firstName, lastName].filter(Boolean)
  return segments.length === 0 ? 'Unknown' : segments.join(' ')
}

function TeamPage() {
  const { companyId } = Route.useRouteContext()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [banner, setBanner] = useState<{
    kind: 'success' | 'error'
    message: string
  } | null>(null)

  const {
    data: members = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useTeamMembers(companyId)
  const invalidate = useInvalidateTeam(companyId)

  const filteredMembers = useMemo(() => {
    const query = search.toLowerCase().trim()
    if (!query) return members
    return members.filter((member) => {
      const name = formatName(member.first_name, member.last_name)
      const statusLabel = member.must_change_password ? 'pending' : 'active'
      return (
        name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query) ||
        statusLabel.includes(query)
      )
    })
  }, [members, search])

  const handleInvite = useCallback(
    async (values: InviteMemberValues) => {
      if (!companyId) throw new Error('Company context is missing')
      setBanner(null)
      try {
        const result = await inviteMember({
          data: {
            companyId,
            email: values.email,
            firstName: values.firstName,
            lastName: values.lastName,
            role: values.role,
            message: values.message,
            permissions: values.permissions,
          },
        })
        setBanner({ kind: 'success', message: result.message })
        invalidate()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to invite'
        if (
          message.toLowerCase().includes('already exists') ||
          message.toLowerCase().includes('already accepted')
        ) {
          throw new Error('Unable to add member, user already exists')
        }
        throw err
      }
    },
    [companyId, invalidate],
  )

  return (
    <div className="mx-auto flex min-h-svh max-w-6xl flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage workspace access, roles, and permissions for your team.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard">Dashboard</Link>
          </Button>
          <Button
            size="sm"
            onClick={() => setInviteOpen(true)}
            data-testid="invite-member-button"
          >
            <Plus className="size-4" />
            Invite Member
          </Button>
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
            data-testid="team-banner"
          >
            {banner.message}
          </div>
        ) : null}

        <Card>
          <CardHeader className="flex flex-col gap-4 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="sr-only">Members</CardTitle>
            <div className="flex w-full max-w-md items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, email, role, or status"
                autoComplete="off"
                name="members-search"
                data-testid="team-search"
                className="h-8 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isFetching}
              data-testid="team-refresh"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <table className="w-full min-w-[720px] text-sm" data-testid="team-table">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Loading team members…</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span>
                            {error instanceof Error
                              ? error.message
                              : 'Failed to load members'}
                          </span>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => void refetch()}
                          >
                            Try again
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredMembers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        {search ? (
                          <span>No members match your search.</span>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            No team members yet. Invite your first teammate.
                          </span>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => {
                      const pending = member.must_change_password
                      return (
                        <tr
                          key={member.id}
                          className="border-b last:border-0"
                          data-testid={`team-member-row-${member.id}`}
                        >
                          <td className="px-4 py-3 font-medium">
                            {formatName(member.first_name, member.last_name)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {member.email}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">
                              {member.role === 'admin' ? 'Admin' : 'Member'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              data-testid={`member-status-${member.id}`}
                            >
                              {pending
                                ? 'Pending password setup'
                                : 'Active'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={() =>
                                void navigate({
                                  to: '/users/$id',
                                  params: { id: member.id },
                                })
                              }
                              data-testid={`manage-member-${member.id}`}
                            >
                              <UserCog className="h-4 w-4" />
                              Manage
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
      />
    </div>
  )
}
