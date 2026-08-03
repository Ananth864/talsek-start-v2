import { z } from 'zod'
import type { ReachoutTemplateJson } from '#/integrations/supabase/types'

/** Shared Reachout / Interview template helpers — safe for client + server. */

export type ReachoutTemplate = ReachoutTemplateJson

export const DEFAULT_REPLY_TO_EMAIL = ''
export const DEFAULT_CREATED_AT = new Date(0).toISOString()

export const DEFAULT_PROFESSIONAL_TEMPLATE: ReachoutTemplate = {
  subject: 'Opportunity at {{company_name}} - {{job_title}} Position',
  body: `Hi {{candidate_name}},

I hope this message finds you well. I came across your profile and was impressed by your background as a {{current_role}} with {{experience_years}} of experience.

Your expertise in {{top_skills}} aligns exceptionally well with our {{job_title}} position at {{company_name}}. Based on our initial assessment, we see a strong {{match_score}}% compatibility with our requirements.

I would welcome the opportunity to discuss this role with you in more detail. Would you be available for a brief conversation this week?

I look forward to hearing from you.

Best regards,
[Your signature will appear here]`,
  reply_to_email: DEFAULT_REPLY_TO_EMAIL,
  created_at: DEFAULT_CREATED_AT,
}

export const DEFAULT_INTERVIEW_TEMPLATE: ReachoutTemplate = {
  subject: 'Interview Invitation - {{job_title}} at {{company_name}}',
  body: `Hi {{candidate_name}},

Thank you for your interest in the {{job_title}} position at {{company_name}}!

We were impressed by your background as a {{current_role}} with {{experience_years}} of experience, particularly your expertise in {{top_skills}}.

We would like to invite you to complete an AI-powered screening interview at your convenience. This interview will help us better understand your qualifications and experience.

Please use the link below to start your interview:
{{interview_link}}

The interview typically takes 15-20 minutes and can be completed at any time that works for you.

If you have any questions, please don't hesitate to reach out.

Best regards,
[Your signature will appear here]`,
  reply_to_email: DEFAULT_REPLY_TO_EMAIL,
  created_at: DEFAULT_CREATED_AT,
}

export const TEMPLATE_VARIABLES = [
  {
    key: '{{candidate_name}}',
    description: 'Candidate\'s name or "there" as fallback',
  },
  { key: '{{candidate_email}}', description: "Candidate's email address" },
  {
    key: '{{current_role}}',
    description: 'Current job title or "professional" as fallback',
  },
  {
    key: '{{experience_years}}',
    description: 'Years of experience or "several years" as fallback',
  },
  { key: '{{job_title}}', description: 'Job position title' },
  { key: '{{company_name}}', description: 'Company name' },
  { key: '{{job_location}}', description: 'Job location' },
  { key: '{{match_score}}', description: 'AI match percentage' },
  { key: '{{top_skills}}', description: 'Top 3 technical skills' },
  {
    key: '{{career_level}}',
    description: 'Career level (junior/mid/senior/lead/executive)',
  },
] as const

export const INTERVIEW_TEMPLATE_VARIABLES = [
  {
    key: '{{interview_link}}',
    description: 'Custom interview link for the candidate',
  },
  ...TEMPLATE_VARIABLES,
] as const

export type TemplateKind = 'interview' | 'final'

export function validateTemplate(
  template: ReachoutTemplate,
  templateType?: TemplateKind,
): string[] {
  const errors: string[] = []

  if (!template.subject.trim()) {
    errors.push('Subject line is required')
  }

  if (!template.body.trim()) {
    errors.push('Message body is required')
  }

  const replyToValidation = z
    .email()
    .trim()
    .min(1, 'Reply-to email is required')
    .safeParse(template.reply_to_email)

  if (!replyToValidation.success) {
    const message = replyToValidation.error.issues[0].message
    if (message === 'Invalid email') {
      errors.push('Reply-to email must be a valid email address')
    } else {
      errors.push(message)
    }
  }

  if (template.subject && template.subject.length > 200) {
    errors.push('Subject line should be under 200 characters')
  }

  if (template.body && template.body.length > 2000) {
    errors.push(
      'Message body should be under 2000 characters for email client compatibility',
    )
  }

  if (
    templateType === 'interview' &&
    template.body &&
    !template.body.includes('{{interview_link}}')
  ) {
    errors.push('Interview template must include {{interview_link}} variable')
  }

  return errors
}

export const reachoutTemplateInputSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(2000),
  reply_to_email: z.email().trim(),
})
