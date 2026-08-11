import { useCallback, useState } from 'react'
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
  ShortlistJobInput,
  ShortlistSurface,
  ShortlistTemplatesSnapshot,
} from '#/lib/shortlist-preparation'
import type {
  JobApplicationRow,
  JobStageRow,
} from '#/server/fn/job-applications'

/**
 * Surface-specific Job + Stages resolution. Board returns a fixed Job/Stages
 * set; cross-Job looks them up per application. `surface` selects
 * application-missing copy.
 */
export type ShortlistJobContext = {
  job: ShortlistJobInput | null
  stages: JobStageRow[]
  surface: ShortlistSurface
}

type UseShortlistFlowParams = {
  companyId: string | null
  canSendReachout: boolean
  applications: JobApplicationRow[]
  resolveJobContext: (
    application: JobApplicationRow | null,
  ) => ShortlistJobContext
}

/**
 * Shared React state + mutation bridge for single-application Shortlist.
 * Policy decisions live in `shortlist-preparation.ts`; board and cross-Job
 * hooks only differ in Job/Stages resolution via `resolveJobContext`.
 *
 * Dialog state lives here — not on each CandidateCard — so Realtime/refetch
 * remounts do not clear the confirm / template-setup modals mid-flow.
 */
export function useShortlistFlow({
  companyId,
  canSendReachout,
  applications,
  resolveJobContext,
}: UseShortlistFlowParams) {
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
  const interviewCost =
    serviceRates?.screening_interview_cost ?? DEFAULT_INTERVIEW_COST

  const application = activeApplicationId
    ? (applications.find((a) => a.id === activeApplicationId) ?? null)
    : null
  const activeJobContext = resolveJobContext(application)
  const nextStage = application
    ? nextStageForApplication(application, activeJobContext.stages)
    : null
  const templateType = templateKindForNextStage(nextStage?.name)

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

  const resolvePreparation = useCallback(
    (
      app: JobApplicationRow | null,
      templates: ShortlistTemplatesSnapshot | null,
    ) => {
      const { job, stages, surface } = resolveJobContext(app)
      return prepareShortlist({
        application: app,
        job,
        stages,
        canSendReachout,
        templates,
        creditBalance,
        interviewCost,
        creditsLoading,
        ratesLoading,
        surface,
      })
    },
    [
      resolveJobContext,
      canSendReachout,
      creditBalance,
      interviewCost,
      creditsLoading,
      ratesLoading,
    ],
  )

  const applyDecision = useCallback(
    (
      decision: ReturnType<typeof prepareShortlist>,
      applicationId: string,
    ) => {
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

    try {
      const refreshed = await templatesQuery.refetch()
      // Re-run the full preparation gate against the freshly-saved template and
      // route the outcome through the same State bridge as the click handler.
      const decision = resolvePreparation(app, refreshed.data ?? null)
      applyDecision(decision, app.id)
    } catch (err) {
      setErrorFor(app.id, describeShortlistPrepareError(err))
    }
  }, [
    activeApplicationId,
    applications,
    templatesQuery,
    resolvePreparation,
    applyDecision,
    setErrorFor,
  ])

  const handleShortlistConfirm = useCallback(() => {
    if (!application || !nextStage) return
    const { job } = resolveJobContext(application)
    if (!job) return

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
    resolveJobContext,
    canSendReachout,
    templateType,
    messageSubject,
    messageBody,
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
