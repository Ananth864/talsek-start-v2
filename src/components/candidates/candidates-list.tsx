import { useEffect, useMemo, useState } from 'react'
import { Filter, Search, Users, XCircle } from 'lucide-react'
import { useJobApplications } from '#/hooks/use-job-applications'
import { useJobStages } from '#/hooks/use-job-stages'
import { useBulkActionMode } from '#/hooks/use-bulk-action-mode'
import { useBulkShortlist } from '#/hooks/use-bulk-shortlist'
import { useBulkReject } from '#/hooks/use-bulk-reject'
import { useShortlistActions } from '#/hooks/use-shortlist-actions'
import { useReachoutTemplates } from '#/hooks/use-reachout-templates'
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
import { Input } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { BulkActionConfirmBar } from '#/components/bulk/bulk-action-confirm-bar'
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
  canSendReachout: boolean
  activeStageId: string | undefined
  onStageChange: (stageId: string) => void
}

/**
 * The candidate pipeline board for a selected Job (ticket #6 read path + #8
 * card actions + #10 / #21 bulk Shortlist Reachout + bulk reject + #20 single
 * Shortlist Reachout). Ports the source's `CandidatesList`.
 */
export function CandidatesList({
  job,
  companyId,
  canSendReachout,
  activeStageId,
  onStageChange,
}: CandidatesListProps) {
  const { data: applications = [], isLoading, error } = useJobApplications(
    job.id,
    companyId,
  )
  const { data: stages = [] } = useJobStages(job.id, companyId)
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

  const [search, setSearch] = useState('')
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

  // Stage → fit/status → search (source `useInfiniteCandidatesByStage` order).
  const visible = useMemo(() => {
    const inStage = applications.filter(
      (app) => app.current_stage_id === effectiveStageId,
    )
    let rows = filterCandidates(inStage, selectedFilter, job)
    const term = search.trim().toLowerCase()
    if (term) {
      rows = rows.filter((app) => {
        const name = app.candidate_name.toLowerCase()
        const email = app.candidate.email.toLowerCase()
        return name.includes(term) || email.includes(term)
      })
    }
    return rows
  }, [applications, effectiveStageId, selectedFilter, job, search])

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

  const activeCount = applications.filter((a) => a.status === 'active').length
  const rejectedCount = applications.filter(
    (a) => a.status === 'rejected',
  ).length

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
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => bulkState.enterMode('shortlist')}
                disabled={!nextStage || visible.length === 0 || !canSendReachout}
                data-testid="bulk-shortlist-enter"
                data-can-send-reachout={canSendReachout ? 'true' : 'false'}
                title={
                  !canSendReachout
                    ? 'You do not have permission to send Reachouts'
                    : nextStage
                      ? 'Select candidates to shortlist to the next stage'
                      : 'Not available on last stage'
                }
              >
                <Users className="size-3.5" />
                Bulk shortlist
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => bulkState.enterMode('reject')}
                disabled={visible.length === 0}
                data-testid="bulk-reject-enter"
                title="Select candidates to reject"
              >
                <XCircle className="size-3.5" />
                Bulk reject
              </Button>
            </>
          )}
          <Select
            value={selectedFilter}
            onValueChange={(value) =>
              setSelectedFilter(value as CandidateFilter)
            }
            disabled={bulkState.isBulkMode}
          >
            <SelectTrigger
              size="sm"
              className="h-8 gap-1.5"
              data-testid="fit-filter"
              aria-label="Filter candidates by fit"
            >
              <Filter className="size-3.5" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent align="end" className="w-64">
              {FILTER_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  title={option.description}
                  data-testid={`fit-filter-${option.value}`}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative w-full max-w-[220px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search candidates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
              aria-label="Search candidates"
              data-testid="candidate-search"
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
            {search.trim() || selectedFilter !== 'all'
              ? 'No candidates match this filter.'
              : 'No candidates in this stage.'}
          </p>
        ) : (
          <ul data-testid="candidate-cards" className="flex flex-col gap-2">
            {visible.map((app) => (
              <li key={app.id}>
                <CandidateCard
                  application={app}
                  job={job}
                  stages={stages}
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
