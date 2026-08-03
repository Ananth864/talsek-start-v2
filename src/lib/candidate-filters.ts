import {
  computeDynamicScore,
  mergeRequirementsWithAnalysis,
  summarizeRequirementAnalysis,
} from '#/lib/requirements'
import type { RequirementInput } from '#/lib/requirements'
import type { JobApplicationRow } from '#/server/fn/job-applications'

/**
 * Client-side fit / status filter for the candidate board (source
 * `utils/candidateFilters.ts`). Composes with stage tabs (applied first) and
 * search (applied after). Fit categories are requirement-based, not score
 * cutoffs — see ADR-0011.
 */

export type CandidateFilter =
  | 'all'
  | 'perfect_fit'
  | 'good_fit'
  | 'poor_fit'
  | 'rejected'

export type FilterOption = {
  value: CandidateFilter
  label: string
  description: string
}

export const FILTER_OPTIONS: FilterOption[] = [
  {
    value: 'all',
    label: 'All Candidates',
    description: 'Active candidates only',
  },
  {
    value: 'perfect_fit',
    label: 'Perfect Fit',
    description: 'Meets all non-negotiables and preferred requirements',
  },
  {
    value: 'good_fit',
    label: 'Good Fit',
    description: 'Meets all non-negotiables but not all preferred requirements',
  },
  {
    value: 'poor_fit',
    label: 'Poor Fit',
    description: 'Does not meet all non-negotiables',
  },
  {
    value: 'rejected',
    label: 'Rejected Candidates',
    description: 'Candidates that were rejected',
  },
]

export type FitCategory = 'perfect' | 'good' | 'poor'

type JobRequirements = {
  preferred_requirements?: RequirementInput
  non_negotiables?: RequirementInput
}

export function getFitCategory(
  application: JobApplicationRow,
  job: JobRequirements,
): FitCategory {
  const preferredMerged = mergeRequirementsWithAnalysis(
    job.preferred_requirements,
    'preferred',
    application.ai_analysis?.preferred_requirements_analysis?.details,
  )
  const nonNegotiableMerged = mergeRequirementsWithAnalysis(
    job.non_negotiables,
    'non_negotiable',
    application.ai_analysis?.non_negotiables_analysis?.details,
  )

  const preferredSummary = summarizeRequirementAnalysis(preferredMerged)
  const nonNegotiableSummary = summarizeRequirementAnalysis(nonNegotiableMerged)

  const meetsAllNonNegotiables =
    nonNegotiableSummary.totalCount === 0 ||
    (nonNegotiableSummary.totalCount > 0 &&
      nonNegotiableSummary.metCount === nonNegotiableSummary.totalCount)

  const preferredRequirementsMatched = preferredSummary.metCount
  const totalPreferredRequirements = preferredSummary.totalCount

  if (!meetsAllNonNegotiables) {
    return 'poor'
  }

  if (
    totalPreferredRequirements === 0 ||
    preferredRequirementsMatched >= totalPreferredRequirements
  ) {
    return 'perfect'
  }

  return 'good'
}

export function filterCandidates(
  candidates: JobApplicationRow[],
  filter: CandidateFilter,
  job: JobRequirements,
): JobApplicationRow[] {
  let filtered: JobApplicationRow[]

  switch (filter) {
    case 'all':
      filtered = candidates.filter((app) => app.status === 'active')
      break

    case 'perfect_fit':
      filtered = candidates.filter((app) => {
        if (app.status !== 'active') return false
        return getFitCategory(app, job) === 'perfect'
      })
      break

    case 'good_fit':
      filtered = candidates.filter((app) => {
        if (app.status !== 'active') return false
        return getFitCategory(app, job) === 'good'
      })
      break

    case 'poor_fit':
      filtered = candidates.filter((app) => {
        if (app.status !== 'active') return false
        return getFitCategory(app, job) === 'poor'
      })
      break

    case 'rejected':
      filtered = candidates.filter((app) => app.status === 'rejected')
      break

    default:
      filtered = candidates.filter((app) => app.status === 'active')
  }

  // Recompute scores from current Job requirements so sort order stays fresh
  // when requirements are edited after screening (source parity).
  const withDynamicScores = filtered.map((app) => {
    const preferredMerged = mergeRequirementsWithAnalysis(
      job.preferred_requirements,
      'preferred',
      app.ai_analysis?.preferred_requirements_analysis?.details,
    )
    const nonNegMerged = mergeRequirementsWithAnalysis(
      job.non_negotiables,
      'non_negotiable',
      app.ai_analysis?.non_negotiables_analysis?.details,
    )
    const prefSummary = summarizeRequirementAnalysis(preferredMerged)
    const nonNegSummary = summarizeRequirementAnalysis(nonNegMerged)
    const overallFit =
      app.ai_analysis?.individual_scores?.overall_fit_score ?? 0
    const { finalScore } = computeDynamicScore(
      overallFit,
      prefSummary,
      nonNegSummary,
    )
    return { app, dynamicScore: finalScore }
  })

  return withDynamicScores
    .sort((a, b) => b.dynamicScore - a.dynamicScore)
    .map((item) => item.app)
}
