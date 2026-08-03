import { createServerFn } from '@tanstack/react-start'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database, FormQuestionsJson } from '#/integrations/supabase/types'
import {
  formQuestionSchema,
  getAdditionalQuestions,
  mergeMandatoryWithAdditional,
  MANDATORY_QUESTIONS,
} from '#/lib/form-questions-shared'
import { authMiddleware } from '../middleware/auth'

async function requireMemberProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, company_id, permissions')
    .eq('id', userId)
    .maybeSingle()
  if (error || !profile?.company_id) {
    throw new Error('Failed to load your member profile.')
  }
  return {
    ...profile,
    company_id: profile.company_id,
  }
}

/**
 * Company Form Template (questions). Uses `get_or_create_form_template` RPC
 * so a company without a row gets the DB default. Read is user-scoped.
 */
export const fetchFormTemplate = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireMemberProfile(
      context.supabase,
      context.session.user.id,
    )
    const { data: templateId, error: rpcError } = await context.supabase.rpc(
      'get_or_create_form_template',
      { target_company_id: profile.company_id },
    )
    if (rpcError || !templateId) {
      throw new Error(
        `Failed to load form template: ${rpcError?.message ?? 'unknown'}`,
      )
    }

    const { data: template, error } = await context.supabase
      .from('form_templates')
      .select(
        'id, company_id, name, questions, is_active, created_at, updated_at',
      )
      .eq('id', templateId)
      .maybeSingle()
    if (error || !template) {
      throw new Error(`Failed to load form template: ${error?.message}`)
    }

    const questions = template.questions
    return {
      companyId: profile.company_id,
      canManageForms: Boolean(profile.permissions.canManageForms),
      template: {
        ...template,
        questions,
      },
      mandatoryQuestions: MANDATORY_QUESTIONS,
      additionalQuestions: getAdditionalQuestions(questions),
    }
  })

const updateFormTemplateSchema = z.object({
  questions: z.array(formQuestionSchema).min(1),
})

/**
 * Updates the company Form Template questions. Merges mandatory + additional
 * on the server. Authoritative `canManageForms` (ADR-0004); user-scoped write.
 */
