import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import type {
  CompanySettingsJson,
  ReachoutTemplateJson,
} from '#/integrations/supabase/types'
import {
  DEFAULT_INTERVIEW_TEMPLATE,
  DEFAULT_PROFESSIONAL_TEMPLATE,
  DEFAULT_REPLY_TO_EMAIL,
  reachoutTemplateInputSchema,
  validateTemplate
  
} from '#/lib/reachout-template-shared'
import type {TemplateKind} from '#/lib/reachout-template-shared';
import { authMiddleware } from '../middleware/auth'

function fallbackTemplate(kind: TemplateKind): ReachoutTemplateJson {
  const base =
    kind === 'interview'
      ? DEFAULT_INTERVIEW_TEMPLATE
      : DEFAULT_PROFESSIONAL_TEMPLATE
  return {
    ...base,
    reply_to_email: DEFAULT_REPLY_TO_EMAIL,
    created_at: new Date().toISOString(),
  }
}

/**
 * Loads company Reachout + Interview templates from `company_settings.settings`.
 * Read is user-scoped (RLS). Missing keys return in-memory defaults without
 * writing (backfill writes are gated by `canManageTemplates` on save).
 */
export const fetchReachoutTemplates = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { data: profile, error: profileError } = await context.supabase
      .from('profiles')
      .select('id, company_id, permissions')
      .eq('id', context.session.user.id)
      .maybeSingle()
    if (profileError || !profile?.company_id) {
      throw new Error('Failed to load your member profile.')
    }

    const { data: settingsRow, error: settingsError } = await context.supabase
      .from('company_settings')
      .select('company_id, settings')
      .eq('company_id', profile.company_id)
      .maybeSingle()
    if (settingsError) {
      throw new Error(`Failed to load templates: ${settingsError.message}`)
    }

    const settings = (settingsRow?.settings ?? {})

    return {
      companyId: profile.company_id,
      canManageTemplates: Boolean(profile.permissions.canManageTemplates),
      reachout: settings.reachout_template ?? fallbackTemplate('final'),
      interview: settings.interview_template ?? fallbackTemplate('interview'),
    }
  })

const saveTemplateSchema = z.object({
  kind: z.enum(['interview', 'final']),
  template: reachoutTemplateInputSchema,
})

/**
 * Saves a Reachout or Interview template into `company_settings.settings`.
 * Authoritative `canManageTemplates` check (ADR-0004); write is user-scoped so
 * RLS admin-only UPDATE applies (same hardening as createJob / ADR-0010).
 */
export const saveReachoutTemplate = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(saveTemplateSchema)
  .handler(async ({ data, context }) => {
    const { data: profile, error: profileError } = await context.supabase
      .from('profiles')
      .select('id, company_id, permissions')
      .eq('id', context.session.user.id)
      .maybeSingle()
    if (profileError || !profile?.company_id) {
      throw new Error('Failed to load your member profile.')
    }
    if (!profile.permissions.canManageTemplates) {
      throw new Error('You do not have permission to manage templates.')
    }

    const template: ReachoutTemplateJson = {
      subject: data.template.subject,
      body: data.template.body,
      reply_to_email: data.template.reply_to_email.trim(),
      created_at: new Date().toISOString(),
    }

    const validationErrors = validateTemplate(template, data.kind)
    if (validationErrors.length > 0) {
      throw new Error(validationErrors[0])
    }

    const companyId = profile.company_id
    const { data: existing, error: readError } = await context.supabase
      .from('company_settings')
      .select('company_id, settings')
      .eq('company_id', companyId)
      .maybeSingle()
    if (readError) {
      throw new Error(`Failed to load company settings: ${readError.message}`)
    }

    const currentSettings = (existing?.settings ?? {})
    const key =
      data.kind === 'interview' ? 'interview_template' : 'reachout_template'
    const updatedSettings: CompanySettingsJson = {
      ...currentSettings,
      [key]: template,
    }

    if (existing) {
      const { error: updateError } = await context.supabase
        .from('company_settings')
        .update({ settings: updatedSettings })
        .eq('company_id', companyId)
      if (updateError) {
        throw new Error(updateError.message)
      }
    } else {
      const { error: insertError } = await context.supabase
        .from('company_settings')
        .insert({
          company_id: companyId,
          settings: updatedSettings,
        })
      if (insertError) {
        throw new Error(insertError.message)
      }
    }

    return { kind: data.kind, template }
  })
