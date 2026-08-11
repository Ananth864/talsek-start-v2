/**
 * Deep Shortlist preparation module — owns the Member-facing preparation
 * policy for Shortlisting: permission, credits, Reachout Template readiness,
 * personalization (single) / template-with-placeholders (bulk), interview-link
 * requirements, editable confirmation validation, and send-outcome copy.
 *
 * Pure (no React, no network). Three React adapters delegate every policy
 * decision here: the board-level single-app hook (`useShortlistActions`), the
 * cross-Job Candidates search hook (`useCrossJobShortlistActions`, #45), and the
 * bulk path in `CandidatesList` (#44). Each differs only in its Job/Stages
 * resolution strategy; the gate policy and copy are single-sourced here.
 *
 * The server-side Reachout send-and-advance paths (`sendReachoutAndAdvance` /
 * `shortlistJobApplication` / `bulkShortlistJobApplications`) remain
 * authoritative for delivery, Interview Session creation, persistence, and Job
 * Stage advancement (ADR-0023 / ADR-0024). This module is the Member-facing UX
 * gate only; the server functions re-check `canSendReachout` and template
 * validity authoritatively.
 */
import {
  generatePersonalizedEmail,
  hasConfiguredTemplate,
  templateKindForNextStage,
} from '#/lib/email-template-engine'
import { nextStageForApplication } from '#/lib/candidate-stage-navigation'
import type { StageInfo } from '#/lib/candidate-stage-navigation'
import type { PersonalizedEmail } from '#/lib/email-template-engine'
import type {
  ReachoutTemplate,
  TemplateKind,
} from '#/lib/reachout-template-shared'
import type {
  JobApplicationRow,
  JobStageRow,
} from '#/server/fn/job-applications'
import type { JobWithCompanyRow } from '#/server/fn/jobs'

// ─── Constants ────────────────────────────────────────────────────────────

/**
 * Fallback per-interview cost when service rates are unknown (source parity).
 * Used by both single and bulk Shortlist credit gates.
 */
export const DEFAULT_INTERVIEW_COST = 40

/**
 * Maximum number of Job Applications selectable for one bulk Shortlist send
 * (source parity — `bulk-shortlist-candidates` cap). The server schema re-checks
 * this authoritatively (ADR-0024 §1).
 */
export const BULK_SHORTLIST_MAX = 10

/**
 * Member-facing copy for the Shortlist preparation policy. Single source of
 * truth so the board, the cross-job page, and bulk all phrase gates alike.
 */
export const SHORTLIST_COPY = {
  applicationMissingBoard: 'Candidate is no longer on the board.',
  jobMissing: 'Could not resolve this candidate\u2019s Job.',
  noPermission:
    'You do not have permission to shortlist candidates. Ask a company admin to grant Send Reachouts.',
  rejected: 'Rejected candidates cannot be shortlisted',
  finalStage: 'This candidate is already at the final stage.',
  finalStageBulk: 'No further stage in this pipeline.',
  interviewLinkMissing:
    'Interview template must include {{interview_link}} variable. Please add it back to the message.',
  prepareFailed: 'Failed to prepare Reachout. Please try again.',
  sendFailed: 'Failed to shortlist candidate',
} as const

// ─── Types ────────────────────────────────────────────────────────────────

/**
 * Read-only view of the Reachout Templates snapshot the gate consumes. The
 * `fetchReachoutTemplates` server function returns a superset of this shape
 * (it also carries `companyId` / capability flags); only the template fields
 * and the configured-flags matter for preparation.
 */
export type ShortlistTemplatesSnapshot = {
  reachout: ReachoutTemplate | null
  interview: ReachoutTemplate | null
  hasReachoutTemplate: boolean
  hasInterviewTemplate: boolean
}

/** Minimal Job shape needed for Reachout personalization. */
export type ShortlistJobInput = Pick<
  JobWithCompanyRow,
  'title' | 'location' | 'companies'
>

/** Inputs to the preparation gate. All fields are read-only snapshots. */
export type ShortlistPreparationInput = {
  application: JobApplicationRow | null
  /**
   * The Job used for Reachout personalization. The Candidate board always
   * passes a resolved Job; the cross-Job Candidates page resolves the Job per
   * application and passes `null` when the Job is not in the visible cache,
   * which the gate surfaces as `job-missing`.
   */
  job: ShortlistJobInput | null
  stages: JobStageRow[]
  canSendReachout: boolean
  /** Reachout Templates snapshot; `null` while the query has not loaded. */
  templates: ShortlistTemplatesSnapshot | null
  creditBalance: number
  interviewCost: number
  creditsLoading: boolean
  ratesLoading: boolean
}

/**
 * Discriminated outcome of the preparation gate. Each variant maps to one
 * Member-facing behaviour; the React layer translates these into state
 * effects (open a modal, surface an error, wait silently).
 */
