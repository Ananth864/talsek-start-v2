import type { ResumeExtractionJson } from '#/integrations/supabase/types'

/**
 * Read-path accessors for a Job Application's `parsed_candidate_data`
 * (`ResumeExtractionJson`). The column is typed concrete (non-null) but legacy
 * or not-yet-extracted rows can carry a null-ish payload, so every accessor
 * treats the input as nullable and returns `null` / `[]` rather than throwing.
 * The full parsed shape (work history, education, concerns) is consumed by the
 * candidate-profile dialog; this surfaces only the board-card summary fields.
 */
export type ParsedSummary = {
  name: string | null
  currentRole: string | null
  years: number | null
  location: string | null
  careerLevel: string | null
  topSkills: string[]
}

const NOT_MENTIONED = 'not mentioned'

/** True when a parsed string field is absent or the schema's "not mentioned" default. */
function present(value: string | undefined | null): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.trim().toLowerCase() !== NOT_MENTIONED
  )
}

export function parsedSummary(
  parsed: ResumeExtractionJson | null | undefined,
): ParsedSummary {
  const name = parsed?.name
  const currentRole = parsed?.current_role
  const location = parsed?.location
  const careerLevel = parsed?.career_level
  const years = parsed?.total_experience_years
  const skills = parsed?.technical_skills ?? []

  return {
    name: present(name) ? name : null,
    currentRole: present(currentRole) ? currentRole : null,
    years: typeof years === 'number' ? years : null,
    location: present(location) ? location : null,
    careerLevel: present(careerLevel) ? careerLevel : null,
    topSkills: skills.map((s) => s.skill).filter((s) => s.trim().length > 0),
  }
}