export const updateFormTemplate = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(updateFormTemplateSchema)
  .handler(async ({ data, context }) => {
    const profile = await requireMemberProfile(
      context.supabase,
      context.session.user.id,
    )
    if (!profile.permissions.canManageForms) {
      throw new Error('You do not have permission to customize forms.')
    }

    const additional = data.questions.filter((q) => !q.isMandatory)
    const merged = mergeMandatoryWithAdditional(additional)

    const { data: templateId, error: rpcError } = await context.supabase.rpc(
      'get_or_create_form_template',
      { target_company_id: profile.company_id },
    )
    if (rpcError || !templateId) {
      throw new Error(
        `Failed to resolve form template: ${rpcError?.message ?? 'unknown'}`,
      )
    }

    const { data: updated, error } = await context.supabase
      .from('form_templates')
      .update({
        questions: merged,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)
      .select(
        'id, company_id, name, questions, is_active, created_at, updated_at',
      )
      .single()
    if (error) {
      throw new Error(error.message)
    }

    return {
      template: {
        ...updated,
        questions: updated.questions,
      },
    }
  })

/**
 * Per-Job Form Config for Member editing (questions snapshot + custom labels).
 */
export const fetchJobFormConfig = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(z.object({ jobId: z.uuid() }))
  .handler(async ({ data, context }) => {
    const profile = await requireMemberProfile(
      context.supabase,
      context.session.user.id,
    )

    const { data: job, error: jobError } = await context.supabase
      .from('jobs')
      .select('id, title')
      .eq('id', data.jobId)
      .maybeSingle()
    if (jobError || !job) {
      throw new Error('Job not found.')
    }

    const { data: config, error: configError } = await context.supabase
      .from('job_form_configs')
      .select(
        'id, job_id, form_template_id, form_url_token, is_enabled, expires_at, questions, custom_question_text, created_at',
      )
      .eq('job_id', data.jobId)
      .maybeSingle()
    if (configError) {
      throw new Error(`Failed to load form config: ${configError.message}`)
    }

    const { data: templateId } = await context.supabase.rpc(
      'get_or_create_form_template',
      { target_company_id: profile.company_id },
    )
    let templateAdditional: FormQuestionsJson = []
    if (templateId) {
      const { data: template } = await context.supabase
        .from('form_templates')
        .select('questions')
        .eq('id', templateId)
        .maybeSingle()
      if (template) {
        templateAdditional = getAdditionalQuestions(template.questions)
      }
    }

    return {
      canManageForms: Boolean(profile.permissions.canManageForms),
      job: { id: job.id, title: job.title },
      config: config
        ? {
            ...config,
            questions: config.questions,
            custom_question_text: config.custom_question_text,
          }
        : null,
      templateAdditionalQuestions: templateAdditional,
      mandatoryQuestions: MANDATORY_QUESTIONS,
    }
  })

const upsertJobFormConfigSchema = z.object({
  jobId: z.uuid(),
  isEnabled: z.boolean(),
  questions: z.array(formQuestionSchema),
  customQuestionText: z.record(z.string(), z.string()),
})

/**
 * Creates or updates a Job's Form Config (snapshot questions + custom labels).
 * Authoritative `canManageForms`; user-scoped write (RLS admin-only).
 */
export const upsertJobFormConfig = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(upsertJobFormConfigSchema)
  .handler(async ({ data, context }) => {
    const profile = await requireMemberProfile(
      context.supabase,
      context.session.user.id,
    )
    if (!profile.permissions.canManageForms) {
      throw new Error('You do not have permission to customize forms.')
    }

    const { data: job, error: jobError } = await context.supabase
      .from('jobs')
      .select('id')
      .eq('id', data.jobId)
      .maybeSingle()
    if (jobError || !job) {
      throw new Error('Job not found.')
    }

    const additional = data.questions.filter((q) => !q.isMandatory)
    for (const q of additional) {
      if (q.isCustom) {
        const label = (data.customQuestionText[q.id] || q.label || '').trim()
        if (!label) {
          throw new Error('Every custom question needs a label.')
        }
        const words = label.split(/\s+/).filter(Boolean).length
        if (words > 20) {
          throw new Error('Custom question labels must be 20 words or fewer.')
        }
      }
    }

    const { data: templateId, error: rpcError } = await context.supabase.rpc(
      'get_or_create_form_template',
      { target_company_id: profile.company_id },
    )
    if (rpcError || !templateId) {
      throw new Error(
        `Failed to resolve form template: ${rpcError?.message ?? 'unknown'}`,
      )
    }

    const { data: existing } = await context.supabase
      .from('job_form_configs')
      .select('id, form_url_token')
      .eq('job_id', data.jobId)
      .maybeSingle()

    if (existing) {
      const { data: updated, error } = await context.supabase
        .from('job_form_configs')
        .update({
          is_enabled: data.isEnabled,
          questions: additional,
          custom_question_text: data.customQuestionText,
          form_template_id: templateId,
        })
        .eq('id', existing.id)
        .select(
          'id, job_id, form_template_id, form_url_token, is_enabled, expires_at, questions, custom_question_text, created_at',
        )
        .single()
      if (error) throw new Error(error.message)
      return {
        config: {
          ...updated,
          questions: updated.questions,
          custom_question_text: updated.custom_question_text,
        },
        created: false,
      }
    }

    const formUrlToken = crypto.randomUUID()
    const { data: created, error } = await context.supabase
      .from('job_form_configs')
      .insert({
        job_id: data.jobId,
        form_template_id: templateId,
        form_url_token: formUrlToken,
        is_enabled: data.isEnabled,
        questions: additional,
        custom_question_text: data.customQuestionText,
      })
      .select(
        'id, job_id, form_template_id, form_url_token, is_enabled, expires_at, questions, custom_question_text, created_at',
      )
      .single()
    if (error) throw new Error(error.message)

    return {
      config: {
        ...created,
        questions: created.questions,
        custom_question_text: created.custom_question_text,
      },
      created: true,
    }
  })
