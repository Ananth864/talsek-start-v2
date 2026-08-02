import type {
  AIAnalysisJson,
  AIRequirementDetailJson,
  RequirementItemJson,
} from '#/integrations/supabase/types'
import { computeDynamicScore } from '#/lib/requirements'
import type { z } from 'zod'
import type { jobMatchCoreAnalysisSchema } from './schemas'

type CoreAnalysis = z.infer<typeof jobMatchCoreAnalysisSchema>

/**
 * Pure assembly of the Job Match Analysis DB write shape — score math,
 * `overall_fit_score`, enriched requirement details, and `ai_analysis`.
 * Extracted so the write contract stays independent of the AI SDK call
 * (and so stub + live paths share one authority). Uses `computeDynamicScore`
 * so the persisted `final_score` matches the profile breakdown components.
 */
export function buildJobMatchWritePayload(input: {
  core: CoreAnalysis
  preferredDetails: AIRequirementDetailJson[]
  nonNegotiableDetails: AIRequirementDetailJson[]
  preferred: RequirementItemJson[]
  nonNegotiables: RequirementItemJson[]
}): {
  matchScore: number
  finalScore: number
  meetsAllNonNegotiables: boolean
  preferredRequirementsMet: number
  aiAnalysis: AIAnalysisJson
} {
  const relevantPreferred = input.preferredDetails.filter(
    (detail) =>
      input.preferred.find((r) => r.id === detail.id)?.include !== false,
  )
  const relevantNonNegotiables = input.nonNegotiableDetails.filter(
    (detail) =>
      input.nonNegotiables.find((r) => r.id === detail.id)?.include !== false,
  )

  const matchScore =
    input.core.individual_scores.role_responsibility_readiness_score +
    input.core.individual_scores.concerns_mitigation_score +
    input.core.individual_scores.prestige_score

  const preferredRequirementsMet = relevantPreferred.filter(
    (d) => d.meets,
  ).length
  const nonNegotiablesMet = relevantNonNegotiables.filter((d) => d.meets).length
  const meetsAllNonNegotiables =
    relevantNonNegotiables.length === 0 ||
    nonNegotiablesMet === relevantNonNegotiables.length

  const { finalScore } = computeDynamicScore(
    matchScore,
    {
      metCount: preferredRequirementsMet,
      totalCount: relevantPreferred.length,
    },
    {
      metCount: nonNegotiablesMet,
      totalCount: relevantNonNegotiables.length,
    },
  )

  const aiAnalysis: AIAnalysisJson = {
    recommendation: input.core.recommendation,
    individual_scores: {
      ...input.core.individual_scores,
      overall_fit_score: matchScore,
    },
    rationale: input.core.rationale,
    candidate_readiness: input.core.candidate_readiness,
    strengths_for_role: input.core.strengths_for_role,
    potential_concerns: input.core.potential_concerns,
    preferred_requirements_analysis: {
      details: input.preferredDetails.map(({ id, text, meets, evidence }) => ({
        id,
        text,
        meets,
        evidence,
      })),
    },
    non_negotiables_analysis: {
      details: input.nonNegotiableDetails.map(
        ({ id, text, meets, evidence }) => ({
          id,
          text,
          meets,
          evidence,
        }),
      ),
    },
  }

  return {
    matchScore,
    finalScore,
    meetsAllNonNegotiables,
    preferredRequirementsMet,
    aiAnalysis,
  }
}

/** Exact ID-set check used after the requirements AI call (source parity). */
export function ensureExactIdSet(
  label: string,
  expectedIds: string[],
  receivedIds: string[],
) {
  const expectedSet = new Set(expectedIds)
  const receivedSet = new Set(receivedIds)

  if (
    expectedSet.size !== expectedIds.length ||
    receivedSet.size !== receivedIds.length
  ) {
    throw new Error(
      `[${label}] Duplicate IDs detected in ${label} set from AI response`,
    )
  }

  if (expectedSet.size !== receivedSet.size) {
    throw new Error(
      `[${label}] ID count mismatch between job and AI response`,
    )
  }

  for (const id of expectedSet) {
    if (!receivedSet.has(id)) {
      throw new Error(`[${label}] Missing AI detail for requirement ID ${id}`)
    }
  }

  for (const id of receivedSet) {
    if (!expectedSet.has(id)) {
      throw new Error(
        `[${label}] AI returned unexpected requirement ID ${id}`,
      )
    }
  }
}
