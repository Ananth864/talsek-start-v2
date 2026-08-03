import { useEffect, useMemo, useState } from 'react'
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { useQuery, queryOptions } from '@tanstack/react-query'
import { Bell, Plus, Upload } from 'lucide-react'
import { fetchJobs, fetchMemberProfile } from '#/server/fn/jobs'
import { getAuthState, signOut } from '#/server/fn/auth'
import { jobsQueryKey } from '#/lib/jobs-shared'
import { jobApplicationsQueryOptions } from '#/hooks/use-job-applications'
import { jobStagesQueryOptions } from '#/hooks/use-job-stages'
import { useJobApplicationsSubscription } from '#/hooks/use-job-applications-subscription'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { JobsList } from '#/components/jobs/jobs-list'
import { JobDetail } from '#/components/jobs/job-detail'
import { JobCreationDialog } from '#/components/jobs/job-creation-dialog'
import { CandidatesList } from '#/components/candidates/candidates-list'
import { NotificationPreferencesPanel } from '#/components/notification-preferences'
import { DashboardCompanyGuard } from '#/components/auth/dashboard-company-guard'

export const Route = createFileRoute('/dashboard')({
  validateSearch: (search: Record<string, unknown>): {
    jobId?: string
    jobSearch?: string
    stageId?: string
  } => ({
    jobId: typeof search.jobId === 'string' ? search.jobId : undefined,
    jobSearch:
      typeof search.jobSearch === 'string' ? search.jobSearch : undefined,
    stageId: typeof search.stageId === 'string' ? search.stageId : undefined,
  }),
  beforeLoad: async () => {
    const { user } = await getAuthState()
    if (!user) {
      throw redirect({
        to: '/signin',
        search: { redirect: '/dashboard' },
      })
    }
    // Load the Member's company context once here so it flows into the loader
    // (for the query key) and the component (for cache reads). Identity is
    // verified by the guard above; RLS owns company scoping on every read.
    // The permissions capability flags are surfaced to the component for UX
    // gating (e.g. showing the Create-Job button); the authoritative
    // `canCreateJob` check lives in the createJob server fn (ADR-0004).
    const profile = await fetchMemberProfile()
    const firstName = profile?.first_name.trim() ?? ''
    const lastName = profile?.last_name.trim() ?? ''
    const userName = `${firstName} ${lastName}`.trim() || null
    return {
      userId: profile?.id ?? null,
      companyId: profile?.company_id ?? null,
      canCreateJob: Boolean(profile?.permissions.canCreateJob),
      canSendReachout: Boolean(profile?.permissions.canSendReachout),
      canManageTemplates: Boolean(profile?.permissions.canManageTemplates),
      canManageForms: Boolean(profile?.permissions.canManageForms),
      companyName: profile?.companies?.name ?? '',
      userEmail: profile?.email ?? user.email ?? null,
      userName,
    }
  },
  // Read the selected Job id from the search params into the loader so the
  // candidate board can be prefetched + dehydrated for SSR first paint when a
  // Job is held in the URL (ADR-0007). Selections made client-side (clicking a
  // Job) fire the query after the navigation instead.
  loaderDeps: ({ search }) => ({ jobId: search.jobId }),
  loader: async ({ context, deps }) => {
    // Skip Jobs prefetch until the Member has a Company — the company guard
    // blocks the board until setup completes (#19 / ADR-0004).
    if (!context.companyId) return
    // Prefetch + dehydrate the Jobs list for SSR first paint (ADR-0007). The
    // query key matches the source so realtime/mutation invalidation ports
    // unchanged.
    await context.queryClient.ensureQueryData(
      jobsQueryOptions(context.companyId),
    )
    // Prefetch the selected Job's candidate board + pipeline stages so the
    // board is present in the first-paint HTML when a Job is in the URL.
    if (deps.jobId) {
      await Promise.all([
        context.queryClient.ensureQueryData(
          jobApplicationsQueryOptions(deps.jobId, context.companyId),
        ),
        context.queryClient.ensureQueryData(
          jobStagesQueryOptions(deps.jobId, context.companyId),
        ),
      ])
    }
  },
  component: DashboardPage,
})

const jobsQueryOptions = (companyId: string | null) =>
  queryOptions({
    queryKey: jobsQueryKey(companyId),
    queryFn: () => fetchJobs(),
  })

function DashboardPage() {
  const {
    userId,
    companyId,
    canCreateJob,
    canSendReachout,
    canManageForms,
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
      <DashboardContent
        userId={userId}
        companyId={companyId}
        canCreateJob={canCreateJob}
        canSendReachout={canSendReachout}
        canManageForms={canManageForms}
        companyName={companyName}
      />
    </DashboardCompanyGuard>
  )
}

