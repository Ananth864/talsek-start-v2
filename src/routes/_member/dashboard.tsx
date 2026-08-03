import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, queryOptions } from '@tanstack/react-query'
import { fetchJobs } from '#/server/fn/jobs'
import { jobsQueryKey } from '#/lib/jobs-shared'
import { jobApplicationsQueryOptions } from '#/hooks/use-job-applications'
import { jobStagesQueryOptions } from '#/hooks/use-job-stages'
import { useJobApplicationsSubscription } from '#/hooks/use-job-applications-subscription'
import { JobsList } from '#/components/jobs/jobs-list'
import { JobCreationDialog } from '#/components/jobs/job-creation-dialog'
import { CandidatesList } from '#/components/candidates/candidates-list'
import { CreditsExhaustedBanner } from '#/components/billing/credits-exhausted-banner'

export const Route = createFileRoute('/_member/dashboard')({
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
  // Auth/profile/company context comes from `/_member`. Permissions for UX
  // gating (Create Job) live on that parent; the authoritative `canCreateJob`
  // check remains in the createJob server fn (ADR-0004).
  //
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
    companyId,
    canCreateJob,
    canSendReachout,
    canManageForms,
    companyName,
  } = Route.useRouteContext()

  return (
    <DashboardContent
      companyId={companyId}
      canCreateJob={canCreateJob}
      canSendReachout={canSendReachout}
      canManageForms={canManageForms}
      companyName={companyName}
    />
  )
}

function DashboardContent({
  companyId,
  canCreateJob,
  canSendReachout,
  canManageForms,
  companyName,
}: {
  companyId: string | null
  canCreateJob: boolean
  canSendReachout: boolean
  canManageForms: boolean
  companyName: string
}) {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const [createOpen, setCreateOpen] = useState(false)

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
    <div className="flex h-svh flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
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
          companyId={companyId}
          canCreateJob={canCreateJob}
          canManageForms={canManageForms}
          onCreateJob={() => setCreateOpen(true)}
        />
        {selectedJob ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            <CandidatesList
              job={selectedJob}
              companyId={companyId}
              canSendReachout={canSendReachout}
              activeStageId={selectedStageId}
              onStageChange={handleStageSelect}
            />
          </div>
        ) : (
          <div
            data-testid="candidates-empty"
            className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground"
          >
            Select a job to view its candidates.
          </div>
        )}
      </main>

      {canCreateJob ? (
        <JobCreationDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          companyName={companyName}
        />
      ) : null}

      <CreditsExhaustedBanner companyId={companyId} />
    </div>
  )
}
