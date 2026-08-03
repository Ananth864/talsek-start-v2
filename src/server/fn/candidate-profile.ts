import { createServerFn } from '@tanstack/react-start'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth'
import type { Database } from '#/integrations/supabase/types'

/**
 * Member read path for candidate-profile extras (ticket #22): Interview Session
 * by Job Application, and Form Submission (+ Form Config / template) for
 * form-processed applicants. RLS on the user-scoped client owns company
 * scoping (ADR-0004). No schema changes — existing JSON columns only.
 */

export function interviewSessionQuery(client: SupabaseClient<Database>) {
  return client.from('interview_sessions').select(
    `id, job_application_id, candidate_id, job_id, token, status,
     interview_context, questions_completed, current_question_index,
     current_question_follow_ups, started_at, completed_at, expires_at,
     created_at, updated_at`,
  )
}

export type InterviewSessionRow = NonNullable<
  Awaited<ReturnType<typeof interviewSessionQuery>>['data']
>[number]

export function formSubmissionWithConfigQuery(
  client: SupabaseClient<Database>,
) {
  return client.from('form_submissions').select(
    `id, candidate_id, job_form_config_id, submission_data, resume_path,
     processing_status, submitted_at, processed_at`,
  )
}

export type FormSubmissionRow = NonNullable<
  Awaited<ReturnType<typeof formSubmissionWithConfigQuery>>['data']
>[number]

export type JobFormConfigForSubmission = {
  id: string
  job_id: string
  questions: Database['public']['Tables']['job_form_configs']['Row']['questions']
  custom_question_text: Database['public']['Tables']['job_form_configs']['Row']['custom_question_text']
  form_templates: {
    id: string
    questions: Database['public']['Tables']['form_templates']['Row']['questions']
  } | null
}

export type FormSubmissionResult = {
  formSubmission: FormSubmissionRow
  jobFormConfig: JobFormConfigForSubmission
}

/**
 * Interview Session for one Job Application (1:1). Returns null when none
 * exists — the profile Interview tab renders its empty state.
 */
export const fetchInterviewSession = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(z.object({ applicationId: z.uuid() }))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await interviewSessionQuery(context.supabase)
      .eq('job_application_id', data.applicationId)
      .maybeSingle()
    if (error) {
      throw new Error(`Failed to load interview session: ${error.message}`)
    }
    return row
  })

/**
 * Form Submission for a Candidate on a Job. Resolves the Job's Form Config
 * (with template questions) then the matching submission row. Returns null
 * when either is missing.
 */
export const fetchFormSubmission = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(
    z.object({
      candidateId: z.uuid(),
      jobId: z.uuid(),
    }),
  )
  .handler(async ({ data, context }): Promise<FormSubmissionResult | null> => {
    const { data: jobFormConfig, error: configError } = await context.supabase
      .from('job_form_configs')
      .select(
        `id, job_id, questions, custom_question_text,
         form_templates(id, questions)`,
      )
      .eq('job_id', data.jobId)
      .maybeSingle()

    if (configError) {
      throw new Error(`Failed to load form config: ${configError.message}`)
    }
    if (!jobFormConfig) return null

    const { data: formSubmission, error: submissionError } =
      await formSubmissionWithConfigQuery(context.supabase)
        .eq('candidate_id', data.candidateId)
        .eq('job_form_config_id', jobFormConfig.id)
        .maybeSingle()

    if (submissionError) {
      throw new Error(
        `Failed to load form submission: ${submissionError.message}`,
      )
    }
    if (!formSubmission) return null

    // Supabase embed may return an array; normalise to a single template.
    const rawTemplate = jobFormConfig.form_templates as
      | JobFormConfigForSubmission['form_templates']
      | JobFormConfigForSubmission['form_templates'][]
      | null
    const form_templates = Array.isArray(rawTemplate)
      ? (rawTemplate[0] ?? null)
      : rawTemplate

    return {
      formSubmission,
      jobFormConfig: {
        id: jobFormConfig.id,
        job_id: jobFormConfig.job_id,
        questions: jobFormConfig.questions,
        custom_question_text: jobFormConfig.custom_question_text,
        form_templates,
      },
    }
  })
