import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { CandidateCard } from '#/components/candidates/candidate-card'
import { ExportDropdown } from '#/components/candidates/export-dropdown'
import { ShortlistConfirmationDialog } from '#/components/candidates/shortlist-confirmation-dialog'
import { ReachoutTemplateSetupDialog } from '#/components/candidates/reachout-template-setup-dialog'
import { InsufficientCreditsModal } from '#/components/billing/insufficient-credits-modal'
import { useCandidateSearch } from '#/hooks/use-candidate-search'
import { useCrossJobShortlistActions } from '#/hooks/use-cross-job-shortlist-actions'
import { useCandidateListView } from '#/hooks/use-candidate-list-view'
import { jobStagesQueryOptions } from '#/hooks/use-job-stages'
import { fetchJobs } from '#/server/fn/jobs'
import { jobsQueryKey } from '#/lib/jobs-shared'
import {
  CANDIDATE_SEARCH_STAGE_OPTIONS,
  hasCandidateSearchFilters,
} from '#/lib/candidate-search-shared'
import type { CandidateSearchFilters } from '#/lib/candidate-search-shared'
import { parsedSummary } from '#/lib/parsed-candidate'
import type { JobStageRow } from '#/server/fn/job-applications'
import type { JobWithCompanyRow } from '#/server/fn/jobs'

export type CandidatesSearchUrlState = {
  name?: string
  jobId?: string
  stage?: string
  minScore?: string
  starred?: boolean
  fulfilledNN?: boolean
}

type CandidatesSearchPageProps = {
  companyId: string | null
  userId: string | null
  canSendReachout: boolean
  search: CandidatesSearchUrlState
}

function filtersFromUrl(search: CandidatesSearchUrlState): {
  draft: {
    name: string
    jobId: string
    stageName: string
    minMatchScore: string
    starredOnly: boolean
    fulfilledNonNegotiables: boolean
  }
  submitted: CandidateSearchFilters | null
  hasSearched: boolean
} {
  const name = search.name ?? ''
  const jobId = search.jobId ?? ''
  const stageName = search.stage ?? ''
  const minMatchScore = search.minScore ?? ''
  const starredOnly = search.starred === true
  const fulfilledNonNegotiables = search.fulfilledNN === true

  const parsedMinScore = Number(minMatchScore)
  const safeMinScore =
    minMatchScore.trim() && Number.isFinite(parsedMinScore)
      ? Math.min(100, Math.max(0, parsedMinScore))
      : undefined

  const submitted: CandidateSearchFilters = {
    name: name.trim() || undefined,
    jobId: jobId || undefined,
    stageName: stageName || undefined,
    minMatchScore: safeMinScore,
    starredOnly: starredOnly || undefined,
    fulfilledNonNegotiables: fulfilledNonNegotiables || undefined,
  }

  const hasSearched = hasCandidateSearchFilters(submitted)
  return {
    draft: {
      name,
      jobId,
      stageName,
      minMatchScore,
      starredOnly,
      fulfilledNonNegotiables,
    },
    submitted: hasSearched ? submitted : null,
    hasSearched,
  }
}

/**
 * Cross-job Candidates page (ticket #27). Filter sidebar + adaptive cards +
 * Excel / PDF-ZIP export. Filters sync to the URL (source parity).
 */
