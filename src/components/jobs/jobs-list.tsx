import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  Edit3,
  Link as LinkIcon,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { JobDetail } from '#/components/jobs/job-detail'
import { useTotalApplicants } from '#/hooks/use-total-applicants'
import { cn } from '#/lib/utils'
import { countIncludedRequirements } from '#/lib/requirements'
import { getJobApplyFormLink, filterJobsBySearch } from '#/lib/jobs-shared'
import type { JobWithCompanyRow } from '#/server/fn/jobs'

type JobsListProps = {
  jobs: JobWithCompanyRow[]
  selectedJobId: string | undefined
  onJobSelect: (jobId: string) => void
  searchTerm: string
  onSearchTermChange: (value: string) => void
  companyId?: string | null
  canCreateJob?: boolean
  canManageForms?: boolean
  /** Opens the Job creation dialog (lives on the Dashboard page). */
  onCreateJob?: () => void
}

/**
 * Member's Jobs list. Source-faithful structure + interaction for #37
 * (Your Jobs header, expandable search, panel collapse, card affordances).
 * Paint stays on the ported design system (ADR-0030).
 */
export function JobsList({
  jobs,
  selectedJobId,
  onJobSelect,
  searchTerm,
  onSearchTermChange,
  companyId = null,
  canCreateJob = false,
  canManageForms = false,
  onCreateJob,
}: JobsListProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsJobId, setDetailsJobId] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isSearchExpanded, setIsSearchExpanded] = useState(
    () => Boolean(searchTerm.trim()),
  )
  // Local draft so typing is not reset while URL search-param navigation settles.
  const [localSearch, setLocalSearch] = useState(searchTerm)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const detailsJob = detailsJobId
    ? (jobs.find((job) => job.id === detailsJobId) ?? null)
    : null

  useEffect(() => {
    setLocalSearch(searchTerm)
  }, [searchTerm])

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchExpanded])

  useEffect(() => {
    if (searchTerm.trim()) setIsSearchExpanded(true)
  }, [searchTerm])

  const openDetails = (job: JobWithCompanyRow, e: React.MouseEvent) => {
    e.stopPropagation()
    setDetailsJobId(job.id)
    setDetailsOpen(true)
  }

  const handleCreateJob = () => {
    if (!canCreateJob || !onCreateJob) return
    onCreateJob()
  }

  const handleSearchInput = (value: string) => {
    setLocalSearch(value)
    onSearchTermChange(value)
  }

  const visibleJobs = useMemo(
    () => filterJobsBySearch(jobs, localSearch),
    [jobs, localSearch],
  )

  return (
    <>
      <div
        data-testid="jobs-panel"
        className={cn(
          'flex h-auto flex-col bg-card transition-all duration-300 md:h-full md:border-r-2 md:border-foreground/20',
          isCollapsed
            ? 'w-full md:w-16'
            : 'w-full md:w-auto md:min-w-[250px] md:max-w-[320px] md:shrink-0',
        )}
      >
        <div
          className={cn(
            'flex items-center justify-between p-4',
            isCollapsed && 'md:justify-center',
          )}
        >
          {!isCollapsed ? (
            <h2 className="text-lg font-semibold">Your Jobs</h2>
          ) : null}

          <div className="flex items-center gap-2">
            {!isCollapsed ? (
              <div className="relative flex items-center">
                {!isSearchExpanded ? (
                  <button
                    type="button"
                    onClick={() => setIsSearchExpanded(true)}
                    className="flex size-10 items-center justify-center rounded-full border-[3px] border-border bg-background/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 hover:bg-accent"
                    aria-label="Search jobs"
                    data-testid="jobs-search-toggle"
                  >
                    <Search className="size-4 text-muted-foreground" />
                  </button>
                ) : (
                  <div className="absolute right-0 z-20 flex w-60 items-center">
                    <div className="pointer-events-none absolute left-3 z-10">
                      <Search className="size-4 text-muted-foreground" />
                    </div>
                    <Input
                      ref={searchInputRef}
                      type="search"
                      placeholder="Search jobs..."
                      value={localSearch}
                      onChange={(e) => handleSearchInput(e.target.value)}
                      onBlur={() => {
                        if (!localSearch.trim()) setIsSearchExpanded(false)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          handleSearchInput('')
                          setIsSearchExpanded(false)
                        }
                      }}
                      className="h-10 w-full rounded-full border-2 border-primary/30 bg-background/95 pl-9 pr-9 shadow-lg backdrop-blur-sm transition-all focus-visible:border-primary/50 focus-visible:ring-primary/20"
                      aria-label="Search jobs"
                      data-testid="jobs-search-input"
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        handleSearchInput('')
                        setIsSearchExpanded(false)
                      }}
                      className="absolute right-2 z-10 flex size-6 items-center justify-center rounded-full hover:bg-muted"
                      aria-label="Clear search"
                    >
                      <X className="size-3.5 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="size-8 text-muted-foreground hover:text-foreground"
              title={isCollapsed ? 'Expand jobs' : 'Collapse jobs'}
              aria-label={isCollapsed ? 'Expand jobs' : 'Collapse jobs'}
              data-testid="jobs-panel-collapse"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="size-[18px]" />
              ) : (
                <PanelLeftClose className="size-[18px]" />
              )}
            </Button>
          </div>
        </div>

        {!isCollapsed ? (
          <>
            {onCreateJob ? (
              <div className="border-b border-border p-4 pt-2">
                <button
                  type="button"
                  onClick={handleCreateJob}
                  disabled={!canCreateJob}
                  data-testid="create-job-button"
                  className={cn(
                    'flex w-full items-center justify-center rounded-lg px-4 py-2 transition-colors',
                    canCreateJob
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'cursor-not-allowed bg-muted text-muted-foreground',
                  )}
                >
                  <span className="text-sm sm:text-base">
                    {canCreateJob ? 'Add New Job' : 'Permission Required'}
                  </span>
                </button>
              </div>
            ) : null}

            <div
              data-testid="jobs-list"
              className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-4"
              role="list"
              aria-label="Jobs"
            >
              {visibleJobs.length === 0 ? (
                <div className="py-8 text-left text-muted-foreground">
                  {localSearch.trim() ? (
                    <>
                      <p>No jobs match your search.</p>
                      <p className="text-sm">Try a different search term.</p>
                    </>
                  ) : (
                    <>
                      <p>No jobs yet.</p>
                      <p className="text-sm">Create your first job posting!</p>
                    </>
                  )}
                </div>
              ) : (
                visibleJobs.map((job) => (
                  <div key={job.id} role="listitem">
                    <JobCard
                      job={job}
                      companyId={companyId}
                      isSelected={selectedJobId === job.id}
                      onSelect={() => onJobSelect(job.id)}
                      onOpenDetails={openDetails}
                    />
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="hidden flex-col items-center gap-4 py-4 md:flex">
            {onCreateJob ? (
              <Button
                type="button"
                onClick={handleCreateJob}
                disabled={!canCreateJob}
                variant="ghost"
                size="icon"
                data-testid="create-job-collapsed"
                className={cn(
                  'size-10 rounded-full',
                  canCreateJob
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'cursor-not-allowed bg-muted text-muted-foreground',
                )}
                title="Add New Job"
                aria-label="Add New Job"
              >
                <span className="text-xl">+</span>
              </Button>
            ) : null}

            <div className="no-scrollbar flex w-full flex-1 flex-col gap-2 overflow-y-auto px-2 pt-2">
              {visibleJobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => onJobSelect(job.id)}
                  className={cn(
                    'group relative flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md transition-all',
                    selectedJobId === job.id
                      ? 'bg-primary/10 text-primary ring-2 ring-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                  title={job.title}
                  aria-label={`Select job ${job.title}`}
                  aria-pressed={selectedJobId === job.id}
                >
                  <span className="text-xs font-bold">
                    {job.title.substring(0, 2).toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
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

function JobCard({
  job,
  companyId,
  isSelected,
  onSelect,
  onOpenDetails,
}: {
  job: JobWithCompanyRow
  companyId: string | null
  isSelected: boolean
  onSelect: () => void
  onOpenDetails: (job: JobWithCompanyRow, e: React.MouseEvent) => void
}) {
  const [copiedTarget, setCopiedTarget] = useState<'email' | 'form' | null>(
    null,
  )
  const { data: activeApplicantsCount = 0 } = useTotalApplicants(
    job.id,
    companyId,
  )
  const formLink =
    typeof window !== 'undefined'
      ? getJobApplyFormLink(job, window.location.origin)
      : null

  const handleCopy = async (
    event: React.MouseEvent<HTMLButtonElement>,
    value: string,
    target: 'email' | 'form',
  ) => {
    event.stopPropagation()
    try {
      await navigator.clipboard.writeText(value)
      setCopiedTarget(target)
      setTimeout(() => setCopiedTarget(null), 2000)
    } catch (error) {
      console.error('Failed to copy value:', error)
    }
  }

  return (
    <Card
      data-testid="job-card"
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      aria-label={`Select job ${job.title}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        'group relative cursor-pointer text-left transition-all hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50',
        isSelected
          ? 'border-2 border-primary/30 bg-primary/10 shadow-sm'
          : 'border-border hover:border-primary/40',
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xs font-semibold sm:text-sm">
              {job.title}
            </h3>
            <p
              className="mt-0.5 truncate text-[10px] text-muted-foreground"
              title={job.job_posting_link || ''}
            >
              {job.job_posting_link || 'No code'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
            <span
              className="text-[11px] text-muted-foreground"
              data-testid="job-card-applicants"
            >
              <span className="font-medium text-foreground">
                {activeApplicantsCount}
              </span>{' '}
              applicants
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-muted-foreground">
                PR
              </span>
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-100 px-1 text-[10px] font-bold text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                {countIncludedRequirements(
                  job.preferred_requirements,
                  'preferred',
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-muted-foreground">
                NN
              </span>
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-100 px-1 text-[10px] font-bold text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                {countIncludedRequirements(
                  job.non_negotiables,
                  'non_negotiable',
                )}
              </span>
            </div>
          </div>

          <div
            className="ml-auto flex shrink-0 items-center gap-1.5"
            data-testid="job-card-actions"
          >
            {job.forwarding_email ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 gap-1.5 border-border px-2 text-[10px] text-muted-foreground hover:text-foreground"
                title="Copy Forwarding Email"
                aria-label={`Copy forwarding email for ${job.title}`}
                data-testid="copy-forwarding-email"
                onClick={(e) =>
                  void handleCopy(e, job.forwarding_email, 'email')
                }
              >
                {copiedTarget === 'email' ? (
                  <Check className="size-3 text-emerald-500" />
                ) : (
                  <Mail className="size-3" />
                )}
                <span className="hidden xl:inline">Email</span>
              </Button>
            ) : null}
            {formLink ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 gap-1.5 border-border px-2 text-[10px] text-muted-foreground hover:text-foreground"
                title="Copy Form Link"
                aria-label={`Copy apply form link for ${job.title}`}
                data-testid="copy-apply-link"
                onClick={(e) => void handleCopy(e, formLink, 'form')}
              >
                {copiedTarget === 'form' ? (
                  <Check className="size-3 text-emerald-500" />
                ) : (
                  <LinkIcon className="size-3" />
                )}
                <span className="hidden xl:inline">Form</span>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-6 border-border text-muted-foreground hover:text-foreground"
              title="View job details"
              aria-label={`View details for ${job.title}`}
              data-testid="open-job-details"
              onClick={(e) => onOpenDetails(job, e)}
            >
              <Edit3 className="size-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
