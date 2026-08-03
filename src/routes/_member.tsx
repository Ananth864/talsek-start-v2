import {
  Outlet,
  createFileRoute,
  redirect,
} from '@tanstack/react-router'
import { getAuthState } from '#/server/fn/auth'
import { fetchMemberProfile } from '#/server/fn/jobs'
import { DashboardCompanyGuard } from '#/components/auth/dashboard-company-guard'
import { MemberSidebar } from '#/components/layout/member-sidebar'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '#/components/ui/sidebar'

const MEMBER_AUTH_STALE_MS = 60_000

/**
 * Pathless layout for all session-gated Member routes: shared auth/profile
 * context, company setup guard, and the collapsible sidebar shell (#25).
 */
export const Route = createFileRoute('/_member')({
  // Keep layout context fresh briefly so sidebar page hops don't re-hit
  // getAuthState + fetchMemberProfile on every navigation (SPA kept auth in memory).
  staleTime: MEMBER_AUTH_STALE_MS,
  beforeLoad: async ({ context, location }) => {
    const { user } = await context.queryClient.ensureQueryData({
      queryKey: ['member-auth-state'],
      queryFn: () => getAuthState(),
      staleTime: MEMBER_AUTH_STALE_MS,
    })
    if (!user) {
      throw redirect({
        to: '/signin',
        search: { redirect: location.pathname },
      })
    }

    const profile = await context.queryClient.ensureQueryData({
      queryKey: ['member-profile', user.id],
      queryFn: () => fetchMemberProfile(),
      staleTime: MEMBER_AUTH_STALE_MS,
    })
    const firstName = profile?.first_name.trim() ?? ''
    const lastName = profile?.last_name.trim() ?? ''
    const userName = `${firstName} ${lastName}`.trim() || null
    const role = profile?.role === 'admin' ? 'admin' : 'member'

    return {
      userId: profile?.id ?? null,
      companyId: profile?.company_id ?? null,
      role,
      isAdmin: role === 'admin',
      canCreateJob: Boolean(profile?.permissions.canCreateJob),
      canSendReachout: Boolean(profile?.permissions.canSendReachout),
      canManageTemplates: Boolean(profile?.permissions.canManageTemplates),
      canManageForms: Boolean(profile?.permissions.canManageForms),
      companyName: profile?.companies?.name ?? '',
      userEmail: profile?.email ?? user.email ?? null,
      userName,
    }
  },
  component: MemberLayout,
})

function MemberLayout() {
  const {
    userId,
    companyId,
    isAdmin,
    companyName,
    userEmail,
    userName,
  } = Route.useRouteContext()

  return (
    <DashboardCompanyGuard
      needsCompanySetup={!companyId}
      userEmail={userEmail}
      userName={userName}
    >
      <SidebarProvider>
        <MemberSidebar
          isAdmin={isAdmin}
          companyName={companyName}
          userEmail={userEmail}
          userId={userId}
        />
        <SidebarInset>
          {/* Mobile-only trigger — the in-sidebar trigger sits inside the Sheet. */}
          <div className="flex h-12 items-center gap-2 border-b px-3 md:hidden">
            <SidebarTrigger data-testid="sidebar-trigger-mobile" />
            <span className="text-sm font-medium">Talsek</span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </DashboardCompanyGuard>
  )
}
