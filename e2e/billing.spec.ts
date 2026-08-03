import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

/**
 * Characterisation for Member billing (#13): checkout, cancel, top-up, invoice.
 * Runs against the new app with BILLING_STUB=1 (no live Dodo charges).
 */

async function signIn(page: Page) {
  await page.goto('/signin')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Email').fill(process.env.E2E_EMAIL!)
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

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

test.describe('billing', () => {
  test('member can open billing, checkout or cancel, top up, and download invoice', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    const { companyId, userId } = await memberCompanyId()
    const admin = adminClient()
    const seededPaymentId = randomUUID()
    const now = new Date()
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const stubIds: { subs: string[]; payments: string[] } = {
      subs: [],
      payments: [seededPaymentId],
    }

    const { data: starter } = await admin
      .from('billing_products_config')
      .select('dodo_product_id')
      .eq('plan_code', 'starter_monthly')
      .eq('is_active', true)
      .maybeSingle()
    if (!starter?.dodo_product_id) {
      throw new Error('starter_monthly product missing in billing_products_config')
    }

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

    const { error: payError } = await admin.from('billing_payments').insert({
      id: seededPaymentId,
      company_id: companyId,
      dodo_payment_id: `stub_e2e_pay_${seededPaymentId.slice(0, 8)}`,
      dodo_customer_id: `stub_e2e_cus_${companyId.slice(0, 8)}`,
      amount_cents: 5000,
      tax_amount_cents: 0,
      currency: 'USD',
      status: 'succeeded',
      payment_type: 'subscription',
      metadata: { plan_code: 'starter_monthly' },
    })
    if (payError) throw new Error(`seed payment failed: ${payError.message}`)

    // Ensure a wallet mandate for instant top-up (dual-track OK alongside normal).
    const { data: existingWallet } = await admin
      .from('billing_subscriptions')
      .select('id')
      .eq('company_id', companyId)
      .eq('plan_code', 'wallet_anchor')
      .eq('status', 'active')
      .maybeSingle()

    if (!existingWallet) {
      const walletId = randomUUID()
      stubIds.subs.push(walletId)
      const { error: walletError } = await admin
        .from('billing_subscriptions')
        .insert({
          id: walletId,
          company_id: companyId,
          dodo_subscription_id: `stub_e2e_wallet_${walletId.slice(0, 8)}`,
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
      if (walletError) {
        throw new Error(`seed wallet failed: ${walletError.message}`)
      }
    }

    // If no active normal plan, seed a stub Tier 1 so Cancel Plan is exercisable.
    const { data: existingNormal } = await admin
      .from('billing_subscriptions')
      .select('id, cancel_at_period_end')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .neq('plan_code', 'wallet_anchor')
      .maybeSingle()

    let seededNormalId: string | null = null
    if (!existingNormal) {
      seededNormalId = randomUUID()
      stubIds.subs.push(seededNormalId)
      const { error: subError } = await admin
        .from('billing_subscriptions')
        .insert({
          id: seededNormalId,
          company_id: companyId,
          dodo_subscription_id: `stub_e2e_sub_${seededNormalId.slice(0, 8)}`,
          dodo_product_id: starter.dodo_product_id,
          plan_code: 'starter_monthly',
          status: 'active',
          cancel_at_period_end: false,
          is_on_demand: false,
          quantity: 1,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          metadata: {},
        })
      if (subError) throw new Error(`seed sub failed: ${subError.message}`)
    }

    try {
      await signIn(page)

      await page.getByTestId('billing-nav').click()
      await expect(page).toHaveURL(/\/billing/)
      await expect(page.getByRole('heading', { name: 'Billing' })).toBeVisible()
      await expect(page.getByTestId('current-plan-card')).toBeVisible()
      await expect(page.getByTestId('current-plan-name')).not.toHaveText(
        'No Plan',
      )

      // Cancel normal plan (period-end) when not already pending.
      await page.getByTestId('view-plans-button').click()
      const cancelBtn = page.getByTestId(
        'plan-action-cancel_normal_subscription',
      )
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click()
        await expect(page.getByTestId('billing-banner')).toContainText(
          /cancelled at the end|already scheduled/i,
        )
      } else {
        // Already pending cancel — close dialog and continue.
        await page.keyboard.press('Escape')
      }

      // Instant top-up against wallet mandate (stub).
      await page.getByTestId('topup-amount-input').fill('5')
      await page.getByTestId('buy-credits-button').click()
      await page.getByTestId('confirm-topup-button').click()
      await expect(page.getByTestId('billing-banner')).toContainText(
        /Top-up initiated/i,
      )

      // Invoice download (stub PDF opens as blob popup).
      await page.getByTestId('invoices-tab').click()
      await expect(page.getByTestId('invoices-panel')).toBeVisible()
      const downloadButton = page.getByTestId(
        `download-invoice-${seededPaymentId}`,
      )
      await expect(downloadButton).toBeVisible()
      const popupPromise = page.waitForEvent('popup')
      await downloadButton.click()
      const popup = await popupPromise
      await expect(popup).toBeTruthy()
      await popup.close()

      // Subscribe checkout: remove stub normal sub if we created it so Start Now is free.
      if (seededNormalId) {
        await admin
          .from('billing_subscriptions')
          .delete()
          .eq('id', seededNormalId)
        stubIds.subs = stubIds.subs.filter((id) => id !== seededNormalId)
      } else {
        // Real normal sub may still be pending cancel — checkout is blocked; skip.
        return
      }

      await page.getByTestId('billing-tab').click()
      await page.reload()
      await page.getByTestId('view-plans-button').click()
      await page.getByTestId('plan-action-subscribe_tier1').click()
      await expect(page).toHaveURL(/\/billing\?.*status=succeeded/)
      await expect(page.getByTestId('billing-banner')).toContainText(
        /Payment successful/i,
      )
    } finally {
      if (stubIds.subs.length > 0) {
        await admin
          .from('billing_subscriptions')
          .delete()
          .in('id', stubIds.subs)
      }
      await admin
        .from('billing_payments')
        .delete()
        .in('id', stubIds.payments)
    }
  })
})
