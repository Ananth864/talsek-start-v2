/**
 * Reachout personalization helpers — shared client/server (source
 * `emailTemplateEngine`). Used to pre-fill the Shortlist confirm dialog and
 * again server-side when remaining placeholders (e.g. `{{interview_link}}`)
 * are resolved at send time.
 */
import type { ReachoutTemplate } from '#/lib/reachout-template-shared'
import type { ResumeExtractionJson } from '#/integrations/supabase/types'

export type PersonalizedEmail = {
  subject: string
  body: string
}

export type PersonalizeApplicationInput = {
  candidate_name: string | null
  candidate_email: string
  match_score: number | null
  parsed_candidate_data: ResumeExtractionJson | null
}

export type PersonalizeJobInput = {
  title: string
  location: string | null
  company_name: string | null
}

function skillLabel(skill: string | { skill: string }): string {
  return typeof skill === 'string' ? skill : skill.skill
}

/**
 * Replace template variables with application/job values. Leaves
 * `{{interview_link}}` untouched for server-side substitution after the
 * Interview Session is created.
 */
export function generatePersonalizedEmail(
  template: Pick<ReachoutTemplate, 'subject' | 'body'>,
  application: PersonalizeApplicationInput,
  job: PersonalizeJobInput,
  extras: Record<string, string> = {},
): PersonalizedEmail {
  const parsed = application.parsed_candidate_data
  const topSkills = parsed
    ? parsed.technical_skills.slice(0, 3).map(skillLabel).join(', ') ||
      'your skills'
    : 'your skills'

  const matchScorePercent = Math.min(
    100,
    Math.max(0, Math.round(((application.match_score ?? 0) / 25) * 100)),
  ).toString()

  const variables: Record<string, string> = {
    '{{candidate_name}}': application.candidate_name || 'there',
    '{{candidate_email}}': application.candidate_email,
    '{{current_role}}': parsed?.current_role || 'professional',
    '{{experience_years}}': parsed?.total_experience_years
      ? `${parsed.total_experience_years} years`
      : 'several years',
    '{{job_title}}': job.title,
    '{{company_name}}': job.company_name || 'our company',
    '{{job_location}}': job.location || 'our location',
    '{{match_score}}': matchScorePercent,
    '{{top_skills}}': topSkills,
    '{{career_level}}': parsed?.career_level || 'experienced',
    ...extras,
  }

  let subject = template.subject
  let body = template.body
  for (const [placeholder, value] of Object.entries(variables)) {
    const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g')
    subject = subject.replace(regex, value)
    body = body.replace(regex, value)
  }

  return { subject, body }
}

/** Convert plain-text Reachout body (with optional HTML fragments) to HTML. */
export function reachoutBodyToHtml(body: string): string {
  return body
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
}

/** Template kind implied by the next Hiring Stage name (source parity). */
export function templateKindForNextStage(
  nextStageName: string | null | undefined,
): 'interview' | 'final' {
  if (nextStageName === 'Screening Interview') return 'interview'
  if (nextStageName === 'Final Reachout') return 'final'
  return 'final'
}

export function hasConfiguredTemplate(
  template: Pick<ReachoutTemplate, 'reply_to_email'> | null | undefined,
): boolean {
  return Boolean(template?.reply_to_email.trim())
}
