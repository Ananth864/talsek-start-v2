import { useCallback, useMemo, useState } from 'react'
import {
  useReachoutTemplates,
  useSaveReachoutTemplate,
} from '#/hooks/use-reachout-templates'
import { useCreditBalance, useServiceRates } from '#/hooks/use-billing'
import { useShortlistJobApplication } from '#/hooks/use-shortlist-job-application'
import {
  currentStageName,
  nextStageForApplication,
} from '#/lib/candidate-stage-navigation'
import { templateKindForNextStage } from '#/lib/email-template-engine'
import {
  DEFAULT_INTERVIEW_COST,
  describeShortlistPrepareError,
  describeShortlistSendError,
  prepareShortlist,
  validateShortlistConfirmation,
} from '#/lib/shortlist-preparation'
import type {
  ShortlistDecision,
  ShortlistTemplatesSnapshot,
} from '#/lib/shortlist-preparation'
import type {
  JobApplicationRow,
  JobStageRow,
} from '#/server/fn/job-applications'
import type { JobWithCompanyRow } from '#/server/fn/jobs'
import type { TemplateKind } from '#/lib/reachout-template-shared'

type UseShortlistActionsParams = {
  job: JobWithCompanyRow
  stages: JobStageRow[]
  applications: JobApplicationRow[]
  companyId: string | null
  canSendReachout: boolean
}

/**
 * Board-level Shortlist flow for the Candidate board. Dialog state lives here
 * — not on each CandidateCard — so Realtime/refetch remounts do not clear the
 * confirm / template-setup modals mid-flow.
 *
 * All preparation policy (permission, credits, Reachout Template readiness,
 * personalization, interview-link requirements, editable confirmation, and
 * send-outcome copy) is owned by `src/lib/shortlist-preparation.ts`; this
 * hook is the thin React state + mutation wrapper that translates the
 * module's decisions into state effects.
 */
