import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { Webhook } from 'standardwebhooks'

/**
 * #14 — signed Dodo webhook + CRON_SECRET-guarded auto-refill.
 * Uses BILLING_STUB for charge path; webhook signatures are real (standardwebhooks).
 */

function adminClient() {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for billing E2E',
    )
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function memberCompanyId(): Promise<{
  companyId: string
  userId: string
}> {
  const admin = adminClient()
  const email = process.env.E2E_EMAIL!
  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, company_id')
    .eq('email', email)
    .maybeSingle()
  if (error || !profile?.company_id) {
    throw new Error(`E2E member profile not found: ${error?.message}`)
  }
  return { companyId: profile.company_id, userId: profile.id }
}

function signWebhook(
  body: string,
  msgId = `msg_${randomUUID()}`,
): Record<string, string> {
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('DODO_PAYMENTS_WEBHOOK_SECRET required for webhook E2E')
  }
  const wh = new Webhook(secret)
  const timestamp = new Date()
  const signature = wh.sign(msgId, timestamp, body)
  return {
    'content-type': 'application/json',
    'webhook-id': msgId,
    'webhook-timestamp': String(Math.floor(timestamp.getTime() / 1000)),
    'webhook-signature': signature,
  }
}

test.describe('billing webhook + auto-refill cron', () => {
  test('unsigned webhook is rejected', async ({ request }) => {
    const res = await request.post('/api/webhooks/dodo', {
      data: { type: 'payment.succeeded' },
      headers: {
        'content-type': 'application/json',
        'webhook-id': `msg_${randomUUID()}`,
      },
    })
    expect(res.status()).toBe(401)
  })

  test('cron without CRON_SECRET is rejected', async ({ request }) => {
    const res = await request.get('/api/cron/billing-auto-refill')
    expect(res.status()).toBe(401)

    const resPost = await request.post('/api/cron/billing-auto-refill')
    expect(resPost.status()).toBe(401)
  })

  test('signed payment.succeeded grants credits', async ({ request }) => {
    test.setTimeout(60_000)
    const { companyId, userId } = await memberCompanyId()
    const admin = adminClient()
    const dodoCustomerId = `stub_e2e_wh_cus_${companyId.slice(0, 8)}`
    const dodoPaymentId = `stub_e2e_wh_pay_${randomUUID().slice(0, 8)}`
    const webhookId = `msg_${randomUUID()}`

    await admin.from('billing_customers').upsert(
      {
        company_id: companyId,
        dodo_customer_id: dodoCustomerId,
        billing_email: process.env.E2E_EMAIL!,
        billing_name: 'E2E Member',
        billing_admin_user_id: userId,
      },
      { onConflict: 'company_id' },
    )

    const payload = {
      type: 'payment.succeeded',
      data: {
        payment_id: dodoPaymentId,
        total_amount: 250,
        tax: 0,
        currency: 'USD',
        subscription_id: null,
        customer: { customer_id: dodoCustomerId },
        metadata: {
          talsek_company_id: companyId,
          charge_type: 'manual_topup',
          credits_granted: '250',
        },
      },
    }
    const body = JSON.stringify(payload)
    const headers = signWebhook(body, webhookId)

    try {
      const res = await request.post('/api/webhooks/dodo', {
        data: body,
        headers,
      })
      expect(res.status()).toBe(200)
      const json = await res.json()
      expect(json.received).toBe(true)

      const { data: payment } = await admin
        .from('billing_payments')
        .select('id, amount_cents, status')
        .eq('dodo_payment_id', dodoPaymentId)
        .maybeSingle()
      expect(payment?.status).toBe('succeeded')
      expect(payment?.amount_cents).toBe(250)

      const { data: ledger } = await admin
        .from('credit_ledger')
        .select('amount_initial, source_type')
        .eq('source_payment_id', payment!.id)
        .maybeSingle()
      expect(ledger?.amount_initial).toBe(250)
      expect(ledger?.source_type).toBe('topup')

      // Duplicate delivery is idempotent (same webhook-id, freshly signed).
      const dup = await request.post('/api/webhooks/dodo', {
        data: body,
        headers: signWebhook(body, webhookId),
      })
      expect(dup.status()).toBe(200)
      expect((await dup.json()).duplicate).toBe(true)
    } finally {
      const { data: payment } = await admin
        .from('billing_payments')
        .select('id')
        .eq('dodo_payment_id', dodoPaymentId)
        .maybeSingle()
      if (payment?.id) {
        await admin
          .from('credit_transactions')
          .delete()
          .eq('reference_id', payment.id)
        await admin
          .from('credit_ledger')
          .delete()
          .eq('source_payment_id', payment.id)
        await admin.from('billing_payments').delete().eq('id', payment.id)
      }
      await admin
        .from('processed_webhook_events')
        .delete()
        .eq('webhook_id', webhookId)
    }
  })

  test('auto-refill cron purchases credits below threshold under stub', async ({
    request,
  }) => {
    test.setTimeout(60_000)
    // Match playwright.config webServer injection when .env.local leaves it blank.
    const cronSecret =
      process.env.CRON_SECRET && process.env.CRON_SECRET.length > 0
        ? process.env.CRON_SECRET
        : 'e2e-cron-secret'

    const { companyId, userId } = await memberCompanyId()
    const admin = adminClient()
    const now = new Date()
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    let seededWalletId: string | null = null
    const paymentIdsToClean: string[] = []

    const { data: walletProduct } = await admin
      .from('billing_products_config')
      .select('dodo_product_id')
      .eq('plan_code', 'wallet_anchor')
      .eq('is_active', true)
      .maybeSingle()
    if (!walletProduct?.dodo_product_id) {
      throw new Error('wallet_anchor product missing')
    }

    await admin.from('billing_customers').upsert(
      {
        company_id: companyId,
        dodo_customer_id: `stub_e2e_cus_${companyId.slice(0, 8)}`,
        billing_email: process.env.E2E_EMAIL!,
        billing_name: 'E2E Member',
        billing_admin_user_id: userId,
      },
      { onConflict: 'company_id' },
    )

    const { data: existingWallet } = await admin
      .from('billing_subscriptions')
      .select('id, dodo_subscription_id')
      .eq('company_id', companyId)
      .eq('plan_code', 'wallet_anchor')
      .eq('status', 'active')
      .maybeSingle()

    if (!existingWallet) {
      seededWalletId = randomUUID()
      const { error } = await admin.from('billing_subscriptions').insert({
        id: seededWalletId,
        company_id: companyId,
        dodo_subscription_id: `stub_e2e_wallet_${seededWalletId.slice(0, 8)}`,
        dodo_product_id: walletProduct.dodo_product_id,
        plan_code: 'wallet_anchor',
        status: 'active',
        cancel_at_period_end: false,
        is_on_demand: true,
        quantity: 1,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        metadata: {},
      })
      if (error) throw new Error(`seed wallet failed: ${error.message}`)
    }

    // Threshold above any realistic balance so this company is always eligible.
    await admin.from('company_settings').upsert(
      {
        company_id: companyId,
        auto_refill_enabled: true,
        auto_refill_threshold_credits: 50_000_000,
        auto_refill_amount_cents: 100,
        last_auto_refill_at: '2000-01-01T00:00:00Z',
        updated_at: now.toISOString(),
      },
      { onConflict: 'company_id' },
    )

    const { data: balanceBefore } = await admin.rpc(
      'get_company_credit_balance',
      { p_company_id: companyId },
    )

    try {
      const res = await request.get('/api/cron/billing-auto-refill', {
        headers: { Authorization: `Bearer ${cronSecret}` },
      })
      expect(res.status()).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.successful).toBeGreaterThanOrEqual(1)

      const companyResult = json.results?.find(
        (r: { company_id: string }) => r.company_id === companyId,
      )
      expect(companyResult?.success).toBe(true)
      if (companyResult?.payment_id) {
        paymentIdsToClean.push(companyResult.payment_id)
      }

      const { data: balanceAfter } = await admin.rpc(
        'get_company_credit_balance',
        { p_company_id: companyId },
      )
      expect((balanceAfter as number) - (balanceBefore as number)).toBe(100)
    } finally {
      for (const dodoPaymentId of paymentIdsToClean) {
        const { data: payment } = await admin
          .from('billing_payments')
          .select('id')
          .eq('dodo_payment_id', dodoPaymentId)
          .maybeSingle()
        if (payment?.id) {
          await admin
            .from('credit_transactions')
            .delete()
            .eq('reference_id', payment.id)
          await admin
            .from('credit_ledger')
            .delete()
            .eq('source_payment_id', payment.id)
          await admin.from('billing_payments').delete().eq('id', payment.id)
        }
      }
      await admin
        .from('company_settings')
        .update({
          auto_refill_enabled: false,
          auto_refill_threshold_credits: 100,
          last_auto_refill_at: '2000-01-01T00:00:00Z',
        })
        .eq('company_id', companyId)
      if (seededWalletId) {
        await admin
          .from('billing_subscriptions')
          .delete()
          .eq('id', seededWalletId)
      }
    }
  })
})
