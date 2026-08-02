import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useJobApplications } from '#/hooks/use-job-applications'
import { useJobStages } from '#/hooks/use-job-stages'
import { Input } from '#/components/ui/input'
import { StageTabs } from './stage-tabs'
import { CandidateCard } from './candidate-card'
import type { JobWithCompanyRow } from '#/server/fn/jobs'

type CandidatesListProps = {
  job: JobWithCompanyRow
  companyId: string | null
  activeStageId: string | undefined
  onStageChange: (stageId: string) => void
}

/**
 * The candidate pipeline board for a selected Job (ticket #6 read path). Ports
 * the source's `CandidatesList`: stage tabs with counts, a candidate
 * name/email search, and the per-stage candidate list. Data is fetched through
 * the user-scoped server-function hooks (`useJobApplications` / `useJobStages`),
 * whose query keys are prefetched in the dashboard loader for SSR first paint
 * (ADR-0007) and kept fresh by `useJobApplicationsSubscription` (Realtime).
 *
 * The board uses the source's job-wide candidate query grouped client-side by
 * the current stage, rather than the source's per-stage infinite query — this
 * keeps a single SSR-prefetchable, realtime-invalidatable key. Card actions
 * (star / Shortlist stage-advance / Reject) land with #8; the fit-category
 * filter and bulk actions port with later write-path tickets.
 */
export function CandidatesList({
  job,
  companyId,
  activeStageId,
  onStageChange,
}: CandidatesListProps) {
  const { data: applications = [], isLoading, error } = useJobApplications(
    job.id,
    companyId,
  )
  const { data: stages = [] } = useJobStages(job.id, companyId)
  const [search, setSearch] = useState('')

  // Resolve the effective active stage: the held id if it still exists in this
  // Job's pipeline, else the first stage. Source parity: the source defaults to
  // the 'Resume Screening' stage then falls back to the first. When the held id
  // is missing/stale, sync it back to the parent (and thus the ?stageId= URL).
  const effectiveStageId =
    activeStageId && stages.some((s) => s.id === activeStageId)
      ? activeStageId
      : (stages.find((s) => s.hiring_stage.name === 'Resume Screening')?.id ??
        stages[0]?.id)

  useEffect(() => {
    if (effectiveStageId && effectiveStageId !== activeStageId) {
      onStageChange(effectiveStageId)
    }
  }, [effectiveStageId, activeStageId, onStageChange])

  // Group by current stage for the tab counts (source: get_job_stage_counts).
  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const app of applications) {
      const sid = app.current_stage_id
      map.set(sid, (map.get(sid) ?? 0) + 1)
    }
    return map
  }, [applications])

  // Candidates in the active stage, further filtered by the search term.
  const visible = useMemo(() => {
    let rows = applications.filter(
      (app) => app.current_stage_id === effectiveStageId,
    )
    const term = search.trim().toLowerCase()
    if (term) {
      rows = rows.filter((app) => {
        const name = app.candidate_name.toLowerCase()
        const email = app.candidate.email.toLowerCase()
        return name.includes(term) || email.includes(term)
      })
    }
    return rows
  }, [applications, effectiveStageId, search])

  const activeCount = applications.filter((a) => a.status === 'active').length
  const rejectedCount = applications.filter(
    (a) => a.status === 'rejected',
  ).length

  return (
    <div
      data-testid="candidates-list"
      className="flex flex-1 flex-col overflow-hidden"
    >
      <StageTabs
        stages={stages}
        counts={counts}
        activeStageId={effectiveStageId}
        onSelect={onStageChange}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium tabular-nums">{applications.length}</span>
          <span>candidates</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{activeCount} active</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{rejectedCount} rejected</span>
        </div>
        <div className="relative w-full max-w-[220px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search candidates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
            aria-label="Search candidates"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading candidates…</p>
        ) : error ? (
          <p className="p-4 text-sm text-destructive">
            Error loading candidates: {error.message}
          </p>
        ) : stages.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            This job has no pipeline stages configured yet.
          </p>
        ) : visible.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No candidates in this stage.
          </p>
        ) : (
          <ul data-testid="candidate-cards" className="flex flex-col gap-2">
            {visible.map((app) => (
              <li key={app.id}>
                <CandidateCard application={app} job={job} stages={stages} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
