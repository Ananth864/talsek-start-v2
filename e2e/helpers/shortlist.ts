import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Shared behavioural E2E helpers for Shortlist journeys (board, cross-Job,
 * bulk). Layout-parity specs keep their own helpers under
 * `e2e/layout-parity/helpers.ts` (ADR-0030).
 */

export async function signInAsE2EMember(page: Page) {
  await page.goto('/signin')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Email').fill(process.env.E2E_EMAIL!)
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

export function shortlistAdminClient(): SupabaseClient {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for Shortlist E2E',
    )
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Ensure the E2E Member can Shortlist: admin role, capability flags, Reachout
 * Templates with reply_to, and a minimum credit balance.
 */
export async function ensureShortlistMemberReady(options?: {
  /** Minimum credit balance to seed when low. Default 500. */
  minCredits?: number
  /** Prefix for seeded template subject/body (e.g. "E2E Bulk"). */
  templateLabel?: string
}): Promise<{ companyId: string; userId: string }> {
  const admin = shortlistAdminClient()
  const email = process.env.E2E_EMAIL!
  const minCredits = options?.minCredits ?? 500
  const label = options?.templateLabel ?? 'E2E'

  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, company_id, permissions')
    .eq('email', email)
    .maybeSingle()
  if (error || !profile?.company_id) {
    throw new Error(`E2E member profile not found: ${error?.message}`)
  }

  const { error: updateError } = await admin
    .from('profiles')
    .update({
      role: 'admin',
      must_change_password: false,
      permissions: {
        canCreateJob: true,
        canSendReachout: true,
        canManageTemplates: true,
        canManageForms: true,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)
  if (updateError) {
    throw new Error(`Failed to seed permissions: ${updateError.message}`)
  }

  const companyId = profile.company_id
  const { data: settingsRow } = await admin
    .from('company_settings')
    .select('company_id, settings')
    .eq('company_id', companyId)
    .maybeSingle()

  const settings = (settingsRow?.settings ?? {}) as Record<string, unknown>
  const reachout = {
    subject: `${label} Reachout {{job_title}}`,
    body: `Hi {{candidate_name}},\n\nWe would like to move forward for {{job_title}}.\n\nBest,\nE2E`,
    reply_to_email: email,
    created_at: new Date().toISOString(),
  }
  const interview = {
    subject: `${label} Interview {{job_title}}`,
    body: `Hi {{candidate_name}},\n\nPlease take the interview:\n{{interview_link}}\n\nBest,\nE2E`,
    reply_to_email: email,
    created_at: new Date().toISOString(),
  }
  const nextSettings = {
    ...settings,
    reachout_template: reachout,
    interview_template: interview,
  }

  if (settingsRow) {
    const { error: settingsError } = await admin
      .from('company_settings')
      .update({ settings: nextSettings })
      .eq('company_id', companyId)
    if (settingsError) {
      throw new Error(`Failed to seed templates: ${settingsError.message}`)
    }
  } else {
    const { error: insertError } = await admin.from('company_settings').insert({
      company_id: companyId,
      settings: nextSettings,
    })
    if (insertError) {
      throw new Error(`Failed to insert templates: ${insertError.message}`)
    }
  }

  const { data: balance } = await admin.rpc('get_company_credit_balance', {
    p_company_id: companyId,
  })
  if (typeof balance !== 'number' || balance < minCredits) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 365)
    const { error: creditError } = await admin.from('credit_ledger').insert({
      company_id: companyId,
      amount_initial: 1000,
      amount_remaining: 1000,
      expires_at: expiresAt.toISOString(),
      source_type: 'topup',
    })
    if (creditError) {
      throw new Error(`Failed to seed credits: ${creditError.message}`)
    }
  }

  return { companyId, userId: profile.id }
}

export type LedgerSnapshot = { id: string; amount_remaining: number }

/** Snapshot and zero all credit lots for insufficient-credits Shortlist tests. */
export async function snapshotAndZeroCredits(
  companyId: string,
): Promise<LedgerSnapshot[]> {
  const admin = shortlistAdminClient()
  const { data: lots, error } = await admin
    .from('credit_ledger')
    .select('id, amount_remaining')
    .eq('company_id', companyId)
  if (error) {
    throw new Error(`Failed to read credit ledger: ${error.message}`)
  }
  const snapshot = (lots ?? []) as LedgerSnapshot[]
  if (snapshot.length > 0) {
    const { error: zeroError } = await admin
      .from('credit_ledger')
      .update({ amount_remaining: 0 })
      .eq('company_id', companyId)
    if (zeroError) {
      throw new Error(`Failed to zero credits: ${zeroError.message}`)
    }
  }
  return snapshot
}

export async function restoreCredits(
  companyId: string,
  snapshot: LedgerSnapshot[],
) {
  const admin = shortlistAdminClient()
  for (const lot of snapshot) {
    await admin
      .from('credit_ledger')
      .update({ amount_remaining: lot.amount_remaining })
      .eq('id', lot.id)
      .eq('company_id', companyId)
  }
}
