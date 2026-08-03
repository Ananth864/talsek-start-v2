import { useCallback, useMemo, useState } from 'react'
import {
  useReachoutTemplates,
  useSaveReachoutTemplate,
} from '#/hooks/use-reachout-templates'
import { useCreditBalance, useServiceRates } from '#/hooks/use-billing'
import { useShortlistJobApplication } from '#/hooks/use-shortlist-job-application'
import {
  generatePersonalizedEmail,
  hasConfiguredTemplate,
  templateKindForNextStage,
} from '#/lib/email-template-engine'
import {
  currentStageName,
  nextStageForApplication,
} from '#/lib/candidate-stage-navigation'
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
 * Board-level Shortlist flow (source `useShortlistActions`). Dialog state lives
 * here — not on each CandidateCard — so Realtime/refetch remounts do not clear
 * the confirm / template-setup modals mid-flow.
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
  const interviewCost = serviceRates?.screening_interview_cost ?? 40

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

  const openConfirmFor = useCallback(
    (app: JobApplicationRow, subject: string, body: string) => {
      setActiveApplicationId(app.id)
      setMessageSubject(subject)
      setMessageBody(body)
      setIsShortlistModalOpen(true)
    },
    [],
  )

  const handleShortlistClick = useCallback(
    async (applicationId: string) => {
      clearErrorFor(applicationId)
      const app = applications.find((a) => a.id === applicationId)
      if (!app) {
        setErrorFor(applicationId, 'Candidate is no longer on the board.')
        return
      }

      if (!canSendReachout) {
        setErrorFor(
          applicationId,
          'You do not have permission to shortlist candidates. Ask a company admin to grant Send Reachouts.',
        )
        return
      }

      const target = nextStageForApplication(app, stages)
      if (!target || app.status === 'rejected') {
        setErrorFor(
          applicationId,
          app.status === 'rejected'
            ? 'Rejected candidates cannot be shortlisted'
            : 'This candidate is already at the final stage.',
        )
        return
      }

      const kind = templateKindForNextStage(target.name)
      if (kind === 'interview') {
        // Wait until balance/rates are known — never skip the paid-action gate.
        if (creditsLoading || ratesLoading) return
        if (creditBalance < interviewCost) {
          setIsInsufficientCreditsModalOpen(true)
          return
        }
      }

      setActiveApplicationId(applicationId)
      setPreparingId(applicationId)
      try {
        let data = templatesQuery.data
        if (!data) {
          const refreshed = await templatesQuery.refetch()
          data = refreshed.data
        }
        const configured =
          kind === 'interview'
            ? Boolean(data?.hasInterviewTemplate)
            : Boolean(data?.hasReachoutTemplate)

        if (!configured) {
          setIsTemplateModalOpen(true)
          return
        }

        const template =
          kind === 'interview' ? data?.interview : data?.reachout
        if (!template || !hasConfiguredTemplate(template)) {
          setIsTemplateModalOpen(true)
          return
        }

        const { subject, body } = generatePersonalizedEmail(
          template,
          {
            candidate_name: app.candidate_name,
            candidate_email: app.candidate.email,
            match_score: app.match_score,
            parsed_candidate_data: app.parsed_candidate_data,
          },
          {
            title: job.title,
            location: job.location,
            company_name: job.companies.name,
          },
        )
        openConfirmFor(app, subject, body)
      } catch (err) {
        setErrorFor(
          applicationId,
          err instanceof Error
            ? err.message
            : 'Failed to prepare Reachout. Please try again.',
        )
      } finally {
        setPreparingId((current) =>
          current === applicationId ? null : current,
        )
      }
    },
    [
      applications,
      canSendReachout,
      stages,
      creditsLoading,
      ratesLoading,
      creditBalance,
      interviewCost,
      templatesQuery,
      job,
      clearErrorFor,
      setErrorFor,
      openConfirmFor,
    ],
  )

  const handleTemplateSaved = useCallback(async () => {
    setIsTemplateModalOpen(false)
    if (!activeApplicationId) return
    const app = applications.find((a) => a.id === activeApplicationId)
    if (!app) return

    const refreshed = await templatesQuery.refetch()
    const data = refreshed.data
    const target = nextStageForApplication(app, stages)
    const kind = templateKindForNextStage(target?.name)
    const template =
      kind === 'interview' ? data?.interview : data?.reachout
    if (!template || !hasConfiguredTemplate(template)) return

    const { subject, body } = generatePersonalizedEmail(
      template,
      {
        candidate_name: app.candidate_name,
        candidate_email: app.candidate.email,
        match_score: app.match_score,
        parsed_candidate_data: app.parsed_candidate_data,
      },
      {
        title: job.title,
        location: job.location,
        company_name: job.companies.name,
      },
    )
    openConfirmFor(app, subject, body)
  }, [
    activeApplicationId,
    applications,
    templatesQuery,
    stages,
    job,
    openConfirmFor,
  ])

  const handleShortlistConfirm = useCallback(() => {
    if (!application || !nextStage) return
    if (!canSendReachout) {
      setErrorFor(
        application.id,
        'You do not have permission to shortlist candidates. Ask a company admin to grant Send Reachouts.',
      )
      setIsShortlistModalOpen(false)
      return
    }
    if (
      templateType === 'interview' &&
      !messageBody.includes('{{interview_link}}')
    ) {
      setErrorFor(
        application.id,
        'Interview template must include {{interview_link}} variable. Please add it back to the message.',
      )
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
          setErrorFor(
            application.id,
            err instanceof Error
              ? err.message
              : 'Failed to shortlist candidate',
          )
        },
      },
    )
  }, [
    application,
    nextStage,
    canSendReachout,
    templateType,
    messageBody,
    messageSubject,
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
