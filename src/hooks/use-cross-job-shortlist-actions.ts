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

type UseCrossJobShortlistActionsParams = {
  applications: JobApplicationRow[]
  jobsById: Map<string, JobWithCompanyRow>
  stagesByJobId: Map<string, JobStageRow[]>
  companyId: string | null
  canSendReachout: boolean
}

/**
 * Shortlist flow for the cross-job Candidates page — same Reachout confirm /
 * template-setup / credits gate as `useShortlistActions`, but resolves Job +
 * Job Stages per Job Application.
 */
export function useCrossJobShortlistActions({
  applications,
  jobsById,
  stagesByJobId,
  companyId,
  canSendReachout,
}: UseCrossJobShortlistActionsParams) {
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

  const job = application ? (jobsById.get(application.job_id) ?? null) : null
  const stages = application
    ? (stagesByJobId.get(application.job_id) ?? [])
    : []
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
        setErrorFor(applicationId, 'Candidate is no longer in the results.')
        return
      }

      const appJob = jobsById.get(app.job_id)
      if (!appJob) {
        setErrorFor(applicationId, 'Could not resolve this candidate’s Job.')
        return
      }

      if (!canSendReachout) {
        setErrorFor(
          applicationId,
          'You do not have permission to shortlist candidates. Ask a company admin to grant Send Reachouts.',
        )
        return
      }

      const appStages = stagesByJobId.get(app.job_id) ?? []
      const target = nextStageForApplication(app, appStages)
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
            title: appJob.title,
            location: appJob.location,
            company_name: appJob.companies.name,
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
      jobsById,
      stagesByJobId,
      canSendReachout,
      creditsLoading,
      ratesLoading,
      creditBalance,
      interviewCost,
      templatesQuery,
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
    const appJob = jobsById.get(app.job_id)
    if (!appJob) return

    const refreshed = await templatesQuery.refetch()
    const data = refreshed.data
    const appStages = stagesByJobId.get(app.job_id) ?? []
    const target = nextStageForApplication(app, appStages)
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
        title: appJob.title,
        location: appJob.location,
        company_name: appJob.companies.name,
      },
    )
    openConfirmFor(app, subject, body)
  }, [
    activeApplicationId,
    applications,
    jobsById,
    stagesByJobId,
    templatesQuery,
    openConfirmFor,
  ])

  const handleShortlistConfirm = useCallback(() => {
    if (!application || !nextStage || !job) return
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
    job,
    canSendReachout,
    templateType,
    messageBody,
    messageSubject,
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
