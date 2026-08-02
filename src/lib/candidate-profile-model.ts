import {
  computeDynamicScore,
  mergeRequirementsWithAnalysis,
  summarizeRequirementAnalysis,
} from './requirements'
import { normalizedMatchScore } from './job-applications-shared'
import { parsedProfile } from './parsed-candidate'
import type { RequirementWithAnalysis } from './requirements'
import type { ParsedProfile } from './parsed-candidate'
import type {
  AIAnalysisJson,
  AIRequirementDetailJson,
  EmailBulletInsightsJson,
} from '#/integrations/supabase/types'
import type { JobApplicationRow } from '#/server/fn/job-applications'
import type { JobWithCompanyRow } from '#/server/fn/jobs'

/**
 * The derived read model behind the candidate profile detail (ticket #7).
 * `CandidateProfileDialog` and `CandidateProfilePDFRenderer` render the same
 * data; this single pure derivation keeps the two surfaces in lock-step and
 * owns all defensive access:
 *
 * - `ai_analysis` / `email_content` are typed non-null (MergeDeep override)
 *   but rows that predate or failed the AI pipeline carry null — same
 *   convention as `parsedSummary` / `parsedProfile`.
 * - the requirement-analysis sub-objects are additionally guarded (a partial
 *   pipeline write can persist the core analysis without them).
 * - the headline `matchScore` is the persisted `final_score` — identical to
 *   the board card — while the breakdown components come from the source's
 *   `computeDynamicScore` (ADR-0012 §2).
 */
export type CandidateProfileModel = {
  analysis: AIAnalysisJson | null
  preferredSummary: RequirementSummary
  nonNegotiableSummary: RequirementSummary
  scoreBreakdown: ReturnType<typeof computeDynamicScore>
  /** Persisted `final_score`, clamped — the board-parity headline. */
  matchScore: number
  profile: ParsedProfile
  /** `candidate_name` falling back to the Candidate's email; null when both absent. */
  candidateName: string | null
  email: string | null
  emailBody: string | null
  emailAnalysis: EmailBulletInsightsJson | null
  hasEmailInsights: boolean
  showEmailContent: boolean
}

type RequirementSummary = {
  included: RequirementWithAnalysis[]
  metCount: number
  totalCount: number
}

function requirementDetails(
  section: { details: AIRequirementDetailJson[] } | null | undefined,
): AIRequirementDetailJson[] | undefined {
  const details = section?.details
  return Array.isArray(details) ? details : undefined
}

export function candidateProfileModel(
  application: JobApplicationRow,
  job: JobWithCompanyRow | null | undefined,
): CandidateProfileModel {
  const analysis = nullable(application.ai_analysis)
  const emailContent = nullable(application.email_content)

  const preferredMerged = mergeRequirementsWithAnalysis(
    job?.preferred_requirements,
    'preferred',
    requirementDetails(analysis?.preferred_requirements_analysis),
  )
  const nonNegotiableMerged = mergeRequirementsWithAnalysis(
    job?.non_negotiables,
    'non_negotiable',
    requirementDetails(analysis?.non_negotiables_analysis),
  )
  const preferredSummary = summarizeRequirementAnalysis(preferredMerged)
  const nonNegotiableSummary = summarizeRequirementAnalysis(nonNegotiableMerged)

  // `match_score` (the raw 0–25 overall fit) is guarded like `final_score`
  // in `normalizedMatchScore` — the column type is non-null but legacy rows
  // can carry null.
  const rawOverallFit = Number(application.match_score)
  const scoreBreakdown = computeDynamicScore(
    Number.isFinite(rawOverallFit) ? rawOverallFit : 0,
    preferredSummary,
    nonNegotiableSummary,
  )

  const email = application.candidate.email || null
  const emailBody = emailContent?.email_body || null
  const emailAnalysis = emailContent?.email_analysis ?? null
  const hasEmailInsights =
    application.processing_source !== 'form' &&
    !!emailAnalysis &&
    (emailAnalysis.candidate_highlights.length > 0 ||
      emailAnalysis.company_join_highlights.length > 0)

  return {
    analysis,
    preferredSummary,
    nonNegotiableSummary,
    scoreBreakdown,
    matchScore: normalizedMatchScore(application),
    profile: parsedProfile(application.parsed_candidate_data),
    candidateName: application.candidate_name || email,
    email,
    emailBody,
    emailAnalysis,
    hasEmailInsights,
    showEmailContent: !!emailBody || hasEmailInsights,
  }
}

/** Nullability shim for columns whose type is non-null but whose rows may not be. */
function nullable<T>(value: T | null | undefined): T | null {
  return value ?? null
}

/**
 * Parses recruiter-forwarded email bodies whose first lines carry
 * `Subject:` / `From:` / `To:` / `Date:` headers (source:
 * `renderEmailContent`). Header lines feed the "Email Details" card; the
 * remainder is the message content.
 */
export function parseEmailBody(emailBody: string): {
  subject?: string
  from?: string
  to?: string
  date?: string
  content: string
} {
  const lines = emailBody.split('\n').filter((line) => line.trim())
  const headers: { subject?: string; from?: string; to?: string; date?: string } =
    {}
  const contentLines: Array<string> = []

  for (const line of lines) {
    const lower = line.toLowerCase()
    if (lower.includes('subject:')) {
      headers.subject = line.replace(/subject:/i, '').trim()
    } else if (lower.includes('from:')) {
      headers.from = line.replace(/from:/i, '').trim()
    } else if (lower.includes('to:')) {
      headers.to = line.replace(/to:/i, '').trim()
    } else if (lower.includes('date:')) {
      headers.date = line.replace(/date:/i, '').trim()
    } else {
      contentLines.push(line)
    }
  }

  return { ...headers, content: contentLines.join('\n') }
}

/**
 * Date presentation for the profile surfaces. The dialog uses `long` with the
 * source's "No date provided" fallback; the PDF uses `short` with "N/A"
 * (source parity for both).
 */
export function formatProfileDate(
  iso: string | null | undefined,
  style: 'long' | 'short',
  fallback: string,
): string {
  if (!iso) return fallback
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return fallback
  return d.toLocaleDateString('en-US', {
    month: style === 'long' ? 'long' : 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
