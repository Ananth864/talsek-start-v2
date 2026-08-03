import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Filter } from 'lucide-react'
import { useJobApplications } from '#/hooks/use-job-applications'
import { useJobStages } from '#/hooks/use-job-stages'
import { useBulkActionMode } from '#/hooks/use-bulk-action-mode'
import { useBulkShortlist } from '#/hooks/use-bulk-shortlist'
import { useBulkReject } from '#/hooks/use-bulk-reject'
import { useShortlistActions } from '#/hooks/use-shortlist-actions'
import { useReachoutTemplates } from '#/hooks/use-reachout-templates'
import { useCandidateListView } from '#/hooks/use-candidate-list-view'
import { useCreditBalance, useServiceRates } from '#/hooks/use-billing'
import { nextStageForApplication } from '#/lib/candidate-stage-navigation'
import {
  FILTER_OPTIONS,
  filterCandidates,
} from '#/lib/candidate-filters'
import type { CandidateFilter } from '#/lib/candidate-filters'
import {
  hasConfiguredTemplate,
  templateKindForNextStage,
} from '#/lib/email-template-engine'
import { parsedSummary } from '#/lib/parsed-candidate'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { BulkActionConfirmBar } from '#/components/bulk/bulk-action-confirm-bar'
import { BulkActionDropdown } from '#/components/bulk/bulk-action-dropdown'
import { BulkShortlistDialog } from '#/components/bulk/bulk-shortlist-dialog'
import { BulkRejectDialog } from '#/components/bulk/bulk-reject-dialog'
import { InsufficientCreditsModal } from '#/components/billing/insufficient-credits-modal'
import { StageTabs } from './stage-tabs'
import { CandidateCard } from './candidate-card'
import { ShortlistConfirmationDialog } from './shortlist-confirmation-dialog'
import { ReachoutTemplateSetupDialog } from './reachout-template-setup-dialog'
import type { JobWithCompanyRow } from '#/server/fn/jobs'

type CandidatesListProps = {
  job: JobWithCompanyRow
  companyId: string | null
  userId: string | null
  canSendReachout: boolean
  activeStageId: string | undefined
  onStageChange: (stageId: string) => void
}

/**
 * The candidate pipeline board for a selected Job (ticket #6 read path + #8
 * card actions + #10 / #21 bulk Shortlist Reachout + bulk reject + #20 single
 * Shortlist Reachout + #26 adaptive card / grid-list preference). Ports the
 * source's `CandidatesList`.
 */
