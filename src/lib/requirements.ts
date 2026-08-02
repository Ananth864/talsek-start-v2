import type {
  RequirementItemJson,
  RequirementListJson,
} from '#/integrations/supabase/types'

/**
 * Requirement helpers for the Jobs read path — a focused port of the source's
 * `utils/requirements.ts` (only the list normalisation + count used by the Jobs
 * list/detail surfaces). The analysis/scoring helpers belong to the candidate
 * match domain and are not ported here.
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
