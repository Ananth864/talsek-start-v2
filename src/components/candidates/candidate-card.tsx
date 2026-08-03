import { useState } from 'react'
import type { MouseEvent } from 'react'
import {
  Check,
  ExternalLink,
  Eye,
  Loader,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { Checkbox } from '#/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { cn } from '#/lib/utils'
import {
  mergeRequirementsWithAnalysis,
  summarizeRequirementAnalysis,
} from '#/lib/requirements'
import { parsedSummary } from '#/lib/parsed-candidate'
import {
  aiAnalysisOf,
  applicationStatusMeta,
  normalizedMatchScore,
  scoreBand,
} from '#/lib/job-applications-shared'
import { nextStageForApplication } from '#/lib/candidate-stage-navigation'
import {
  applicationStageKind,
  interviewScoreColor,
  interviewStatusColor,
  jobHasInterviewStage,
} from '#/lib/candidate-card-stage'
import type { CandidateListView } from '#/server/fn/profile-preferences'
import { useToggleStarred } from '#/hooks/use-toggle-starred'
import { useRejectCandidate } from '#/hooks/use-reject-candidate'
import { useInterviewSession } from '#/hooks/use-interview-session'
import { ScoreRing } from './score-ring'
import { CandidateProfileDialog } from './candidate-profile-dialog'
import type {
  JobApplicationRow,
  JobStageRow,
} from '#/server/fn/job-applications'
import type { JobWithCompanyRow } from '#/server/fn/jobs'

type CandidateCardProps = {
  application: JobApplicationRow
  job: JobWithCompanyRow
  stages: JobStageRow[]
  layout?: CandidateListView
  canSendReachout: boolean
  isShortlisting: boolean
  shortlistError: string | null
  onShortlist: () => void
  /** When set, the card is in bulk-selection mode (ticket #10). */
  selection?: {
    selected: boolean
    onToggle: () => void
  }
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  // Fixed locale so SSR HTML matches client hydration (avoids remounts that
  // drop Shortlist click handlers under Playwright).
  return d.toLocaleDateString('en-US')
}

function InterviewBadges({
  status,
  scorePercent,
  align = 'end',
}: {
  status: string
  scorePercent: number | null
  align?: 'start' | 'end'
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 text-[11px] text-muted-foreground',
        align === 'end' ? 'items-end' : 'items-start',
      )}
      data-testid="candidate-interview-badges"
    >
      <div className="flex items-center gap-2">
        <span className="font-medium">Status:</span>
        <span
          className={cn(
            'rounded-md border px-1.5 py-0 font-medium',
            interviewStatusColor(status),
          )}
        >
          {status === 'completed' ? 'Completed' : 'Pending'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium">Score:</span>
        <span
          className={cn(
            'rounded-md border px-1.5 py-0 font-medium',
            interviewScoreColor(scorePercent),
          )}
          data-testid="candidate-interview-score"
        >
          {scorePercent !== null ? `${scorePercent}%` : 'NA'}
        </span>
      </div>
    </div>
  )
}

function RequirementsSummary({
  preferredMet,
  preferredTotal,
  nonNegotiablesMet,
  nonNegotiablesTotal,
  align = 'start',
}: {
  preferredMet: number
  preferredTotal: number
  nonNegotiablesMet: number
  nonNegotiablesTotal: number
  align?: 'start' | 'end'
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 text-[11px] text-muted-foreground',
        align === 'end' ? 'items-end' : 'items-start',
      )}
      data-testid="candidate-requirements-summary"
    >
      <div className="flex items-center gap-2">
        <span className="font-medium">Preferred:</span>
        <span className="rounded-md border px-1.5 py-0 font-semibold tabular-nums">
          {preferredMet}/{preferredTotal}
        </span>
      </div>
      {nonNegotiablesTotal > 0 ? (
        <div className="flex items-center gap-2">
          <span className="font-medium">Non-Negotiables:</span>
          <span
            className={cn(
              'rounded-md border px-1.5 py-0 font-semibold tabular-nums',
              nonNegotiablesMet === nonNegotiablesTotal
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400',
            )}
          >
            {nonNegotiablesMet}/{nonNegotiablesTotal}
          </span>
        </div>
      ) : null}
    </div>
  )
}

/**
 * One adaptive candidate card for the board (ticket #26). Replaces the
 * source's three stage-specific families: stage-appropriate content
 * (interview badges, final-stage actions) in both grid and list layouts.
 * Shortlist Reachout send stays owned by the list; this card surfaces the
 * controls and star / reject / profile / bulk-select actions.
 */
