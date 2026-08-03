import { useMemo, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  Bell,
  ChevronsUpDown,
  CreditCard,
  FileText,
  LayoutDashboard,
  LayoutGrid,
  List,
  LogOut,
  Mail,
  Rocket,
  SunMoon,
  UploadCloud,
  UserCircle,
  Users,
} from 'lucide-react'
import { signOut } from '#/server/fn/auth'
import { NotificationPreferencesPanel } from '#/components/notification-preferences'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '#/components/ui/sidebar'
import { useCandidateListView } from '#/hooks/use-candidate-list-view'
import { useTheme } from '#/hooks/use-theme'
import { cn } from '#/lib/utils'

type MemberSidebarProps = {
  isAdmin: boolean
  companyName: string
  userEmail: string | null
  userId: string | null
  avatarUrl?: string | null
}

const dropdownButtonClasses =
  'w-full justify-between items-center gap-2 px-3 py-2 rounded-md bg-sidebar text-sidebar-foreground hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground transition-colors'

type NavItem = {
  label: string
  to: '/get-started' | '/dashboard' | '/form-settings' | '/reachout-templates' | '/bulk-upload' | '/candidates' | '/users' | '/billing'
  icon: React.ComponentType<{ className?: string }>
  testId: string
  match: (pathname: string) => boolean
  adminOnly?: boolean
}

const PRIMARY_NAV: NavItem[] = [
  {
    label: 'Get Started',
    to: '/get-started',
    icon: Rocket,
    testId: 'get-started-nav',
    match: (pathname) => pathname === '/get-started',
  },
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
    testId: 'dashboard-nav',
    match: (pathname) => pathname === '/dashboard',
  },
  {
    label: 'Customize Form',
    to: '/form-settings',
    icon: FileText,
    testId: 'form-settings-nav',
    match: (pathname) => pathname === '/form-settings',
  },
  {
    label: 'Reachout Templates',
    to: '/reachout-templates',
    icon: Mail,
    testId: 'reachout-templates-nav',
    match: (pathname) => pathname === '/reachout-templates',
  },
]

const SECONDARY_NAV: NavItem[] = [
  {
    label: 'Bulk Upload',
    to: '/bulk-upload',
    icon: UploadCloud,
    testId: 'bulk-upload-nav',
    match: (pathname) => pathname === '/bulk-upload',
  },
  {
    label: 'Candidates',
    to: '/candidates',
    icon: UserCircle,
    testId: 'candidates-nav',
    match: (pathname) => pathname === '/candidates',
  },
]

const ADMIN_NAV: NavItem[] = [
  {
    label: 'Team',
    to: '/users',
    icon: Users,
    testId: 'team-nav',
    match: (pathname) => pathname.startsWith('/users'),
    adminOnly: true,
  },
  {
    label: 'Billing',
    to: '/billing',
    icon: CreditCard,
    testId: 'billing-nav',
    match: (pathname) => pathname === '/billing',
    adminOnly: true,
  },
]