export type ShortlistDecision =
  | { kind: 'application-missing'; message: string }
  | { kind: 'job-missing'; message: string }
  | { kind: 'block-permission'; message: string }
  | { kind: 'block-rejected'; message: string }
  | { kind: 'block-final-stage'; message: string }
  | { kind: 'wait-credits-loading' }
  | { kind: 'block-insufficient-credits' }
  | { kind: 'templates-not-loaded' }
  | {
      kind: 'open-template-setup'
      templateType: TemplateKind
      nextStage: StageInfo
    }
  | {
      kind: 'open-confirm'
      templateType: TemplateKind
      nextStage: StageInfo
      personalized: PersonalizedEmail
    }

// ─── Preparation gate ─────────────────────────────────────────────────────

/**
 * Resolve the Member-facing Shortlist decision for one Job Application.
 *
 * Gate order (source parity):
 *   application present → Job resolved (cross-Job) → permission → stage/rejected
 *   → credits (interview only) → template readiness → personalization.
 *
 * Returns `templates-not-loaded` when the Templates query has not loaded yet
 * so the caller can refetch and re-resolve. This keeps the credits gate ahead
 * of the template fetch — the caller never blocks on templates while billing
 * rates are still loading.
 */
export function prepareShortlist(
  input: ShortlistPreparationInput,
): ShortlistDecision {
  const {
    application,
    job,
    stages,
    canSendReachout,
    templates,
    creditBalance,
    interviewCost,
    creditsLoading,
    ratesLoading,
  } = input

  if (!application) {
    return {
      kind: 'application-missing',
      message: SHORTLIST_COPY.applicationMissingBoard,
    }
  }

  // Cross-Job surfaces resolve the Job per application; an unresolved Job means
  // personalization is impossible. The board always passes a resolved Job.
  if (!job) {
    return { kind: 'job-missing', message: SHORTLIST_COPY.jobMissing }
  }

  if (!canSendReachout) {
    return { kind: 'block-permission', message: SHORTLIST_COPY.noPermission }
  }

  const nextStage = nextStageForApplication(application, stages)
  if (!nextStage || application.status === 'rejected') {
    return application.status === 'rejected'
      ? { kind: 'block-rejected', message: SHORTLIST_COPY.rejected }
      : { kind: 'block-final-stage', message: SHORTLIST_COPY.finalStage }
  }

  const templateType = templateKindForNextStage(nextStage.name)

  if (templateType === 'interview') {
    // Wait until balance/rates are known — never skip the paid-action gate.
    if (creditsLoading || ratesLoading) {
      return { kind: 'wait-credits-loading' }
    }
    if (creditBalance < interviewCost) {
      return { kind: 'block-insufficient-credits' }
    }
  }

  if (!templates) {
    return { kind: 'templates-not-loaded' }
  }

  const configured =
    templateType === 'interview'
      ? templates.hasInterviewTemplate
      : templates.hasReachoutTemplate
  if (!configured) {
    return { kind: 'open-template-setup', templateType, nextStage }
  }

  const template =
    templateType === 'interview' ? templates.interview : templates.reachout
  if (!template || !hasConfiguredTemplate(template)) {
    return { kind: 'open-template-setup', templateType, nextStage }
  }

  const personalized = generatePersonalizedEmail(
    template,
    {
      candidate_name: application.candidate_name,
      candidate_email: application.candidate.email,
      match_score: application.match_score,
      parsed_candidate_data: application.parsed_candidate_data,
    },
    {
      title: job.title,
      location: job.location,
      company_name: job.companies.name,
    },
  )

  return { kind: 'open-confirm', templateType, nextStage, personalized }
}

// ─── Bulk preparation gate ─────────────────────────────────────────────────

/**
 * Inputs to the bulk Shortlist preparation gate. Bulk operates on a batch of
 * same-stage Job Applications (validated authoritatively by the server), so the
 * gate resolves the next Stage and Template kind once from the shared stage
 * position rather than per application. `selectedCount` drives the credit gate
 * multiplier (ADR-0024 §2).
 */
export type BulkShortlistPreparationInput = {
  canSendReachout: boolean
  selectedCount: number
  nextStage: StageInfo | null
  templates: ShortlistTemplatesSnapshot | null
  creditBalance: number
  interviewCost: number
  creditsLoading: boolean
  ratesLoading: boolean
}

/**
 * Discriminated outcome of the bulk preparation gate. Mirrors the single-app
 * `ShortlistDecision` family but with two intentional differences that reflect
 * bulk semantics (ADR-0024 §4):
 *
 *   - `open-confirm` carries the template subject/body with placeholders intact
 *     (the server personalizes per candidate in the send loop), not a
 *     pre-personalized email for one candidate.
 *   - `block-insufficient-credits` carries `required` = `interviewCost *
 *     selectedCount` so the modal can show the total deficit.
 *
 * The per-application gates (`application-missing`, `job-missing`,
 * `block-rejected`) do not apply to the batch gate — the server validates each
 * selected id authoritatively.
 */