export function CandidatesSearchPage({
  companyId,
  userId,
  canSendReachout,
  search,
}: CandidatesSearchPageProps) {
  const navigate = useNavigate({ from: '/candidates' })
  const initial = filtersFromUrl(search)

  const [name, setName] = useState(initial.draft.name)
  const [jobId, setJobId] = useState(initial.draft.jobId)
  const [stageName, setStageName] = useState(initial.draft.stageName)
  const [minMatchScore, setMinMatchScore] = useState(initial.draft.minMatchScore)
  const [starredOnly, setStarredOnly] = useState(initial.draft.starredOnly)
  const [fulfilledNonNegotiables, setFulfilledNonNegotiables] = useState(
    initial.draft.fulfilledNonNegotiables,
  )
  const [submittedFilters, setSubmittedFilters] =
    useState<CandidateSearchFilters | null>(initial.submitted)
  const [hasSearched, setHasSearched] = useState(initial.hasSearched)

  // Rehydrate draft + submitted filters when the URL changes (back/forward).
  useEffect(() => {
    const next = filtersFromUrl(search)
    setName(next.draft.name)
    setJobId(next.draft.jobId)
    setStageName(next.draft.stageName)
    setMinMatchScore(next.draft.minMatchScore)
    setStarredOnly(next.draft.starredOnly)
    setFulfilledNonNegotiables(next.draft.fulfilledNonNegotiables)
    setSubmittedFilters(next.submitted)
    setHasSearched(next.hasSearched)
  }, [search])

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        name.trim() ||
          jobId ||
          stageName ||
          minMatchScore.trim() ||
          starredOnly ||
          fulfilledNonNegotiables,
      ),
    [
      name,
      jobId,
      stageName,
      minMatchScore,
      starredOnly,
      fulfilledNonNegotiables,
    ],
  )

  const { data: jobs = [], isLoading: isJobsLoading } = useQuery({
    queryKey: jobsQueryKey(companyId),
    queryFn: () => fetchJobs(),
    enabled: Boolean(companyId),
  })

  const { data, isLoading, isFetching, error } = useCandidateSearch(
    companyId,
    submittedFilters,
    hasSearched,
  )

  const { viewMode } = useCandidateListView(userId)

  const jobsById = useMemo(() => {
    const map = new Map<string, JobWithCompanyRow>()
    for (const job of jobs) map.set(job.id, job)
    return map
  }, [jobs])

  const applications = data ?? []
  const uniqueJobIds = useMemo(
    () => [...new Set(applications.map((app) => app.job_id))],
    [applications],
  )

  const stagesQueries = useQueries({
    queries: uniqueJobIds.map((id) => jobStagesQueryOptions(id, companyId)),
  })

  const stagesByJobId = useMemo(() => {
    const map = new Map<string, JobStageRow[]>()
    uniqueJobIds.forEach((id, index) => {
      map.set(id, stagesQueries[index]?.data ?? [])
    })
    return map
  }, [uniqueJobIds, stagesQueries])

  const shortlist = useCrossJobShortlistActions({
    applications,
    jobsById,
    stagesByJobId,
    companyId,
    canSendReachout,
  })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!hasActiveFilters) return

    const parsedMinScore = Number(minMatchScore)
    const safeMinScore =
      minMatchScore.trim() && Number.isFinite(parsedMinScore)
        ? Math.min(100, Math.max(0, parsedMinScore))
        : undefined

    const nextFilters: CandidateSearchFilters = {
      name: name.trim() || undefined,
      jobId: jobId || undefined,
      stageName: stageName || undefined,
      minMatchScore: safeMinScore,
      starredOnly: starredOnly || undefined,
      fulfilledNonNegotiables: fulfilledNonNegotiables || undefined,
    }

    setSubmittedFilters(nextFilters)
    setHasSearched(true)

    void navigate({
      to: '/candidates',
      search: {
        name: nextFilters.name,
        jobId: nextFilters.jobId,
        stage: nextFilters.stageName,
        minScore:
          typeof nextFilters.minMatchScore === 'number'
            ? String(nextFilters.minMatchScore)
            : undefined,
        starred: nextFilters.starredOnly ? true : undefined,
        fulfilledNN: nextFilters.fulfilledNonNegotiables ? true : undefined,
      },
      replace: true,
    })
  }

  const handleClear = () => {
    setName('')
    setJobId('')
    setStageName('')
    setMinMatchScore('')
    setStarredOnly(false)
    setFulfilledNonNegotiables(false)
    setSubmittedFilters(null)
    setHasSearched(false)
    void navigate({
      to: '/candidates',
      search: {},
      replace: true,
    })
  }

  const isSearching = isLoading || isFetching
  const filterJob = jobId ? (jobsById.get(jobId) ?? null) : null

  const shortlistCandidateName = shortlist.application
    ? shortlist.application.candidate_name ||
      parsedSummary(shortlist.application.parsed_candidate_data).name ||
      shortlist.application.candidate.email ||
      'Candidate'
    : 'Candidate'

  return (
    <div className="w-full p-6" data-testid="candidates-page">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        <aside
          className="h-fit space-y-4 rounded-lg border bg-card p-4 shadow-sm lg:sticky lg:top-4"
          data-testid="candidates-filters"
        >
          <div>
            <h2 className="text-lg font-semibold">Filters</h2>
            <p className="text-sm text-muted-foreground">
              Search for candidates
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="candidate-name">Candidate name</Label>
              <Input
                id="candidate-name"
                placeholder="Search by name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                data-testid="filter-name"
              />
            </div>

            <div className="space-y-2">
              <Label>Job</Label>
              <Select
                value={jobId || undefined}
                onValueChange={setJobId}
                disabled={isJobsLoading}
              >
                <SelectTrigger data-testid="filter-job">
                  <SelectValue
                    placeholder={
                      isJobsLoading ? 'Loading jobs...' : 'Select job (optional)'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Stage</Label>
              <Select
                value={stageName || undefined}
                onValueChange={setStageName}
              >
                <SelectTrigger data-testid="filter-stage">
                  <SelectValue placeholder="Select stage (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {CANDIDATE_SEARCH_STAGE_OPTIONS.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min-match-score">Minimum match score</Label>
              <Input
                id="min-match-score"
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                step={1}
                placeholder="0-100"
                value={minMatchScore}
                onChange={(event) => setMinMatchScore(event.target.value)}
                className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                data-testid="filter-min-score"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Checkbox
                  checked={starredOnly}
                  onCheckedChange={(checked) =>
                    setStarredOnly(Boolean(checked))
                  }
                  data-testid="filter-starred"
                />
                Starred only
              </Label>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Checkbox
                  checked={fulfilledNonNegotiables}
                  onCheckedChange={(checked) =>
                    setFulfilledNonNegotiables(Boolean(checked))
                  }
                  data-testid="filter-fulfilled-nn"
                />
                Fulfilled non-negotiables
              </Label>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={!hasActiveFilters || isSearching}
                className="flex-1"
                data-testid="candidates-search"
              >
                Search
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                className="flex-1"
                data-testid="candidates-clear"
              >
                Clear
              </Button>
            </div>
          </form>
        </aside>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span
              className="text-sm font-medium text-muted-foreground"
              data-testid="candidates-result-count"
            >
              {hasSearched && !isSearching && !error && data
                ? `${data.length} candidate${data.length !== 1 ? 's' : ''} found`
                : 'Candidates'}
            </span>
            <ExportDropdown
              candidates={applications}
              job={filterJob}
              jobsById={jobsById}
              disabled={isSearching}
            />
          </div>

          {!hasSearched ? (
            <div
              className="rounded-lg border bg-muted/30 p-6 text-sm text-muted-foreground"
              data-testid="candidates-empty-prompt"
            >
              Set at least one filter and press Search to see candidates.
            </div>
          ) : null}

          {error ? (
            <div
              className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
              role="alert"
            >
              Unable to load candidates. Please try again.
            </div>
          ) : null}

          {isSearching ? (
            <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
              Loading candidates...
            </div>
          ) : null}

          {hasSearched && !isSearching && !error ? (
            applications.length > 0 ? (
              <ul
                data-testid="candidate-cards"
                data-layout={viewMode}
                className={
                  viewMode === 'grid'
                    ? 'grid gap-4'
                    : 'flex flex-col gap-2'
                }
                style={
                  viewMode === 'grid'
                    ? {
                        gridTemplateColumns:
                          'repeat(auto-fill, minmax(280px, 1fr))',
                      }
                    : undefined
                }
              >
                {applications.map((application) => {
                  const job = jobsById.get(application.job_id)
                  if (!job) return null
                  const stages = stagesByJobId.get(application.job_id) ?? []
                  return (
                    <li key={application.id}>
                      <CandidateCard
                        application={application}
                        job={job}
                        stages={stages}
                        layout={viewMode}
                        canSendReachout={canSendReachout}
                        isShortlisting={
                          shortlist.shortlistingId === application.id
                        }
                        shortlistError={shortlist.actionErrorFor(
                          application.id,
                        )}
                        onShortlist={() =>
                          void shortlist.handleShortlistClick(application.id)
                        }
                      />
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div
                className="rounded-lg border bg-card p-6 text-sm text-muted-foreground"
                data-testid="candidates-no-results"
              >
                No candidates found for these filters.
              </div>
            )
          ) : null}
        </section>
      </div>

      <ReachoutTemplateSetupDialog
        open={shortlist.isTemplateModalOpen}
        onOpenChange={shortlist.setIsTemplateModalOpen}
        kind={shortlist.templateType}
        template={
          shortlist.templateType === 'interview'
            ? shortlist.interviewTemplate
            : shortlist.finalTemplate
        }
        onSave={shortlist.saveTemplate}
        onSaved={() => void shortlist.handleTemplateSaved()}
      />

      <ShortlistConfirmationDialog
        open={shortlist.isShortlistModalOpen}
        onOpenChange={shortlist.setIsShortlistModalOpen}
        candidateName={shortlistCandidateName}
        currentStage={shortlist.currentStageLabel}
        nextStage={shortlist.nextStage?.name}
        messageSubject={shortlist.messageSubject}
        messageBody={shortlist.messageBody}
        onSubjectChange={shortlist.setMessageSubject}
        onBodyChange={shortlist.setMessageBody}
        onConfirm={shortlist.handleShortlistConfirm}
        isLoading={shortlist.isSending}
        requireInterviewLink={shortlist.templateType === 'interview'}
      />

      <InsufficientCreditsModal
        isOpen={shortlist.isInsufficientCreditsModalOpen}
        onClose={() => shortlist.setIsInsufficientCreditsModalOpen(false)}
        currentBalance={shortlist.creditBalance}
        requiredCredits={shortlist.interviewCost}
        actionDescription="shortlist this candidate for a Screening Interview"
      />
    </div>
  )
}
