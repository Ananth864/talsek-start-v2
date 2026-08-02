import { useEffect, useMemo, useState } from 'react'
import { Search, Users } from 'lucide-react'
import { useJobApplications } from '#/hooks/use-job-applications'
import { useJobStages } from '#/hooks/use-job-stages'
import { useBulkActionMode } from '#/hooks/use-bulk-action-mode'
import { useBulkShortlist } from '#/hooks/use-bulk-shortlist'
import { nextStageForApplication } from '#/lib/candidate-stage-navigation'
import { Input } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { BulkActionConfirmBar } from '#/components/bulk/bulk-action-confirm-bar'
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
 * The candidate pipeline board for a selected Job (ticket #6 read path + #8
 * card actions + #10 bulk shortlist). Ports the source's `CandidatesList`:
 * stage tabs, search, and per-stage list. Bulk shortlist advances stage only
 * (Reachout deferred to #16 — ADR-0016).
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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [bulkError, setBulkError] = useState<string | null>(null)
  const bulkShortlist = useBulkShortlist()

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

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const app of applications) {
      const sid = app.current_stage_id
      map.set(sid, (map.get(sid) ?? 0) + 1)
    }
    return map
  }, [applications])

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

  const visibleIds = useMemo(() => visible.map((a) => a.id), [visible])
  const bulkState = useBulkActionMode(visibleIds)

  const nextStage = useMemo(() => {
    const sample = visible.at(0)
    if (sample) return nextStageForApplication(sample, stages)
    // Resolve from stage order when the list is empty (disable UI).
    const currentIndex = stages.findIndex((s) => s.id === effectiveStageId)
    if (currentIndex < 0 || currentIndex >= stages.length - 1) return null
    const next = stages[currentIndex + 1]
    return { id: next.id, name: next.hiring_stage.name || 'Next Stage' }
  }, [visible, stages, effectiveStageId])

  const currentStageLabel =
    stages.find((s) => s.id === effectiveStageId)?.hiring_stage.name ||
    'Current Stage'

  const activeCount = applications.filter((a) => a.status === 'active').length
  const rejectedCount = applications.filter(
    (a) => a.status === 'rejected',
  ).length

  const handleToggleSelectAll = () => {
    if (bulkState.isAllSelected) bulkState.clearSelection()
    else bulkState.selectAll(visibleIds)
  }

  const handleBulkConfirmClick = () => {
    setBulkError(null)
    if (bulkState.selectedCount > 10) {
      setBulkError(
        `You can only shortlist up to 10 candidates at a time. Please deselect ${bulkState.selectedCount - 10} candidate(s).`,
      )
      return
    }
    if (!nextStage) {
      setBulkError('No further stage in this pipeline')
      return
    }
    setIsConfirmOpen(true)
  }

  const handleBulkShortlistConfirm = () => {
    if (!nextStage) return
    setBulkError(null)
    bulkShortlist.mutate(
      {
        jobId: job.id,
        applicationIds: Array.from(bulkState.selectedIds),
        targetStageId: nextStage.id,
      },
      {
        onSuccess: (result) => {
          setIsConfirmOpen(false)
          if (result.failed.length > 0 && result.succeeded.length === 0) {
            setBulkError(
              result.failed[0]?.error ?? 'Failed to shortlist candidates',
            )
          } else {
            bulkState.exitMode()
          }
        },
        onError: (err) => {
          setBulkError(
            err instanceof Error ? err.message : 'Bulk shortlist failed',
          )
        },
      },
    )
  }

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
        <div className="flex flex-wrap items-center gap-2">
          {bulkState.isBulkMode ? (
            <BulkActionConfirmBar
              selectedCount={bulkState.selectedCount}
              isAllSelected={bulkState.isAllSelected}
              onCancel={bulkState.exitMode}
              onToggleSelectAll={handleToggleSelectAll}
              onConfirm={handleBulkConfirmClick}
              confirmDisabled={!nextStage || bulkShortlist.isPending}
            />
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={bulkState.enterShortlistMode}
              disabled={!nextStage || visible.length === 0}
              data-testid="bulk-shortlist-enter"
              title={
                nextStage
                  ? 'Select candidates to move to the next stage'
                  : 'Not available on last stage'
              }
            >
              <Users className="size-3.5" />
              Bulk shortlist
            </Button>
          )}
          <div className="relative w-full max-w-[220px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search candidates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
              aria-label="Search candidates"
              disabled={bulkState.isBulkMode}
            />
          </div>
        </div>
      </div>

      {bulkError ? (
        <p className="px-3 py-2 text-xs text-destructive" role="alert">
          {bulkError}
        </p>
      ) : null}

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
                <CandidateCard
                  application={app}
                  job={job}
                  stages={stages}
                  selection={
                    bulkState.isBulkMode
                      ? {
                          selected: bulkState.selectedIds.has(app.id),
                          onToggle: () => bulkState.toggleSelection(app.id),
                        }
                      : undefined
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent data-testid="bulk-shortlist-dialog">
          <DialogHeader>
            <DialogTitle>Bulk shortlist</DialogTitle>
            <DialogDescription>
              Move {bulkState.selectedCount} candidate
              {bulkState.selectedCount === 1 ? '' : 's'} to the next hiring
              stage. Sending a Reachout ports with a later ticket; this advances
              the pipeline stage now.
            </DialogDescription>
          </DialogHeader>
          {nextStage ? (
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-primary">
              <p className="text-center text-sm font-medium">
                {currentStageLabel} → {nextStage.name}
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={bulkShortlist.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleBulkShortlistConfirm}
              disabled={!nextStage || bulkShortlist.isPending}
              data-testid="bulk-shortlist-confirm"
            >
              {bulkShortlist.isPending ? 'Shortlisting…' : 'Confirm Shortlist'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
