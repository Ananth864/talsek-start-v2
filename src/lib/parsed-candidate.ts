import type {
  EducationJson,
  ResumeExtractionJson,
  SkillWithEvidenceJson,
  WorkExperienceJson,
} from '#/integrations/supabase/types'

/**
 * Read-path accessors for a Job Application's `parsed_candidate_data`
 * (`ResumeExtractionJson`). The column is typed concrete (non-null) but legacy
 * or not-yet-extracted rows can carry a null-ish payload, so every accessor
 * treats the input as nullable and returns `null` / `[]` rather than throwing.
 * `parsedSummary` surfaces the board-card fields; `parsedProfile` surfaces the
 * full shape (work history, education, skills, certifications) for the
 * candidate-profile dialog + PDF renderer.
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

/**
 * The full parsed-resume shape for the profile detail. `info` carries the
 * scalar identity fields as labelled entries (schema "not mentioned" defaults
 * filtered out); the source dialog rendered these generically from the loose
 * JSON keys — the concrete `ResumeExtractionJson` (#6) lets this be typed. The
 * `potential_concerns*` fields are intentionally excluded (source parity: the
 * dialog surfaces AI-analysis concerns, not the extraction's).
 */
export type ParsedProfile = {
  info: Array<{ label: string; value: string }>
  summary: string | null
  workExperience: WorkExperienceJson[]
  education: EducationJson[]
  technicalSkills: SkillWithEvidenceJson[]
  softSkills: SkillWithEvidenceJson[]
  certifications: string[]
  isEmpty: boolean
}

export function parsedProfile(
  parsed: ResumeExtractionJson | null | undefined,
): ParsedProfile {
  const info: ParsedProfile['info'] = []
  const push = (label: string, value: string | undefined | null) => {
    if (present(value)) info.push({ label, value })
  }
  push('Name', parsed?.name)
  push('Email', parsed?.email)
  push('Phone', parsed?.phone)
  push('Location', parsed?.location)
  push('Current role', parsed?.current_role)
  if (typeof parsed?.total_experience_years === 'number') {
    info.push({
      label: 'Total experience',
      value: `${parsed.total_experience_years} years`,
    })
  }
  push('Career level', parsed?.career_level)

  const summary = present(parsed?.summary) ? parsed.summary : null
  const workExperience = parsed?.work_experience ?? []
  const education = parsed?.education ?? []
  const technicalSkills = parsed?.technical_skills ?? []
  const softSkills = parsed?.soft_skills ?? []
  const certifications = (parsed?.certifications ?? []).filter((c) =>
    present(c),
  )

  return {
    info,
    summary,
    workExperience,
    education,
    technicalSkills,
    softSkills,
    certifications,
    isEmpty:
      info.length === 0 &&
      !summary &&
      workExperience.length === 0 &&
      education.length === 0 &&
      technicalSkills.length === 0 &&
      softSkills.length === 0 &&
      certifications.length === 0,
  }
}
