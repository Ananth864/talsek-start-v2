import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '../middleware/auth'
import { getSupabaseServerClient } from '../lib/supabase'
import { companySetupSchema } from '#/lib/company-shared'
import {
  DEFAULT_INTERVIEW_TEMPLATE,
  DEFAULT_PROFESSIONAL_TEMPLATE,
  DEFAULT_REPLY_TO_EMAIL,
} from '#/lib/reachout-template-shared'
import type { CompanySettingsJson } from '#/integrations/supabase/types'

/**
 * Creates a Company for a company-less Profile (Google OAuth first sign-in /
 * dashboard guard). User-scoped inserts so RLS owns the writes (ADR-0004).
 * The creator is linked as `admin` so `company_settings` can be inserted under
 * the existing admin-only manage policy (the source set `member` and silently
 * failed the settings insert).
 */
export const completeCompanySetup = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(companySetupSchema)
  .handler(async ({ context, data }) => {
    const userId = context.session.user.id
    const companyName = data.companyName.trim() || 'Company'
    const companySize = data.companySize.trim() || '1-10'

    const { data: existingProfile, error: profileError } =
      await context.supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .maybeSingle()
    if (profileError) {
      throw new Error(`Failed to load profile: ${profileError.message}`)
    }
    if (existingProfile?.company_id) {
      return { ok: true as const, companyId: existingProfile.company_id }
    }

    const { data: newCompany, error: createError } = await context.supabase
      .from('companies')
      .insert({ name: companyName })
      .select('id')
      .single()
    if (createError) {
      throw new Error(`Failed to create company: ${createError.message}`)
    }

    const companyId = newCompany.id

    const { error: linkError } = await context.supabase
      .from('profiles')
      .update({
        company_id: companyId,
        role: 'admin',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
    if (linkError) {
      throw new Error(`Failed to attach company to profile: ${linkError.message}`)
    }

    const { data: existingSettings } = await context.supabase
      .from('company_settings')
      .select('company_id')
      .eq('company_id', companyId)
      .maybeSingle()

    if (!existingSettings) {
      const createdAt = new Date().toISOString()
      const settings: CompanySettingsJson = {
        reachout_template: {
          ...DEFAULT_PROFESSIONAL_TEMPLATE,
          reply_to_email: DEFAULT_REPLY_TO_EMAIL,
          created_at: createdAt,
        },
        interview_template: {
          ...DEFAULT_INTERVIEW_TEMPLATE,
          reply_to_email: DEFAULT_REPLY_TO_EMAIL,
          created_at: createdAt,
        },
      }

      const { error: settingsError } = await context.supabase
        .from('company_settings')
        .insert({
          company_id: companyId,
          company_size: companySize,
          settings,
        })
      if (settingsError) {
        throw new Error(
          `Failed to create company settings: ${settingsError.message}`,
        )
      }
    }

    // Best-effort metadata flag (parity with source AuthContext).
    const { client, flushCookies } = getSupabaseServerClient()
    await client.auth.updateUser({ data: { company_created: true } })
    flushCookies()

    return { ok: true as const, companyId }
  })