export type BulkShortlistDecision =
  | { kind: 'block-permission'; message: string }
  | { kind: 'block-selection-cap'; message: string }
  | { kind: 'block-final-stage'; message: string }
  | { kind: 'wait-credits-loading' }
  | { kind: 'block-insufficient-credits'; required: number }
  | { kind: 'templates-not-loaded' }
  | {
      kind: 'open-template-setup'
      templateType: TemplateKind
      nextStage: StageInfo
    }
  | {
      kind: 'open-confirm'
      templateType: TemplateKind
      nextStage: StageInfo
      subject: string
      body: string
    }

/**
 * Resolve the Member-facing bulk Shortlist decision for a batch of selected
 * same-stage Job Applications.
 *
 * Gate order (mirrors `prepareShortlist` minus the per-application gates):
 *   permission → selection cap → stage → credits (interview only, × count)
 *   → template readiness → open-confirm (template with placeholders).
 *
 * Returns `templates-not-loaded` when the Templates query has not loaded yet
 * so the caller can refetch and re-resolve — same contract as the single gate.
 */
export function prepareBulkShortlist(
  input: BulkShortlistPreparationInput,
): BulkShortlistDecision {
  const {
    canSendReachout,
    selectedCount,
    nextStage,
    templates,
    creditBalance,
    interviewCost,
    creditsLoading,
    ratesLoading,
  } = input

  if (!canSendReachout) {
    return { kind: 'block-permission', message: SHORTLIST_COPY.noPermission }
  }

  if (selectedCount > BULK_SHORTLIST_MAX) {
    return {
      kind: 'block-selection-cap',
      message: `You can only shortlist up to ${BULK_SHORTLIST_MAX} candidates at a time. Please deselect ${selectedCount - BULK_SHORTLIST_MAX} candidate(s).`,
    }
  }

  if (!nextStage) {
    return { kind: 'block-final-stage', message: SHORTLIST_COPY.finalStageBulk }
  }

  const templateType = templateKindForNextStage(nextStage.name)

  if (templateType === 'interview') {
    if (creditsLoading || ratesLoading) {
      return { kind: 'wait-credits-loading' }
    }
    const totalCost = interviewCost * selectedCount
    if (creditBalance < totalCost) {
      return { kind: 'block-insufficient-credits', required: totalCost }
    }
  }

  if (!templates) {
    return { kind: 'templates-not-loaded' }
  }

  const configured =
    templateType === 'interview'
      ? templates.hasInterviewTemplate
      : templates.hasReachoutTemplate
  if (!configured) {
    return { kind: 'open-template-setup', templateType, nextStage }
  }

  const template =
    templateType === 'interview' ? templates.interview : templates.reachout
  if (!template || !hasConfiguredTemplate(template)) {
    return { kind: 'open-template-setup', templateType, nextStage }
  }

  return {
    kind: 'open-confirm',
    templateType,
    nextStage,
    subject: template.subject,
    body: template.body,
  }
}

// ─── Confirmation validation ──────────────────────────────────────────────

export type ShortlistConfirmationInput = {
  canSendReachout: boolean
  templateType: TemplateKind
  body: string
}

export type ShortlistConfirmationDecision =
  | { kind: 'valid' }
  | { kind: 'block-permission'; message: string }
  | { kind: 'block-missing-interview-link'; message: string }

/**
 * Validate the editable Reachout at confirm time. Re-checks permission
 * (defence in depth — the server function is authoritative) and the
 * `{{interview_link}}` requirement for interview templates, which the Member
 * may have edited out of the pre-filled body. Subject/body emptiness is
 * already prevented by the confirm dialog's disabled button and enforced
 * authoritatively by the server schema, so it is not re-checked here.
 */
export function validateShortlistConfirmation(
  input: ShortlistConfirmationInput,
): ShortlistConfirmationDecision {
  if (!input.canSendReachout) {
    return { kind: 'block-permission', message: SHORTLIST_COPY.noPermission }
  }
  if (
    input.templateType === 'interview' &&
    !input.body.includes('{{interview_link}}')
  ) {
    return {
      kind: 'block-missing-interview-link',
      message: SHORTLIST_COPY.interviewLinkMissing,
    }
  }
  return { kind: 'valid' }
}

// ─── Send-outcome copy ────────────────────────────────────────────────────

/**
 * Map a Shortlist send error to Member-facing copy. The send itself
 * (delivery, Interview Session, stage advance) is owned by the server-side
 * path; this only surfaces the outcome.
 */
export function describeShortlistSendError(err: unknown): string {
  return err instanceof Error ? err.message : SHORTLIST_COPY.sendFailed
}

/**
 * Map a Shortlist preparation error (e.g. a Templates refetch failure) to
 * Member-facing copy. Distinct from the send outcome so the copy matches the
 * step that failed.
 */
export function describeShortlistPrepareError(err: unknown): string {
  return err instanceof Error ? err.message : SHORTLIST_COPY.prepareFailed
}
