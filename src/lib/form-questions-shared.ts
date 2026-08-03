import { z } from 'zod'
import type { FormQuestion } from '#/integrations/supabase/types'

/** Shared Form Template / Form Config question constants — client + server. */

/** Loose question schema — accepts FormQuestion shapes without forcing a
 *  discriminated-union narrowing that fights the DB JSON type. */
export const formQuestionSchema = z.object({
  id: z.string().min(1, 'Question ID is required'),
  baseId: z.string().min(1, 'Question base ID is required'),
  type: z.enum(['text', 'email', 'file', 'select', 'number', 'url']),
  label: z.string().min(1, 'Question label is required'),
  placeholder: z.string().optional(),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  isMandatory: z.boolean(),
  isCustom: z.boolean(),
}).superRefine((question, ctx) => {
  if (
    question.type === 'select' &&
    (!question.options || question.options.length === 0)
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'Select questions must have at least one option',
      path: ['options'],
    })
  }
})

export type FormQuestionInput = z.infer<typeof formQuestionSchema>

export const MANDATORY_QUESTIONS: FormQuestion[] = [
  {
    id: 'name',
    baseId: 'name',
    type: 'text',
    label: 'Full Name',
    placeholder: 'Enter your full name',
    required: true,
    isMandatory: true,
    isCustom: false,
  },
  {
    id: 'email',
    baseId: 'email',
    type: 'email',
    label: 'Email Address',
    placeholder: 'Enter your email address',
    required: true,
    isMandatory: true,
    isCustom: false,
  },
  {
    id: 'phone',
    baseId: 'phone',
    type: 'number',
    label: 'Phone Number',
    placeholder: 'Enter your phone number',
    required: true,
    isMandatory: true,
    isCustom: false,
  },
  {
    id: 'resume',
    baseId: 'resume',
    type: 'file',
    label: 'Resume Upload',
    placeholder: 'Upload your resume (PDF only)',
    required: true,
    isMandatory: true,
    isCustom: false,
  },
]

export const AVAILABLE_ADDITIONAL_QUESTIONS: FormQuestion[] = [
  {
    id: 'relocation',
    baseId: 'relocation',
    type: 'select',
    label: 'Are you willing to Relocate?',
    placeholder: '',
    required: false,
    isMandatory: false,
    isCustom: false,
    options: ['Yes', 'No'],
  },
  {
    id: 'salary',
    baseId: 'salary',
    type: 'number',
    label: 'Expected Salary',
    placeholder: 'Enter expected annual salary',
    required: false,
    isMandatory: false,
    isCustom: false,
  },
  {
    id: 'currentSalary',
    baseId: 'currentSalary',
    type: 'number',
    label: 'Current Salary',
    placeholder: 'Enter your current annual salary',
    required: false,
    isMandatory: false,
    isCustom: false,
  },
  {
    id: 'experience',
    baseId: 'experience',
    type: 'number',
    label: 'Years of Experience',
    placeholder: 'Enter years of relevant experience',
    required: false,
    isMandatory: false,
    isCustom: false,
  },
  {
    id: 'noticePeriod',
    baseId: 'noticePeriod',
    type: 'number',
    label: 'Notice Period (Months)',
    placeholder: 'Enter notice period in months',
    required: false,
    isMandatory: false,
    isCustom: false,
  },
  {
    id: 'qualification',
    baseId: 'qualification',
    type: 'select',
    label: 'Highest Qualification',
    placeholder: '',
    required: false,
    isMandatory: false,
    isCustom: false,
    options: ['High School', "Bachelor's", "Master's", 'PhD', 'Post Doc'],
  },
  {
    id: 'github',
    baseId: 'github',
    type: 'url',
    label: 'GitHub Profile',
    placeholder:
      'Enter your GitHub profile URL (e.g., https://github.com/username)',
    required: false,
    isMandatory: false,
    isCustom: false,
  },
  {
    id: 'custom-question-template',
    baseId: 'customQuestion',
    type: 'text',
    label: 'Custom Question',
    placeholder: 'Enter your response to the question',
    required: false,
    isMandatory: false,
    isCustom: true,
  },
]

export function getAdditionalQuestions(questions: FormQuestion[]): FormQuestion[] {
  return questions.filter((q) => !q.isMandatory)
}

export function mergeMandatoryWithAdditional(
  additional: FormQuestion[],
): FormQuestion[] {
  return [...MANDATORY_QUESTIONS, ...additional]
}

export function countWords(value: string): number {
  const trimmed = value.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}
