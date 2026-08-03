import { createFileRoute } from '@tanstack/react-router'
import { UserCircle } from 'lucide-react'

/**
 * Placeholder for the cross-Job Candidates page (later ticket).
 * Keeps the sidebar entry reachable without blocking #25.
 */
export const Route = createFileRoute('/_member/candidates')({
  component: CandidatesPlaceholder,
})

function CandidatesPlaceholder() {
  return (
    <div
      className="flex flex-1 flex-col items-start gap-2 p-6"
      data-testid="candidates-placeholder"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <UserCircle className="h-5 w-5" />
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Candidates
        </h1>
      </div>
      <p className="max-w-prose text-sm text-muted-foreground">
        Cross-job Candidates view coming soon. Select a Job on the Dashboard to
        work the pipeline board for now.
      </p>
    </div>
  )
}
