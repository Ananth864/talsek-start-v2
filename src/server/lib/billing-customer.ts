/**
 * Dodo customer ↔ Company mapping (source: `_shared/customerService.ts`).
 * Inserts require service-role — Members only have SELECT on `billing_customers`
 * (ADR-0018 §3).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { getDodoClient, isBillingStub } from './dodo'
import { getAdminClient } from './supabase'
import { serverEnv } from './env'
import type { Database } from '#/integrations/supabase/types'

export type CustomerResult = {
  dodoCustomerId: string
  isNew: boolean
}

export async function getOrCreateDodoCustomer(
  companyId: string,
  billingEmail: string,
  billingName: string,
  billingAdminUserId: string,
): Promise<CustomerResult> {
  const admin = getAdminClient()

  const { data: existing, error: lookupError } = await admin
    .from('billing_customers')
    .select('dodo_customer_id')
    .eq('company_id', companyId)
    .maybeSingle()

  if (lookupError) {
    throw new Error(`Failed to lookup billing customer: ${lookupError.message}`)
  }

  if (existing?.dodo_customer_id) {
    return { dodoCustomerId: existing.dodo_customer_id, isNew: false }
  }

  let dodoCustomerId: string
  if (isBillingStub()) {
    dodoCustomerId = `stub_cus_${companyId.slice(0, 8)}`
  } else {
    const customer = await getDodoClient().customers.create({
      email: billingEmail,
      name: billingName,
      metadata: {
        talsek_company_id: companyId,
        environment: serverEnv.APP_ENV ?? 'development',
      },
    })
    dodoCustomerId = customer.customer_id
  }

  const { error: insertError } = await admin.from('billing_customers').insert({
    company_id: companyId,
    dodo_customer_id: dodoCustomerId,
    billing_email: billingEmail,
    billing_name: billingName,
    billing_admin_user_id: billingAdminUserId,
  })

  if (insertError) {
    if (insertError.code === '23505') {
      const { data: raceWinner } = await admin
        .from('billing_customers')
        .select('dodo_customer_id')
        .eq('company_id', companyId)
        .maybeSingle()
      if (raceWinner?.dodo_customer_id) {
        return { dodoCustomerId: raceWinner.dodo_customer_id, isNew: false }
      }
    }
    throw new Error(
      `Failed to create billing customer mapping: ${insertError.message}`,
    )
  }

  return { dodoCustomerId, isNew: true }
}

/** Load the Member's company_id from their profile (user-scoped RLS). */
export async function requireMemberCompanyId(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw new Error(`Failed to load profile: ${error.message}`)
  if (!data?.company_id) throw new Error('Member has no company')
  return data.company_id
}

/** Reverse lookup for webhook company resolution (service-role). */
export async function lookupCompanyByDodoCustomer(
  dodoCustomerId: string,
): Promise<string | null> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('billing_customers')
    .select('company_id')
    .eq('dodo_customer_id', dodoCustomerId)
    .maybeSingle()
  if (error) {
    console.error(
      'Failed to lookup company by Dodo customer:',
      error.message,
    )
    return null
  }
  return data?.company_id ?? null
}
