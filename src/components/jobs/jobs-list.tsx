import { useState } from 'react'
import { Edit3, Plus, Search } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { JobDetail } from '#/components/jobs/job-detail'
import { cn } from '#/lib/utils'
import { countIncludedRequirements } from '#/lib/requirements'
import { getFormConfig, jobStatusMeta } from '#/lib/jobs-shared'
import type { JobWithCompanyRow } from '#/server/fn/jobs'

type JobsListProps = {
  jobs: JobWithCompanyRow[]
  selectedJobId: string | undefined
  onJobSelect: (jobId: string) => void
  searchTerm: string
  onSearchTermChange: (value: string) => void
  loading?: boolean
  error?: Error | null
  companyId?: string | null
  canCreateJob?: boolean
  canManageForms?: boolean
  /** Opens the Job creation dialog (lives on the Dashboard page). */
  onCreateJob?: () => void
}

/**
 * Member's Jobs list. Ports the source's `JobsList` read surface: search,
 * selectable cards (board selection via `?jobId=`), and a pencil control that
 * opens the Job Details modal (separate from board selection — source parity).
 */
export function JobsList({
  jobs,
  selectedJobId,
  onJobSelect,
  searchTerm,
  onSearchTermChange,
  loading,
  error,
  companyId = null,
  canCreateJob = false,
  canManageForms = false,
  onCreateJob,
}: JobsListProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsJobId, setDetailsJobId] = useState<string | null>(null)
  const detailsJob = detailsJobId
    ? (jobs.find((job) => job.id === detailsJobId) ?? null)
    : null

  const openDetails = (job: JobWithCompanyRow, e: React.MouseEvent) => {
    e.stopPropagation()
    setDetailsJobId(job.id)
    setDetailsOpen(true)
  }

  return (
    <>
      <div className="flex w-full flex-col border-r md:min-w-[260px] md:max-w-[340px] md:shrink-0">
        <div className="space-y-3 border-b p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search jobs…"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="pl-8"
              aria-label="Search jobs"
            />
          </div>
          {onCreateJob ? (
            <Button
              type="button"
              className="w-full"
              disabled={!canCreateJob}
              onClick={onCreateJob}
              data-testid="create-job-button"
              title={
                canCreateJob
                  ? 'Create job'
                  : 'Permission required to create jobs'
              }
            >
              <Plus className="size-4" />
              {canCreateJob ? 'Create job' : 'Permission required'}
            </Button>
          ) : null}
        </div>

        <div
          data-testid="jobs-list"
          className="flex-1 overflow-y-auto p-3"
          role="list"
          aria-label="Jobs"
        >
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading jobs…</p>
          ) : error ? (
            <p className="p-4 text-sm text-destructive">
              Error loading jobs: {error.message}
            </p>
          ) : jobs.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              {searchTerm ? 'No jobs match your search.' : 'No jobs yet.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {jobs.map((job) => {
                const formConfig = getFormConfig(job)
                const isSelected = selectedJobId === job.id
                const status = jobStatusMeta(job.status)
                return (
                  <li key={job.id} role="listitem">
                    <Card
                      data-testid="job-card"
                      tabIndex={0}
                      role="button"
                      aria-pressed={isSelected}
                      aria-label={`Select job ${job.title}`}
                      onClick={() => onJobSelect(job.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onJobSelect(job.id)
                        }
                      }}
                      className={cn(
                        'cursor-pointer transition-all hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50',
                        isSelected
                          ? 'border-2 border-primary/30 bg-primary/5'
                          : 'hover:border-primary/40',
                      )}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-semibold">
                              {job.title}
                            </h3>
                            <p
                              className="mt-0.5 truncate text-xs text-muted-foreground"
                              title={job.job_posting_link || ''}
                            >
                              {job.job_posting_link || 'No link'}
                            </p>
                          </div>
                          <Badge variant={status.variant} className="shrink-0">
                            {status.label}
                          </Badge>
                        </div>

                        <div className="mt-3 flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1.5">
                            <span className="font-medium text-muted-foreground">
                              PR
                            </span>
                            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-100 px-1 text-[10px] font-bold text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                              {countIncludedRequirements(
                                job.preferred_requirements,
                                'preferred',
                              )}
                            </span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="font-medium text-muted-foreground">
                              NN
                            </span>
                            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-100 px-1 text-[10px] font-bold text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                              {countIncludedRequirements(
                                job.non_negotiables,
                                'non_negotiable',
                              )}
                            </span>
                          </span>
                          <div className="ml-auto flex shrink-0 items-center gap-1.5">
                            {formConfig ? (
                              <span className="text-[11px] text-muted-foreground">
                                Form {formConfig.is_enabled ? 'on' : 'off'}
                              </span>
                            ) : null}
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-6"
                              title="View job details"
                              aria-label={`View details for ${job.title}`}
                              data-testid="open-job-details"
                              onClick={(e) => openDetails(job, e)}
                            >
                              <Edit3 className="size-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <JobDetail
        job={detailsJob}
        open={detailsOpen && Boolean(detailsJob)}
        onOpenChange={setDetailsOpen}
        companyId={companyId}
        canCreateJob={canCreateJob}
        canManageForms={canManageForms}
      />
    </>
  )
}
