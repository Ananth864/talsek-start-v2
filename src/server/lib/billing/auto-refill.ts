/**
 * Auto-refill cron logic (source: `supabase/functions/billing-auto-refill`).
 * Charges wallet mandates when balance is below threshold; credits land via
 * payment.succeeded (or stub grant under BILLING_STUB).
 */
import { getAdminClient } from '../supabase'
import {
  getDodoClient,
  isBillingStub,
  PLAN_CODES,
} from '../dodo'
import { grantCreditsForSucceededPayment } from './webhook'

export type AutoRefillResult = {
  company_id: string
  success: boolean
  payment_id?: string
  error?: string
}

export type AutoRefillSummary = {
  success: true
  message: string
  processed: number
  successful: number
  failed: number
  results: AutoRefillResult[]
}

type EligibleCompany = {
  company_id: string
  dodo_subscription_id: string
  auto_refill_amount_cents: number
  auto_refill_plan_code: string
  current_balance: number | bigint
}

/**
 * Prefer wallet_anchor when the RPC returns multiple active subs per company
 * (source RPC joins any active subscription; dual-track makes that ambiguous).
 */
function preferWalletAnchor(
  rows: EligibleCompany[],
  planBySubId: Map<string, string>,
): EligibleCompany[] {
  const byCompany = new Map<string, EligibleCompany[]>()
  for (const row of rows) {
    const list = byCompany.get(row.company_id) ?? []
    list.push(row)
    byCompany.set(row.company_id, list)
  }

  const selected: EligibleCompany[] = []
  for (const [, list] of byCompany) {
    const wallet = list.find(
      (r) => planBySubId.get(r.dodo_subscription_id) === PLAN_CODES.WALLET_ANCHOR,
    )
    // Never charge a normal plan — skip companies without an active wallet mandate.
    if (wallet) selected.push(wallet)
  }
  return selected
}

export async function runBillingAutoRefill(): Promise<AutoRefillSummary> {
  const admin = getAdminClient()
  const results: AutoRefillResult[] = []

  const { data: companiesNeedingRefill, error: queryError } = await admin.rpc(
    'get_companies_needing_auto_refill',
  )

  if (queryError) {
    throw new Error(`Failed to query companies: ${queryError.message}`)
  }

  if (companiesNeedingRefill.length === 0) {
    return {
      success: true,
      message: 'No companies need auto-refill',
      processed: 0,
      successful: 0,
      failed: 0,
      results: [],
    }
  }

  const rows: EligibleCompany[] = companiesNeedingRefill
  const subIds = [
    ...new Set(rows.map((c) => c.dodo_subscription_id).filter(Boolean)),
  ]
  const planBySubId = new Map<string, string>()
  if (subIds.length > 0) {
    const { data: subs } = await admin
      .from('billing_subscriptions')
      .select('dodo_subscription_id, plan_code')
      .in('dodo_subscription_id', subIds)
    for (const sub of subs ?? []) {
      planBySubId.set(sub.dodo_subscription_id, sub.plan_code)
    }
  }

  const companies = preferWalletAnchor(rows, planBySubId)

  for (const company of companies) {
    const {
      company_id,
      dodo_subscription_id,
      auto_refill_amount_cents,
    } = company

    try {
      const { data: lockAcquired, error: lockError } = await admin.rpc(
        'attempt_auto_refill_lock',
        { p_company_id: company_id },
      )

      if (lockError) {
        results.push({
          company_id,
          success: false,
          error: `Lock failed: ${lockError.message}`,
        })
        continue
      }

      if (!lockAcquired) {
        results.push({
          company_id,
          success: false,
          error: 'Lock not acquired - recently refilled',
        })
        continue
      }

      const creditsGranted = auto_refill_amount_cents
      const metadata = {
        talsek_company_id: company_id,
        amount_cents: String(auto_refill_amount_cents),
        credits_granted: String(creditsGranted),
        charge_type: 'auto_refill',
        subscription_id: dodo_subscription_id,
      }

      if (isBillingStub()) {
        const paymentId = `stub_auto_refill_${company_id.slice(0, 8)}_${Date.now()}`
        const { data: customer } = await admin
          .from('billing_customers')
          .select('dodo_customer_id')
          .eq('company_id', company_id)
          .maybeSingle()

        await grantCreditsForSucceededPayment(admin, {
          companyId: company_id,
          dodoPaymentId: paymentId,
          dodoCustomerId:
            customer?.dodo_customer_id ?? `stub_cus_${company_id.slice(0, 8)}`,
          dodoSubscriptionId: dodo_subscription_id,
          totalAmountCents: auto_refill_amount_cents,
          taxAmountCents: 0,
          currency: 'USD',
          metadata,
        })

        results.push({
          company_id,
          success: true,
          payment_id: paymentId,
        })
        continue
      }

      const charge = await getDodoClient().subscriptions.charge(
        dodo_subscription_id,
        {
          product_price: auto_refill_amount_cents,
          metadata,
        },
      )

      results.push({
        company_id,
        success: true,
        payment_id: charge.payment_id,
      })
    } catch (companyError) {
      const errorMessage =
        companyError instanceof Error
          ? companyError.message
          : String(companyError)
      results.push({
        company_id,
        success: false,
        error: errorMessage,
      })
    }
  }

  const successful = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  return {
    success: true,
    message: `Processed ${results.length} companies`,
    processed: results.length,
    successful,
    failed,
    results,
  }
}