export function useShortlistActions({
  job,
  stages,
  applications,
  companyId,
  canSendReachout,
}: UseShortlistActionsParams) {
  const [activeApplicationId, setActiveApplicationId] = useState<string | null>(
    null,
  )
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [isShortlistModalOpen, setIsShortlistModalOpen] = useState(false)
  const [messageSubject, setMessageSubject] = useState('')
  const [messageBody, setMessageBody] = useState('')
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({})
  const [preparingId, setPreparingId] = useState<string | null>(null)
  const [isInsufficientCreditsModalOpen, setIsInsufficientCreditsModalOpen] =
    useState(false)

  const templatesQuery = useReachoutTemplates(companyId)
  const saveTemplate = useSaveReachoutTemplate(companyId)
  const shortlist = useShortlistJobApplication()
  const { balance: creditBalance, isLoading: creditsLoading } =
    useCreditBalance(companyId)
  const { data: serviceRates, isLoading: ratesLoading } =
    useServiceRates(companyId)
  const interviewCost = serviceRates?.screening_interview_cost ?? DEFAULT_INTERVIEW_COST

  const application = useMemo(
    () =>
      activeApplicationId
        ? (applications.find((a) => a.id === activeApplicationId) ?? null)
        : null,
    [applications, activeApplicationId],
  )

  const nextStage = application
    ? nextStageForApplication(application, stages)
    : null
  const templateType: TemplateKind = templateKindForNextStage(nextStage?.name)

  const finalTemplate = templatesQuery.data?.reachout ?? null
  const interviewTemplate = templatesQuery.data?.interview ?? null

  const setErrorFor = useCallback((applicationId: string, message: string) => {
    setActionErrors((prev) => ({ ...prev, [applicationId]: message }))
  }, [])

  const clearErrorFor = useCallback((applicationId: string) => {
    setActionErrors((prev) => {
      if (!(applicationId in prev)) return prev
      const next = { ...prev }
      delete next[applicationId]
      return next
    })
  }, [])

  /**
   * Resolve a preparation decision for an application against the current
   * billing/template/job context. `templates` is a parameter (not captured)
   * so the caller can substitute the freshly-refetched snapshot after a
   * `templates-not-loaded` signal.
   */
  const resolvePreparation = useCallback(
    (
      app: JobApplicationRow | null,
      templates: ShortlistTemplatesSnapshot | null,
    ): ShortlistDecision =>
      prepareShortlist({
        application: app,
        job,
        stages,
        canSendReachout,
        templates,
        creditBalance,
        interviewCost,
        creditsLoading,
        ratesLoading,
      }),
    [
      job,
      stages,
      canSendReachout,
      creditBalance,
      interviewCost,
      creditsLoading,
      ratesLoading,
    ],
  )

  /**
   * Translate a preparation decision into React state effects. The deep
   * module owns the policy and copy; this is the mechanical State bridge.
   */
  const applyDecision = useCallback(
    (decision: ShortlistDecision, applicationId: string) => {
      switch (decision.kind) {
        case 'open-confirm':
          setActiveApplicationId(applicationId)
          setMessageSubject(decision.personalized.subject)
          setMessageBody(decision.personalized.body)
          setIsShortlistModalOpen(true)
          break
        case 'open-template-setup':
          setActiveApplicationId(applicationId)
          setIsTemplateModalOpen(true)
          break
        case 'block-insufficient-credits':
          setIsInsufficientCreditsModalOpen(true)
          break
        case 'application-missing':
        case 'job-missing':
        case 'block-permission':
        case 'block-rejected':
        case 'block-final-stage':
          setErrorFor(applicationId, decision.message)
          break
        case 'wait-credits-loading':
        case 'templates-not-loaded':
          break
      }
    },
    [setErrorFor],
  )

  const handleShortlistClick = useCallback(
    async (applicationId: string) => {
      clearErrorFor(applicationId)
      const app = applications.find((a) => a.id === applicationId) ?? null

      // First resolution uses the current (possibly null) Templates snapshot.
      // The credits gate runs before any Templates fetch, so a loading billing
      // state returns `wait-credits-loading` without touching Templates.
      let decision = resolvePreparation(app, templatesQuery.data ?? null)

      if (decision.kind === 'templates-not-loaded') {
        // Past the permission/stage/credits gates; load Templates then
        // re-resolve. `activeApplicationId` is set before the await so the
        // confirm/template-setup modals survive Realtime card remounts that
        // may land while the fetch is in flight.
        setActiveApplicationId(applicationId)
        setPreparingId(applicationId)
        try {
          const refreshed = await templatesQuery.refetch()
          decision = resolvePreparation(app, refreshed.data ?? null)
        } catch (err) {
          setErrorFor(applicationId, describeShortlistPrepareError(err))
          return
        } finally {
          setPreparingId((current) =>
            current === applicationId ? null : current,
          )
        }
      }

      applyDecision(decision, applicationId)
    },
    [
      applications,
      templatesQuery,
      resolvePreparation,
      applyDecision,
      clearErrorFor,
      setErrorFor,
    ],
  )

  const handleTemplateSaved = useCallback(async () => {
    setIsTemplateModalOpen(false)
    if (!activeApplicationId) return
    const app = applications.find((a) => a.id === activeApplicationId) ?? null
    if (!app) return

    const refreshed = await templatesQuery.refetch()
    // Re-run the full preparation gate against the freshly-saved template and
    // route the outcome through the same State bridge as the click handler.
    // This surfaces concurrent changes (e.g. a credit drain mid-setup opens
    // the Insufficient Credits modal) instead of silently dropping the flow.
    const decision = resolvePreparation(app, refreshed.data ?? null)
    applyDecision(decision, app.id)
  }, [
    activeApplicationId,
    applications,
    templatesQuery,
    resolvePreparation,
    applyDecision,
  ])

  const handleShortlistConfirm = useCallback(() => {
    if (!application || !nextStage) return
    const decision = validateShortlistConfirmation({
      canSendReachout,
      templateType,
      body: messageBody,
    })
    if (decision.kind !== 'valid') {
      setErrorFor(application.id, decision.message)
      if (decision.kind === 'block-permission') setIsShortlistModalOpen(false)
      return
    }

    clearErrorFor(application.id)
    shortlist.mutate(
      {
        applicationId: application.id,
        jobId: job.id,
        targetStageId: nextStage.id,
        templateType,
        customMessage: {
          subject: messageSubject,
          body: messageBody,
        },
        origin:
          typeof window !== 'undefined' ? window.location.origin : undefined,
      },
      {
        onSuccess: () => {
          setIsShortlistModalOpen(false)
          setActiveApplicationId(null)
        },
        onError: (err) => {
          setErrorFor(application.id, describeShortlistSendError(err))
        },
      },
    )
  }, [
    application,
    nextStage,
    canSendReachout,
    templateType,
    messageSubject,
    messageBody,
    job.id,
    shortlist,
    setErrorFor,
    clearErrorFor,
  ])

  return {
    canSendReachout,
    application,
    nextStage,
    currentStageLabel: application ? currentStageName(application) : '',
    templateType,
    isTemplateModalOpen,
    setIsTemplateModalOpen,
    isShortlistModalOpen,
    setIsShortlistModalOpen,
    isInsufficientCreditsModalOpen,
    setIsInsufficientCreditsModalOpen,
    creditBalance,
    interviewCost,
    messageSubject,
    setMessageSubject,
    messageBody,
    setMessageBody,
    finalTemplate,
    interviewTemplate,
    saveTemplate,
    handleShortlistClick,
    handleShortlistConfirm,
    handleTemplateSaved,
    isSending: shortlist.isPending,
    preparingId,
    shortlistingId: shortlist.isPending
      ? shortlist.variables.applicationId
      : preparingId,
    activeApplicationId,
    actionErrorFor: (applicationId: string) =>
      actionErrors[applicationId] ?? null,
  }
}