export function CandidateCard({
  application,
  job,
  stages,
  layout = 'list',
  canSendReachout,
  isShortlisting,
  shortlistError,
  onShortlist,
  selection,
}: CandidateCardProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [profileTab, setProfileTab] = useState<
    'overview' | 'interview'
  >('overview')
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const toggleStarred = useToggleStarred()
  const rejectCandidate = useRejectCandidate()

  const stageKind = applicationStageKind(application)
  const hasInterviewStage = jobHasInterviewStage(stages)
  const needsInterview =
    stageKind === 'interview' || (stageKind === 'final' && hasInterviewStage)

  const { session: interviewSession, score: interviewScore } =
    useInterviewSession(application.id, needsInterview)
  const interviewStatus = interviewSession?.status || 'pending'
  const interviewScorePercent = interviewScore.scorePercent

  const score = normalizedMatchScore(application)
  const parsed = parsedSummary(application.parsed_candidate_data)
  const email = application.candidate.email
  const name = application.candidate_name || parsed.name || email || 'Candidate'
  const applied = formatDate(application.created_at)
  const status = applicationStatusMeta(application.status)
  const isRejected = application.status === 'rejected'
  const nextStage = nextStageForApplication(application, stages)
  const canShortlistUi = Boolean(nextStage) && !isRejected
  const isBulkMode = Boolean(selection)
  const isGrid = layout === 'grid'

  const analysis = aiAnalysisOf(application)
  const preferredMerged = mergeRequirementsWithAnalysis(
    job.preferred_requirements,
    'preferred',
    analysis?.preferred_requirements_analysis?.details,
  )
  const nonNegMerged = mergeRequirementsWithAnalysis(
    job.non_negotiables,
    'non_negotiable',
    analysis?.non_negotiables_analysis?.details,
  )
  const preferredSummary = summarizeRequirementAnalysis(preferredMerged)
  const nonNegSummary = summarizeRequirementAnalysis(nonNegMerged)
  const preferredMet = preferredSummary.metCount
  const preferredTotal = preferredSummary.totalCount
  const nonNegMet = nonNegSummary.metCount
  const nonNegTotal = nonNegSummary.totalCount

  const starringId = toggleStarred.isPending
    ? toggleStarred.variables.applicationId
    : null
  const rejectingId = rejectCandidate.isPending
    ? rejectCandidate.variables.applicationId
    : null
  const isStarring = starringId === application.id
  const isRejecting = rejectingId === application.id

  const showStar =
    !isBulkMode &&
    !(stageKind === 'final' && !hasInterviewStage)

  const handleStarToggle = (e?: MouseEvent) => {
    e?.stopPropagation()
    setActionError(null)
    toggleStarred.mutate(
      { applicationId: application.id, starred: !application.starred },
      {
        onError: (err) => {
          setActionError(
            err instanceof Error ? err.message : 'Could not update favorite',
          )
        },
      },
    )
  }

  const handleRejectConfirm = () => {
    setActionError(null)
    rejectCandidate.mutate(
      { applicationId: application.id },
      {
        onSuccess: () => setIsRejectOpen(false),
        onError: (err) => {
          setActionError(
            err instanceof Error ? err.message : 'Failed to reject candidate',
          )
        },
      },
    )
  }

  const openProfile = (
    tab: 'overview' | 'interview' = 'overview',
    e?: MouseEvent,
  ) => {
    e?.stopPropagation()
    setProfileTab(tab)
    setIsProfileOpen(true)
  }

  const cardActionError = shortlistError ?? actionError

  const handleCardClick = () => {
    if (selection) selection.onToggle()
  }

  const starButton = showStar ? (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-7 shrink-0"
      onClick={handleStarToggle}
      disabled={isStarring}
      aria-label={application.starred ? 'Unstar candidate' : 'Star candidate'}
      data-testid="candidate-star-toggle"
    >
      <Star
        className={cn(
          'size-3.5',
          application.starred
            ? 'fill-amber-400 text-amber-400'
            : 'text-muted-foreground',
        )}
      />
    </Button>
  ) : null

  const profileButton = (
    <Button
      size="sm"
      variant="outline"
      className={cn(
        'h-7 gap-1 px-2 text-[11px]',
        isGrid && 'h-8 w-full',
      )}
      onClick={(e) => openProfile('overview', e)}
      data-testid="candidate-view-profile"
    >
      <Sparkles className="size-3" />
      AI Analysis
    </Button>
  )

  const rejectButton = !isRejected ? (
    <Button
      size="sm"
      variant="outline"
      className={cn(
        'h-7 gap-1 px-2 text-[11px] border-destructive/40 text-destructive hover:bg-destructive/10',
        isGrid && 'h-8 flex-1',
      )}
      onClick={(e) => {
        e.stopPropagation()
        setActionError(null)
        setIsRejectOpen(true)
      }}
      disabled={isRejecting}
      data-testid="candidate-reject"
    >
      {isRejecting ? (
        <Loader className="size-3 animate-spin" />
      ) : (
        <Trash2 className="size-3" />
      )}
      {isRejecting ? 'Rejecting…' : 'Reject'}
    </Button>
  ) : null

  const shortlistButton = (
    <Button
      size="sm"
      variant="outline"
      className={cn(
        'h-7 gap-1 px-2 text-[11px]',
        isGrid && 'h-8 flex-1',
        canShortlistUi && canSendReachout
          ? 'border-emerald-400/60 text-emerald-600 hover:bg-emerald-500/10 dark:border-emerald-500/40 dark:text-emerald-200'
          : 'text-muted-foreground',
      )}
      onClick={(e) => {
        e.stopPropagation()
        onShortlist()
      }}
      disabled={!canShortlistUi || isShortlisting}
      data-can-send-reachout={canSendReachout ? 'true' : 'false'}
      title={
        !canSendReachout
          ? 'You do not have permission to send Reachouts'
          : canShortlistUi
            ? undefined
            : isRejected
              ? 'Rejected candidates cannot be shortlisted'
              : 'No further stage in this pipeline'
      }
      data-testid="candidate-shortlist"
    >
      {isShortlisting ? (
        <Loader className="size-3 animate-spin" />
      ) : (
        <Check className="size-3" />
      )}
      {isShortlisting
        ? 'Shortlisting…'
        : isRejected
          ? 'Rejected'
          : 'Shortlist'}
    </Button>
  )

  const pipelineActions =
    stageKind !== 'final' && !isBulkMode ? (
      isGrid ? (
        <div className="flex w-full flex-col gap-2">
          {profileButton}
          <div className="flex gap-2">
            {rejectButton}
            {shortlistButton}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {application.resume_url ? (
            <a
              href={application.resume_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary underline-offset-4 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Resume
              <ExternalLink className="size-3" />
            </a>
          ) : null}
          {profileButton}
          {rejectButton}
          {shortlistButton}
        </div>
      )
    ) : null

  const finalActions =
    stageKind === 'final' && !isBulkMode ? (
      <div
        className={cn(
          'flex flex-wrap items-center gap-2',
          isGrid ? 'w-full flex-col' : 'w-full',
        )}
        data-testid="candidate-final-actions"
      >
        {!hasInterviewStage ? (
          <>
            <Button
              size="sm"
              variant="outline"
              className={cn(
                'h-7 gap-1 px-2 text-[11px] border-primary/40 text-primary hover:bg-primary/10',
                isGrid ? 'h-8 w-full' : 'flex-1',
              )}
              onClick={(e) => openProfile('overview', e)}
              data-testid="candidate-view-profile"
            >
              <Eye className="size-3" />
              AI Analysis
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled
              className={cn(
                'h-7 gap-1 px-2 text-[11px] border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-900/30 dark:text-emerald-200',
                isGrid ? 'h-8 w-full' : 'flex-1',
              )}
              data-testid="candidate-shortlisted-badge"
            >
              <Check className="size-3" />
              Shortlisted - Reachout Sent
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              className={cn(
                'h-7 gap-1 px-2 text-[11px] border-primary/40 text-primary hover:bg-primary/10',
                isGrid ? 'h-8 w-full' : 'flex-1',
              )}
              onClick={(e) => openProfile('overview', e)}
              data-testid="candidate-view-profile"
            >
              <Eye className="size-3" />
              Resume Analysis
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={interviewStatus === 'pending'}
              className={cn(
                'h-7 gap-1 px-2 text-[11px] border-primary/40 text-primary',
                isGrid ? 'h-8 w-full' : 'flex-1',
                interviewStatus === 'pending' && 'cursor-not-allowed opacity-50',
              )}
              onClick={(e) => openProfile('interview', e)}
              data-testid="candidate-interview-analysis"
            >
              <Eye className="size-3" />
              {interviewStatus === 'pending'
                ? 'Interview Pending'
                : 'Interview Analysis'}
            </Button>
          </>
        )}
      </div>
    ) : null

  const stageMeta =
    stageKind === 'interview' ? (
      <InterviewBadges
        status={interviewStatus}
        scorePercent={interviewScorePercent}
        align={isGrid ? 'end' : 'end'}
      />
    ) : (
      <RequirementsSummary
        preferredMet={preferredMet}
        preferredTotal={preferredTotal}
        nonNegotiablesMet={nonNegMet}
        nonNegotiablesTotal={nonNegTotal}
        align={isGrid || stageKind === 'final' ? 'end' : 'start'}
      />
    )

  const identityBlock = (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1.5">
        <h4 className="truncate text-sm font-semibold" title={name}>
          {name}
        </h4>
        {starButton}
      </div>
      {email && email !== name ? (
        <p className="truncate text-xs text-muted-foreground" title={email}>
          {email}
        </p>
      ) : null}
      {!isGrid ? (
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
          {parsed.currentRole ? (
            <span className="truncate">{parsed.currentRole}</span>
          ) : null}
          {parsed.years != null ? <span>· {parsed.years}y exp</span> : null}
          {parsed.location ? (
            <span className="truncate">· {parsed.location}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  )

  return (
    <Card
      data-testid="candidate-card"
      data-application-id={application.id}
      data-layout={layout}
      data-stage-kind={stageKind}
      className={cn(
        'border border-l-4 bg-card transition-shadow',
        scoreBand(score).border,
        selection?.selected && 'ring-2 ring-primary/40',
        isBulkMode && 'cursor-pointer hover:bg-accent/50',
        !isBulkMode && 'hover:shadow-md',
        isGrid && 'flex h-full min-h-[260px] flex-col',
      )}
      onClick={isBulkMode ? handleCardClick : undefined}
    >
      <CardContent
        className={cn(
          isGrid ? 'flex flex-1 flex-col gap-4 p-4' : 'p-3',
        )}
      >
        {isGrid ? (
          <>
            <div className="flex items-start gap-3">
              {selection ? (
                <Checkbox
                  checked={selection.selected}
                  onCheckedChange={() => selection.onToggle()}
                  aria-label={`Select ${name}`}
                  data-testid="candidate-bulk-select"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : null}
              {identityBlock}
            </div>

            <div className="flex flex-1 items-start gap-4">
              <ScoreRing score={score} size="grid" />
              <div className="flex min-w-0 flex-1 flex-col items-end gap-2">
                {stageMeta}
                {stageKind === 'final' && hasInterviewStage ? (
                  <InterviewBadges
                    status={interviewStatus}
                    scorePercent={interviewScorePercent}
                    align="end"
                  />
                ) : null}
                {application.resume_url ? (
                  <a
                    href={application.resume_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary underline-offset-4 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Resume
                    <ExternalLink className="size-3" />
                  </a>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    No resume
                  </span>
                )}
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-2">
              {pipelineActions}
              {finalActions}
              {cardActionError ? (
                <p
                  className="text-[11px] text-destructive"
                  role="alert"
                  data-testid="candidate-shortlist-error"
                >
                  {cardActionError}
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {selection ? (
              <Checkbox
                checked={selection.selected}
                onCheckedChange={() => selection.onToggle()}
                aria-label={`Select ${name}`}
                data-testid="candidate-bulk-select"
                className="mt-1"
                onClick={(e) => e.stopPropagation()}
              />
            ) : null}
            <div className="flex min-w-0 max-w-full items-center gap-3 lg:basis-[34%] lg:max-w-[34%]">
              <ScoreRing score={score} />
              {identityBlock}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2 lg:basis-[66%] lg:max-w-[66%] lg:items-end">
              {stageKind === 'resume' && parsed.topSkills.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1 self-stretch">
                  {parsed.topSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="text-[10px] font-normal"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : null}

              {stageKind === 'final' && hasInterviewStage ? (
                <div className="hidden w-full grid-cols-2 gap-x-6 gap-y-1.5 md:grid">
                  <RequirementsSummary
                    preferredMet={preferredMet}
                    preferredTotal={preferredTotal}
                    nonNegotiablesMet={nonNegMet}
                    nonNegotiablesTotal={nonNegTotal}
                    align="start"
                  />
                  <InterviewBadges
                    status={interviewStatus}
                    scorePercent={interviewScorePercent}
                    align="end"
                  />
                </div>
              ) : (
                stageMeta
              )}

              <div className="flex w-full flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={status.variant} data-testid="candidate-status">
                    {status.label}
                  </Badge>
                  {applied ? (
                    <span className="text-[11px] text-muted-foreground">
                      Applied {applied}
                    </span>
                  ) : null}
                </div>
                {pipelineActions}
                {finalActions}
              </div>
              {cardActionError ? (
                <p
                  className="self-stretch text-[11px] text-destructive"
                  role="alert"
                  data-testid="candidate-shortlist-error"
                >
                  {cardActionError}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </CardContent>

      <CandidateProfileDialog
        application={application}
        job={job}
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        initialTab={profileTab}
      />

      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent data-testid="candidate-reject-dialog">
          <DialogHeader>
            <DialogTitle>Reject Candidate</DialogTitle>
            <DialogDescription>
              This candidate will be marked Rejected on the board. Are you sure
              you want to reject {name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRejectOpen(false)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={isRejecting}
              data-testid="candidate-reject-confirm"
            >
              {isRejecting ? 'Rejecting…' : 'Yes, Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
