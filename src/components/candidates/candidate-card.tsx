import { useState } from 'react'
import {
  Check,
  ExternalLink,
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
import { countIncludedRequirements } from '#/lib/requirements'
import { parsedSummary } from '#/lib/parsed-candidate'
import {
  applicationStatusMeta,
  normalizedMatchScore,
  scoreBand,
} from '#/lib/job-applications-shared'
import {
  nextStageForApplication,
} from '#/lib/candidate-stage-navigation'
import { useToggleStarred } from '#/hooks/use-toggle-starred'
import { useRejectCandidate } from '#/hooks/use-reject-candidate'
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

/**
 * A candidate row in the board. Ports the source's `CandidateCard` read surface
 * plus write actions: star, Shortlist (Reachout send owned by the list, #20),
 * and Reject. Optional `selection` enables bulk shortlist checkboxes (#10).
 */
export function CandidateCard({
  application,
  job,
  stages,
  canSendReachout,
  isShortlisting,
  shortlistError,
  onShortlist,
  selection,
}: CandidateCardProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const toggleStarred = useToggleStarred()
  const rejectCandidate = useRejectCandidate()

  const score = normalizedMatchScore(application)
  const parsed = parsedSummary(application.parsed_candidate_data)
  const email = application.candidate.email
  const name = application.candidate_name || parsed.name || email || 'Candidate'
  const applied = formatDate(application.created_at)
  const status = applicationStatusMeta(application.status)
  const isRejected = application.status === 'rejected'
  const nextStage = nextStageForApplication(application, stages)
  const canShortlistUi = Boolean(nextStage) && !isRejected

  const preferredTotal = countIncludedRequirements(
    job.preferred_requirements,
    'preferred',
  )
  const preferredMet = application.preferred_requirements_matched
  const nonNegTotal = countIncludedRequirements(
    job.non_negotiables,
    'non_negotiable',
  )
  const allNonNegMet = application.meets_all_non_negotiables

  const starringId = toggleStarred.isPending
    ? toggleStarred.variables.applicationId
    : null
  const rejectingId = rejectCandidate.isPending
    ? rejectCandidate.variables.applicationId
    : null
  const isStarring = starringId === application.id
  const isRejecting = rejectingId === application.id

  const handleStarToggle = () => {
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

  const cardActionError = shortlistError ?? actionError

  return (
    <Card
      data-testid="candidate-card"
      data-application-id={application.id}
      className={cn(
        'border border-l-4 bg-card transition-shadow hover:shadow-md',
        scoreBand(score).border,
        selection?.selected && 'ring-2 ring-primary/40',
      )}
    >
      <CardContent className="p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {selection ? (
            <Checkbox
              checked={selection.selected}
              onCheckedChange={() => selection.onToggle()}
              aria-label={`Select ${name}`}
              data-testid="candidate-bulk-select"
              className="mt-1"
            />
          ) : null}
          <div className="flex min-w-0 max-w-full items-center gap-3 lg:basis-[34%] lg:max-w-[34%]">
            <ScoreRing score={score} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="truncate text-sm font-semibold" title={name}>
                  {name}
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  onClick={handleStarToggle}
                  disabled={isStarring}
                  aria-label={
                    application.starred ? 'Unstar candidate' : 'Star candidate'
                  }
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
              </div>
              {email && email !== name ? (
                <p className="truncate text-xs text-muted-foreground" title={email}>
                  {email}
                </p>
              ) : null}
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                {parsed.currentRole ? (
                  <span className="truncate">{parsed.currentRole}</span>
                ) : null}
                {parsed.years != null ? (
                  <span>· {parsed.years}y exp</span>
                ) : null}
                {parsed.location ? (
                  <span className="truncate">· {parsed.location}</span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2 lg:basis-[66%] lg:max-w-[66%]">
            {parsed.topSkills.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1">
                {parsed.topSkills.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-[10px] font-normal">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="font-medium text-muted-foreground">Preferred</span>
                <span className="font-semibold tabular-nums">
                  {preferredMet}/{preferredTotal}
                </span>
              </span>
              {nonNegTotal > 0 ? (
                <span className="flex items-center gap-1">
                  <span className="font-medium text-muted-foreground">
                    Non-negotiables
                  </span>
                  {allNonNegMet ? (
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      all met
                    </span>
                  ) : (
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      not all met
                    </span>
                  )}
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
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
              <div className="flex flex-wrap items-center gap-2">
                {application.resume_url ? (
                  <a
                    href={application.resume_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Resume
                    <ExternalLink className="size-3" />
                  </a>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 px-2 text-[11px]"
                  onClick={() => setIsProfileOpen(true)}
                  data-testid="candidate-view-profile"
                >
                  <Sparkles className="size-3" />
                  AI Analysis
                </Button>
                {!isRejected ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 px-2 text-[11px] border-destructive/40 text-destructive hover:bg-destructive/10"
                    onClick={() => {
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
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  className={cn(
                    'h-7 gap-1 px-2 text-[11px]',
                    canShortlistUi && canSendReachout
                      ? 'border-emerald-400/60 text-emerald-600 hover:bg-emerald-500/10 dark:border-emerald-500/40 dark:text-emerald-200'
                      : 'text-muted-foreground',
                  )}
                  onClick={onShortlist}
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
              </div>
            </div>
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
        </div>
      </CardContent>

      <CandidateProfileDialog
        application={application}
        job={job}
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
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