export function CandidatesList({
  job,
  companyId,
  userId,
  canSendReachout,
  activeStageId,
  onStageChange,
}: CandidatesListProps) {
  const { data: applications = [], isLoading, error } = useJobApplications(
    job.id,
    companyId,
  )
  const { data: stages = [] } = useJobStages(job.id, companyId)
  const { viewMode } = useCandidateListView(userId)
  const shortlist = useShortlistActions({
    job,
    stages,
    applications,
    companyId,
    canSendReachout,
  })
  const templatesQuery = useReachoutTemplates(companyId)
  const { balance: creditBalance, isLoading: creditsLoading } =
    useCreditBalance(companyId)
  const { data: serviceRates, isLoading: ratesLoading } =
    useServiceRates(companyId)
  const interviewCost = serviceRates?.screening_interview_cost ?? 40

  const [selectedFilter, setSelectedFilter] = useState<CandidateFilter>('all')
  const [isBulkShortlistOpen, setIsBulkShortlistOpen] = useState(false)
  const [isBulkRejectOpen, setIsBulkRejectOpen] = useState(false)
  const [isBulkTemplateSetupOpen, setIsBulkTemplateSetupOpen] = useState(false)
  const [bulkSubject, setBulkSubject] = useState('')
  const [bulkBody, setBulkBody] = useState('')
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [bulkCreditsGate, setBulkCreditsGate] = useState<{
    required: number
  } | null>(null)
  const bulkShortlist = useBulkShortlist()
  const bulkReject = useBulkReject()

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

  // Stage → fit/status (source `useInfiniteCandidatesByStage` order).
  const visible = useMemo(() => {
    const inStage = applications.filter(
      (app) => app.current_stage_id === effectiveStageId,
    )
    return filterCandidates(inStage, selectedFilter, job)
  }, [applications, effectiveStageId, selectedFilter, job])

  const visibleIds = useMemo(() => visible.map((a) => a.id), [visible])
  const bulkState = useBulkActionMode(visibleIds)

  const nextStage = useMemo(() => {
    const sample = visible.at(0)
    if (sample) return nextStageForApplication(sample, stages)
    const currentIndex = stages.findIndex((s) => s.id === effectiveStageId)
    if (currentIndex < 0 || currentIndex >= stages.length - 1) return null
    const next = stages[currentIndex + 1]
    return { id: next.id, name: next.hiring_stage.name || 'Next Stage' }
  }, [visible, stages, effectiveStageId])

  const currentStageLabel =
    stages.find((s) => s.id === effectiveStageId)?.hiring_stage.name ||
    'Current Stage'

  const bulkTemplateType = templateKindForNextStage(nextStage?.name)

  const handleToggleSelectAll = () => {
    if (bulkState.isAllSelected) bulkState.clearSelection()
    else bulkState.selectAll(visibleIds)
  }

  const openBulkShortlistDialog = async () => {
    let data = templatesQuery.data
    if (!data) {
      const refreshed = await templatesQuery.refetch()
      data = refreshed.data
    }
    const configured =
      bulkTemplateType === 'interview'
        ? Boolean(data?.hasInterviewTemplate)
        : Boolean(data?.hasReachoutTemplate)
    const template =
      bulkTemplateType === 'interview' ? data?.interview : data?.reachout

    if (!configured || !template || !hasConfiguredTemplate(template)) {
      setIsBulkTemplateSetupOpen(true)
      return
    }

    setBulkSubject(template.subject)
    setBulkBody(template.body)
    setIsBulkShortlistOpen(true)
  }

  const handleBulkConfirmClick = () => {
    setBulkError(null)

    if (bulkState.mode === 'selecting-reject') {
      setIsBulkRejectOpen(true)
      return
    }

    if (!canSendReachout) {
      setBulkError(
        'You do not have permission to shortlist candidates. Ask a company admin to grant Send Reachouts.',
      )
      return
    }
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
    if (bulkTemplateType === 'interview') {
      // Wait until balance/rates are known — never skip the paid-action gate.
      if (creditsLoading || ratesLoading) return
      const totalCost = interviewCost * bulkState.selectedCount
      if (creditBalance < totalCost) {
        setBulkCreditsGate({ required: totalCost })
        return
      }
    }

    void openBulkShortlistDialog()
  }

  const handleBulkTemplateSaved = async () => {
    setIsBulkTemplateSetupOpen(false)
    const refreshed = await templatesQuery.refetch()
    const data = refreshed.data
    const template =
      bulkTemplateType === 'interview' ? data?.interview : data?.reachout
    if (!template || !hasConfiguredTemplate(template)) return
    setBulkSubject(template.subject)
    setBulkBody(template.body)
    setIsBulkShortlistOpen(true)
  }

  const handleBulkShortlistConfirm = () => {
    if (!nextStage) return
    if (!canSendReachout) {
      setBulkError(
        'You do not have permission to shortlist candidates. Ask a company admin to grant Send Reachouts.',
      )
      setIsBulkShortlistOpen(false)
      return
    }
    if (
      bulkTemplateType === 'interview' &&
      !bulkBody.includes('{{interview_link}}')
    ) {
      setBulkError(
        'Interview template must include {{interview_link}} variable. Please add it back to the message.',
      )
      return
    }

    setBulkError(null)
    bulkShortlist.mutate(
      {
        jobId: job.id,
        applicationIds: Array.from(bulkState.selectedIds),
        targetStageId: nextStage.id,
        templateType: bulkTemplateType,
        customMessage: {
          subject: bulkSubject,
          body: bulkBody,
        },
        origin:
          typeof window !== 'undefined' ? window.location.origin : undefined,
      },
      {
        onSuccess: (result) => {
          setIsBulkShortlistOpen(false)
          if (result.failed.length > 0 && result.succeeded.length === 0) {
            setBulkError(
              result.failed[0]?.error ?? 'Failed to shortlist candidates',
            )
          } else {
            bulkState.exitMode()
            if (result.failed.length > 0) {
              setBulkError(
                `Shortlisted ${result.succeeded.length}, ${result.failed.length} failed: ${result.failed[0]?.error ?? 'unknown error'}`,
              )
            }
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

  const handleBulkRejectConfirm = () => {
    setBulkError(null)
    bulkReject.mutate(
      {
        jobId: job.id,
        applicationIds: Array.from(bulkState.selectedIds),
      },
      {
        onSuccess: (result) => {
          setIsBulkRejectOpen(false)
          if (result.failed.length > 0 && result.succeeded.length === 0) {
            setBulkError(
              result.failed[0]?.error ?? 'Failed to reject candidates',
            )
          } else {
            bulkState.exitMode()
            if (result.failed.length > 0) {
              setBulkError(
                `Rejected ${result.succeeded.length}, ${result.failed.length} failed: ${result.failed[0]?.error ?? 'unknown error'}`,
              )
            }
          }
        },
        onError: (err) => {
          setBulkError(
            err instanceof Error ? err.message : 'Bulk reject failed',
          )
        },
      },
    )
  }

  const shortlistCandidateName = shortlist.application
    ? shortlist.application.candidate_name ||
      parsedSummary(shortlist.application.parsed_candidate_data).name ||
      shortlist.application.candidate.email ||
      'Candidate'
    : 'Candidate'

  const bulkPending = bulkShortlist.isPending || bulkReject.isPending
  const insufficientCreditsOpen =
    shortlist.isInsufficientCreditsModalOpen || !!bulkCreditsGate
  const insufficientCreditsRequired =
    bulkCreditsGate?.required ?? shortlist.interviewCost
  const insufficientCreditsDescription = bulkCreditsGate
    ? 'bulk interview shortlisting'
    : 'scheduling an interview'

  const closeInsufficientCredits = () => {
    shortlist.setIsInsufficientCreditsModalOpen(false)
    setBulkCreditsGate(null)
  }

  return (
    <div
      data-testid="candidates-list"
      data-shortlist-active={shortlist.activeApplicationId ?? ''}
      data-shortlist-modal={
        shortlist.isShortlistModalOpen
          ? 'confirm'
          : shortlist.isTemplateModalOpen
            ? 'setup'
            : ''
      }
      data-can-send-reachout={canSendReachout ? 'true' : 'false'}
      className="flex flex-1 flex-col overflow-hidden"
    >
      <div
        data-testid="candidates-board-header"
        className="flex-shrink-0 overflow-hidden border-b border-border px-6 py-4"
      >
        <div className="flex items-center justify-between gap-4 overflow-hidden">
          <div className="min-w-0 flex-1">
            {stages.length > 0 ? (
              <StageTabs
                stages={stages}
                counts={counts}
                activeStageId={effectiveStageId}
                onSelect={onStageChange}
                disabled={bulkState.isBulkMode}
                className="w-full"
              />
            ) : (
              <div className="flex h-10 items-center text-sm italic text-muted-foreground">
                No stages configured
              </div>
            )}
          </div>

          <div className="relative flex shrink-0 items-center gap-2">
            {bulkState.isBulkMode ? (
              <BulkActionConfirmBar
                mode={bulkState.mode}
                selectedCount={bulkState.selectedCount}
                isAllSelected={bulkState.isAllSelected}
                onCancel={bulkState.exitMode}
                onToggleSelectAll={handleToggleSelectAll}
                onConfirm={handleBulkConfirmClick}
                confirmDisabled={
                  bulkPending ||
                  (bulkState.mode === 'selecting-shortlist' && !nextStage)
                }
              />
            ) : (
              <BulkActionDropdown
                onSelectShortlist={() => bulkState.enterMode('shortlist')}
                onSelectReject={() => bulkState.enterMode('reject')}
                disableShortlist={!nextStage}
                disableReject={!nextStage}
                canSendReachout={canSendReachout}
              />
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 shrink-0 gap-2"
                  disabled={bulkState.isBulkMode}
                  data-testid="fit-filter"
                  data-filter={selectedFilter}
                  aria-label="Filter candidates by fit"
                >
                  <Filter className="size-4 md:hidden" />
                  <span className="hidden font-semibold md:inline">Filter</span>
                  <ChevronDown className="size-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {FILTER_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onSelect={() => setSelectedFilter(option.value)}
                    className={
                      selectedFilter === option.value
                        ? 'cursor-pointer bg-accent text-accent-foreground'
                        : 'cursor-pointer'
                    }
                    data-testid={`fit-filter-${option.value}`}
                    data-selected={
                      selectedFilter === option.value ? 'true' : 'false'
                    }
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">{option.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {bulkError ? (
        <p className="px-6 py-2 text-xs text-destructive" role="alert">
          {bulkError}
        </p>
      ) : null}

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
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
            {selectedFilter !== 'all'
              ? 'No candidates match this filter.'
              : 'No candidates in this stage.'}
          </p>
        ) : (
          <ul
            data-testid="candidate-cards"
            data-layout={viewMode}
            className={
              viewMode === 'grid'
                ? 'grid gap-4'
                : 'flex flex-col gap-4'
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
            {visible.map((app) => (
              <li key={app.id} className={viewMode === 'grid' ? 'min-h-0' : undefined}>
                <CandidateCard
                  application={app}
                  job={job}
                  stages={stages}
                  layout={viewMode}
                  canSendReachout={canSendReachout}
                  isShortlisting={shortlist.shortlistingId === app.id}
                  shortlistError={shortlist.actionErrorFor(app.id)}
                  onShortlist={() => void shortlist.handleShortlistClick(app.id)}
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

      <ReachoutTemplateSetupDialog
        open={shortlist.isTemplateModalOpen || isBulkTemplateSetupOpen}
        onOpenChange={(open) => {
          if (!open) {
            shortlist.setIsTemplateModalOpen(false)
            setIsBulkTemplateSetupOpen(false)
          }
        }}
        kind={
          isBulkTemplateSetupOpen
            ? bulkTemplateType
            : shortlist.templateType
        }
        template={
          (isBulkTemplateSetupOpen
            ? bulkTemplateType
            : shortlist.templateType) === 'interview'
            ? shortlist.interviewTemplate
            : shortlist.finalTemplate
        }
        onSave={shortlist.saveTemplate}
        onSaved={() => {
          if (isBulkTemplateSetupOpen) {
            void handleBulkTemplateSaved()
          } else {
            void shortlist.handleTemplateSaved()
          }
        }}
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

      <BulkShortlistDialog
        open={isBulkShortlistOpen}
        onOpenChange={setIsBulkShortlistOpen}
        candidateCount={bulkState.selectedCount}
        currentStage={currentStageLabel}
        nextStage={nextStage?.name}
        messageSubject={bulkSubject}
        messageBody={bulkBody}
        onSubjectChange={setBulkSubject}
        onBodyChange={setBulkBody}
        onConfirm={handleBulkShortlistConfirm}
        isLoading={bulkShortlist.isPending}
        requireInterviewLink={bulkTemplateType === 'interview'}
      />

      <BulkRejectDialog
        open={isBulkRejectOpen}
        onOpenChange={setIsBulkRejectOpen}
        candidateCount={bulkState.selectedCount}
        onConfirm={handleBulkRejectConfirm}
        isLoading={bulkReject.isPending}
      />

      <InsufficientCreditsModal
        isOpen={insufficientCreditsOpen}
        onClose={closeInsufficientCredits}
        currentBalance={shortlist.creditBalance}
        requiredCredits={insufficientCreditsRequired}
        actionDescription={insufficientCreditsDescription}
      />
    </div>
  )
}