function DashboardContent({
  userId,
  companyId,
  canCreateJob,
  canSendReachout,
  canManageForms,
  companyName,
}: {
  userId: string | null
  companyId: string | null
  canCreateJob: boolean
  canSendReachout: boolean
  canManageForms: boolean
  companyName: string
}) {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const [createOpen, setCreateOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const { data: jobs = [], isLoading, error } = useQuery(
    jobsQueryOptions(companyId),
  )

  const selectedJobId = search.jobId
  const selectedStageId = search.stageId
  const searchTerm = search.jobSearch ?? ''

  // Realtime: keep the selected Job's candidate board fresh (ADR-0007). Mounted
  // here (not inside CandidatesList) so the channel lives across board re-renders
  // and matches the source, which mounts `useJobApplicationsSubscription` at the
  // Dashboard level.
  useJobApplicationsSubscription(selectedJobId, companyId)

  const filteredJobs = useMemo(() => {
    if (!searchTerm.trim()) return jobs
    const q = searchTerm.toLowerCase().trim()
    return jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(q) ||
        job.job_posting_link.toLowerCase().includes(q),
    )
  }, [jobs, searchTerm])

  // Selection is carried by the `?jobId=` search param (source parity). The
  // selected Job is resolved from the full list so it stays available even when
  // filtered out of view.
  const selectedJob = jobs.find((job) => job.id === selectedJobId)

  // Auto-select the first Job when none is selected or the held id is stale;
  // clear the selection when a search empties the list while Jobs still exist
  // (source parity: the held id would otherwise reference a hidden Job).
  useEffect(() => {
    if (filteredJobs.length > 0) {
      const stillValid =
        !!selectedJobId && jobs.some((job) => job.id === selectedJobId)
      if (!stillValid) {
        void navigate({
          to: '/dashboard',
          search: {
            jobId: filteredJobs[0].id,
            jobSearch: searchTerm || undefined,
          },
          replace: true,
        })
      }
    } else if (jobs.length > 0 && selectedJobId) {
      void navigate({
        to: '/dashboard',
        search: { jobSearch: searchTerm || undefined },
        replace: true,
      })
    }
  }, [filteredJobs, jobs, selectedJobId, searchTerm, navigate])

  const handleJobSelect = (jobId: string) => {
    // Selecting a different Job resets the stage (the new Job's board defaults
    // its own first stage via CandidatesList).
    void navigate({
      to: '/dashboard',
      search: {
        jobId,
        jobSearch: searchTerm || undefined,
        stageId: jobId === selectedJobId ? selectedStageId : undefined,
      },
      replace: true,
    })
  }

  const handleStageSelect = (stageId: string) => {
    void navigate({
      to: '/dashboard',
      search: {
        jobId: selectedJobId,
        jobSearch: searchTerm || undefined,
        stageId,
      },
      replace: true,
    })
  }

  const handleSearchChange = (value: string) => {
    void navigate({
      to: '/dashboard',
      search: {
        jobId: selectedJobId,
        jobSearch: value || undefined,
        stageId: selectedStageId,
      },
      replace: true,
    })
  }

  return (
    <div className="mx-auto flex h-svh max-w-6xl flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/users" data-testid="team-nav">
              Team
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link
              to="/reachout-templates"
              data-testid="reachout-templates-nav"
            >
              Templates
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/form-settings" data-testid="form-settings-nav">
              Forms
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/billing" data-testid="billing-nav">
              Billing
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            data-testid="notifications-nav"
            onClick={() => setNotificationsOpen(true)}
          >
            <Bell className="size-4" />
            Notifications
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/bulk-upload" data-testid="bulk-upload-nav">
              <Upload className="size-4" />
              Bulk upload
            </Link>
          </Button>
          {canCreateJob ? (
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              data-testid="create-job-button"
            >
              <Plus className="size-4" />
              Create job
            </Button>
          ) : null}
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              await signOut()
              window.location.href = '/signin'
            }}
          >
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <JobsList
          jobs={filteredJobs}
          selectedJobId={selectedJobId}
          onJobSelect={handleJobSelect}
          searchTerm={searchTerm}
          onSearchTermChange={handleSearchChange}
          loading={isLoading}
          error={error}
        />
        {selectedJob ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            <JobDetail
              job={selectedJob}
              companyId={companyId}
              canManageForms={canManageForms}
            />
            <CandidatesList
              job={selectedJob}
              companyId={companyId}
              canSendReachout={canSendReachout}
              activeStageId={selectedStageId}
              onStageChange={handleStageSelect}
            />
          </div>
        ) : (
          <JobDetail job={undefined} />
        )}
      </main>

      {canCreateJob ? (
        <JobCreationDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          companyName={companyName}
        />
      ) : null}

      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent data-testid="notifications-dialog">
          <DialogHeader>
            <DialogTitle>Notification preferences</DialogTitle>
          </DialogHeader>
          <NotificationPreferencesPanel userId={userId} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