function NavEntries({
  items,
  pathname,
}: {
  items: NavItem[]
  pathname: string
}) {
  return (
    <>
      {items.map((item) => {
        const Icon = item.icon
        return (
          <SidebarMenuItem key={item.to}>
            <SidebarMenuButton
              asChild
              isActive={item.match(pathname)}
              tooltip={item.label}
              className="group-data-[collapsible=icon]:translate-x-[3px]"
            >
              <Link
                to={item.to}
                data-testid={item.testId}
                className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
              >
                <Icon className="h-4 w-4" />
                <span className="group-data-[collapsible=icon]:hidden">
                  {item.label}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </>
  )
}

/**
 * Collapsible Member app sidebar. Ports the source IA (Get Started → Billing)
 * onto shadcn sidebar primitives; Team/Billing are admin-gated.
 */
export function MemberSidebar({
  isAdmin,
  companyName,
  userEmail,
  userId,
  avatarUrl,
}: MemberSidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { theme, toggleTheme } = useTheme()
  const {
    viewMode,
    isUpdating: isUpdatingView,
    toggleViewMode,
  } = useCandidateListView(userId)
  const [accountOpen, setAccountOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const displayName = companyName.trim() || 'Company'
  const displayEmail = userEmail?.trim() || 'team@company.com'
  const viewToggleLabel =
    viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'

  const accountInitials = useMemo(() => {
    const source = (displayName || displayEmail).trim()
    if (!source) return 'T'
    const words = source.split(/\s+/).slice(0, 2)
    const letters = words.map((word) => word.charAt(0).toUpperCase())
    return letters.join('') || 'T'
  }, [displayName, displayEmail])

  const themeToggleLabel =
    theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/signin'
    } catch (error) {
      console.error('[member-sidebar] Sign out failed:', error)
    }
  }

  return (
    <>
      <Sidebar
        collapsible="icon"
        className="bg-sidebar text-sidebar-foreground"
        data-testid="member-sidebar"
      >
        <SidebarHeader className="px-3 py-4">
          <div className="flex items-center justify-between gap-3 group-data-[collapsible=icon]:justify-center">
            <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
              <img
                src="/white_circle.png"
                alt="Talsek Logo"
                className="h-9 w-9 shrink-0 dark:hidden group-data-[collapsible=icon]:hidden"
              />
              <img
                src="/black_circle.png"
                alt="Talsek Logo"
                className="hidden h-9 w-9 shrink-0 dark:block group-data-[collapsible=icon]:hidden"
              />
              <div className="flex flex-col truncate text-left group-data-[collapsible=icon]:hidden">
                <span className="text-lg font-semibold leading-tight">
                  Talsek
                </span>
              </div>
            </div>
            <SidebarTrigger className="h-8 w-8 shrink-0 rounded-md border border-transparent text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:translate-x-[-6px]" />
          </div>
        </SidebarHeader>

        <SidebarContent className="px-3 py-4 group-data-[collapsible=icon]:px-1">
          <SidebarGroup className="group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-1">
            <SidebarGroupContent>
              <SidebarMenu>
                <NavEntries items={PRIMARY_NAV} pathname={pathname} />
                <div className="my-2 h-px bg-sidebar-foreground/10" />
                <NavEntries items={SECONDARY_NAV} pathname={pathname} />
                <div className="my-2 h-px bg-sidebar-foreground/10" />
                {isAdmin ? (
                  <NavEntries items={ADMIN_NAV} pathname={pathname} />
                ) : null}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="px-3 py-4">
          <DropdownMenu open={accountOpen} onOpenChange={setAccountOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                data-testid="account-menu-trigger"
                className={cn(
                  dropdownButtonClasses,
                  'group-data-[collapsible=icon]:justify-center',
                )}
              >
                <Avatar className="mr-2 h-8 w-8 group-data-[collapsible=icon]:mr-0">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={displayName} />
                  ) : null}
                  <AvatarFallback>{accountInitials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col truncate text-left group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-sm font-medium text-sidebar-foreground">
                    {displayName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {displayEmail}
                  </span>
                </div>
                <ChevronsUpDown className="h-4 w-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="start"
              sideOffset={8}
              className="w-64"
              data-testid="account-menu"
            >
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-foreground">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground">{displayEmail}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                data-testid="theme-toggle"
                onClick={() => {
                  toggleTheme()
                  setAccountOpen(false)
                }}
              >
                <SunMoon className="mr-2 h-4 w-4" />
                {themeToggleLabel}
              </DropdownMenuItem>
              <DropdownMenuItem
                data-testid="candidate-view-toggle"
                disabled={isUpdatingView}
                onClick={() => {
                  void toggleViewMode().finally(() => setAccountOpen(false))
                }}
              >
                {viewMode === 'grid' ? (
                  <List className="mr-2 h-4 w-4" />
                ) : (
                  <LayoutGrid className="mr-2 h-4 w-4" />
                )}
                {viewToggleLabel}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                data-testid="notifications-nav"
                onClick={() => {
                  setAccountOpen(false)
                  setNotificationsOpen(true)
                }}
              >
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                data-testid="sign-out"
                onClick={() => {
                  void handleSignOut()
                }}
                className="text-red-500 focus:text-red-500"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <Dialog
        open={notificationsOpen}
        onOpenChange={(open) => {
          setNotificationsOpen(open)
          if (!open) setAccountOpen(false)
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          data-testid="notifications-dialog"
        >
          <DialogHeader>
            <DialogTitle>Email Notification Settings</DialogTitle>
          </DialogHeader>
          <NotificationPreferencesPanel userId={userId} />
        </DialogContent>
      </Dialog>
    </>
  )
}
