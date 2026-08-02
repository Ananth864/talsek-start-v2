import { useEffect, useMemo, useState } from 'react'
import {
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { useQuery, queryOptions } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { fetchJobs, fetchMemberProfile } from '#/server/fn/jobs'
import { getAuthState, signOut } from '#/server/fn/auth'
import { jobsQueryKey } from '#/lib/jobs-shared'
import { Button } from '#/components/ui/button'
import { JobsList } from '#/components/jobs/jobs-list'
import { JobDetail } from '#/components/jobs/job-detail'
import { JobCreationDialog } from '#/components/jobs/job-creation-dialog'

export const Route = createFileRoute('/dashboard')({
  validateSearch: (search: Record<string, unknown>): {
    jobId?: string
    jobSearch?: string
  } => ({
    jobId: typeof search.jobId === 'string' ? search.jobId : undefined,
    jobSearch:
      typeof search.jobSearch === 'string' ? search.jobSearch : undefined,
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
    return {
      companyId: profile?.company_id ?? null,
      canCreateJob: Boolean(profile?.permissions.canCreateJob),
      companyName: profile?.companies?.name ?? '',
    }
  },
  loader: async ({ context }) => {
    // Prefetch + dehydrate the Jobs list for SSR first paint (ADR-0007). The
    // query key matches the source so realtime/mutation invalidation ports
    // unchanged.
    await context.queryClient.ensureQueryData(
      jobsQueryOptions(context.companyId),
    )
  },
  component: DashboardPage,
})

const jobsQueryOptions = (companyId: string | null) =>
  queryOptions({
    queryKey: jobsQueryKey(companyId),
    queryFn: () => fetchJobs(),
  })

function DashboardPage() {
  const { companyId, canCreateJob, companyName } = Route.useRouteContext()
  const navigate = useNavigate()
  const search = Route.useSearch()
  const [createOpen, setCreateOpen] = useState(false)

  const { data: jobs = [], isLoading, error } = useQuery(
    jobsQueryOptions(companyId),
  )

  const selectedJobId = search.jobId
  const searchTerm = search.jobSearch ?? ''

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
    void navigate({
      to: '/dashboard',
      search: { jobId, jobSearch: searchTerm || undefined },
      replace: true,
    })
  }

  const handleSearchChange = (value: string) => {
    void navigate({
      to: '/dashboard',
      search: { jobId: selectedJobId, jobSearch: value || undefined },
      replace: true,
    })
  }

  return (
    <div className="mx-auto flex h-svh max-w-6xl flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
        <div className="flex items-center gap-2">
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
        <JobDetail job={selectedJob} />
      </main>

      {canCreateJob ? (
        <JobCreationDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          companyName={companyName}
        />
      ) : null}
    </div>
  )
}
