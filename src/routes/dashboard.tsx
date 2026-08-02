import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchJobs } from '#/server/fn/jobs'
import { getAuthState, signOut } from '#/server/fn/auth'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const { user } = await getAuthState()
    if (!user)
      throw redirect({
        to: '/signin',
        search: { redirect: '/dashboard' },
      })
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ['jobs'],
      queryFn: () => fetchJobs(),
    })
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => fetchJobs(),
  })

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            await signOut()
            window.location.href = '/signin'
          }}
        >
          <button
            type="submit"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </form>
      </div>

      {jobs?.length === 0 ? (
        <p className="text-muted-foreground">No jobs yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {jobs?.map((job) => (
            <li
              key={job.id}
              className="flex items-center justify-between p-4"
            >
              <span className="font-medium">{job.title}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(job.created_at).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
