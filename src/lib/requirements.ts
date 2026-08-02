import type {
  AIRequirementDetailJson,
  RequirementItemJson,
  RequirementListJson,
} from '#/integrations/supabase/types'

/**
 * Requirement helpers — a port of the source's `utils/requirements.ts`. The
 * list normalisation + count serve the Jobs list/detail surfaces (#5); the
 * analysis merge/summary + dynamic score serve the candidate profile detail
 * (#7), which displays the per-requirement AI evidence and the score
 * breakdown. All helpers are pure read functions.
 */

export type RequirementInput =
  | RequirementListJson
  | string[]
  | null
  | undefined

/**
 * Normalises a stored requirement list (which may be strings or objects, and
 * may omit ids/include flags) into the canonical `RequirementItemJson[]` shape.
 * Mirrors the source so counts render identically.
 */
export function normalizeRequirementList(
  requirements: RequirementInput,
  prefix: 'preferred' | 'non_negotiable',
): RequirementItemJson[] {
  if (!requirements) return []

  return (requirements as unknown[]).map((item, index) => {
    if (typeof item === 'string') {
      return { id: `${prefix}_${index + 1}`, text: item, include: true }
    }

    if (item && typeof item === 'object') {
      const id =
        typeof (item as { id?: unknown }).id === 'string'
          ? (item as { id: string }).id
          : `${prefix}_${index + 1}`

      const text =
        typeof (item as { text?: unknown }).text === 'string'
          ? (item as { text: string }).text
          : typeof (item as { requirement?: unknown }).requirement === 'string'
            ? (item as { requirement: string }).requirement
            : ''

      const include =
        typeof (item as { include?: unknown }).include === 'boolean'
          ? (item as { include: boolean }).include
          : true

      return { id, text, include }
    }

    return {
      id: `${prefix}_${index + 1}`,
      text: String(item ?? ''),
      include: true,
    }
  }).filter((item) => !!item.text)
}

/** Count of requirements a Job actually scores against (`include !== false`). */
export function countIncludedRequirements(
  requirements: RequirementInput,
  prefix: 'preferred' | 'non_negotiable',
): number {
  return normalizeRequirementList(requirements, prefix).filter(
    (req) => req.include !== false,
  ).length
}

/** A requirement joined with the AI's per-requirement verdict + evidence. */
export type RequirementWithAnalysis = RequirementItemJson & {
  meets: boolean
  evidence?: string
}

/**
 * Joins a Job's requirement list with the AI analysis details stored on the
 * Job Application (`ai_analysis.*_analysis.details`), keyed by requirement id.
 * Requirements the analysis did not cover render as not met (source parity).
 */
export function mergeRequirementsWithAnalysis(
  requirements: RequirementInput,
  prefix: 'preferred' | 'non_negotiable',
  details?: AIRequirementDetailJson[],
): RequirementWithAnalysis[] {
  const normalized = normalizeRequirementList(requirements, prefix)
  const detailMap = new Map((details ?? []).map((detail) => [detail.id, detail]))

  return normalized.map((req) => {
    const match = detailMap.get(req.id)
    return {
      ...req,
      meets: match?.meets ?? false,
      evidence: match?.evidence,
    }
  })
}

/** Met/total counts over the included (`include !== false`) requirements. */
export function summarizeRequirementAnalysis(merged: RequirementWithAnalysis[]) {
  const included = merged.filter((req) => req.include !== false)
  const metCount = included.filter((req) => req.meets).length
  const totalCount = included.length
  return { included, metCount, totalCount }
}

/**
 * The source's unified scoring: dynamic weights based on the preferred count
 * (10 points each, capped at 40); the remaining weight goes to the raw 0–25
 * overall-fit score (`match_score`); the total halves when any non-negotiable
 * is missed. The candidate profile detail uses the *components* for its
 * breakdown cards; the headline score everywhere stays the persisted
 * `final_score` so the dialog and the board can never disagree (ADR-0011 §5 —
 * on the read path, where requirements are not edited, the two coincide).
 */
export function computeDynamicScore(
  overallFitRaw: number,
  preferredSummary: { metCount: number; totalCount: number },
  nonNegotiableSummary: { metCount: number; totalCount: number },
) {
  const preferredCount = preferredSummary.totalCount
  const preferredWeight = Math.min(40, Math.max(0, preferredCount * 10))
  const overallWeight = 100 - preferredWeight

  const overallPct = Math.min(100, Math.max(0, (overallFitRaw / 25) * 100))
  const overallComponent = Math.round((overallPct / 100) * overallWeight)

  const bonusComponent =
    preferredCount > 0
      ? Math.round((preferredSummary.metCount / preferredCount) * preferredWeight)
      : 0

  const allNonNegMet =
    nonNegotiableSummary.totalCount === 0 ||
    nonNegotiableSummary.metCount === nonNegotiableSummary.totalCount

  const rawFinal = overallComponent + bonusComponent
  const finalScore = Math.min(
    100,
    allNonNegMet ? rawFinal : Math.round(rawFinal / 2),
  )

  return {
    overallComponent,
    bonusComponent,
    finalScore,
    overallWeight,
    preferredWeight,
    allNonNegMet,
  }
}
