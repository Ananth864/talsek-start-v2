/**
 * Member billing server functions (ticket #13 / ADR-0018; Usage tab #30).
 * Ports source edge fns: create-checkout, change-plan, cancel-subscription,
 * billing-create-topup, get-invoice — plus the read hooks they feed.
 */
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth'
import { getAdminClient } from '../lib/supabase'
import {
  getOrCreateDodoCustomer,
  requireMemberCompanyId,
} from '../lib/billing-customer'
import { getDodoClient, isBillingStub, PLAN_CODES } from '../lib/dodo'
import {
  buildCategoryUsage,
  buildDailyUsage,
  buildJobUsageRows,
} from '#/lib/billing-usage'
import type { UsageStats } from '#/lib/billing-usage'
// ─── Shared helpers ──────────────────────────────────────────────────────

async function loadActiveProductByPlanCode(planCode: string) {
  const { data, error } = await getAdminClient()
    .from('billing_products_config')
    .select(
      'plan_code, dodo_product_id, display_name, price_cents, billing_period',
    )
    .eq('plan_code', planCode)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw new Error(`Failed to validate product: ${error.message}`)
  if (!data?.plan_code || !data.dodo_product_id) {
    throw new Error('Invalid or inactive product')
  }
  return data
}

export type SubscriptionInfo = {
  id: string
  dodo_subscription_id: string
  plan_code: string
  status: string
  cancel_at_period_end: boolean
  current_period_end: string | null
  is_on_demand: boolean
  price_cents: number | null
  billing_period: string | null
  display_name: string | null
}

export type ActiveSubscriptions = {
  walletAnchor: SubscriptionInfo | null
  normalSubscription: SubscriptionInfo | null
  hasMandateEstablished: boolean
  hasActiveNormalSubscription: boolean
  currentNormalPlanCode: string | null
  isPendingCancellation: boolean
}

export type BillingPaymentRow = {
  id: string
  dodo_payment_id: string
  amount_cents: number
  tax_amount_cents: number
  currency: string
  status: string
  payment_type: string
  created_at: string
  metadata: {
    plan_code?: string
    charge_type?: string
    credits_granted?: string
  }
}

// ─── Reads ───────────────────────────────────────────────────────────────

export const fetchCreditBalance = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const companyId = await requireMemberCompanyId(
      context.supabase,
      context.session.user.id,
    )
    const { data, error } = await context.supabase.rpc(
      'get_company_credit_balance',
      { p_company_id: companyId },
    )
    if (error) throw new Error(`Failed to load credit balance: ${error.message}`)
    return { companyId, balance: typeof data === 'number' ? data : 0 }
  })

export const fetchActiveSubscriptions = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ActiveSubscriptions> => {
    const companyId = await requireMemberCompanyId(
      context.supabase,
      context.session.user.id,
    )

    const { data, error } = await context.supabase
      .from('billing_subscriptions')
      .select(
        `id, dodo_subscription_id, plan_code, status, cancel_at_period_end,
         current_period_end, is_on_demand, dodo_product_id`,
      )
      .eq('company_id', companyId)
      .in('status', ['active', 'on_hold'])

    if (error) {
      throw new Error(`Failed to load subscriptions: ${error.message}`)
    }

    const rows = data
    const productIds = rows.map((s) => s.dodo_product_id).filter(Boolean)
    const productConfigs: Record<
      string,
      {
        price_cents: number
        billing_period: string | null
        display_name: string
      }
    > = {}

    if (productIds.length > 0) {
      const { data: configs } = await context.supabase
        .from('billing_products_config')
        .select('dodo_product_id, price_cents, billing_period, display_name')
        .in('dodo_product_id', productIds)
      for (const cfg of configs ?? []) {
        productConfigs[cfg.dodo_product_id] = {
          price_cents: cfg.price_cents,
          billing_period: cfg.billing_period,
          display_name: cfg.display_name,
        }
      }
    }

    const enriched: SubscriptionInfo[] = rows.map((s) => {
      if (Object.hasOwn(productConfigs, s.dodo_product_id)) {
        const config = productConfigs[s.dodo_product_id]
        return {
          id: s.id,
          dodo_subscription_id: s.dodo_subscription_id,
          plan_code: s.plan_code,
          status: s.status,
          cancel_at_period_end: s.cancel_at_period_end,
          current_period_end: s.current_period_end,
          is_on_demand: s.is_on_demand,
          price_cents: config.price_cents,
          billing_period: config.billing_period,
          display_name: config.display_name,
        }
      }
      return {
        id: s.id,
        dodo_subscription_id: s.dodo_subscription_id,
        plan_code: s.plan_code,
        status: s.status,
        cancel_at_period_end: s.cancel_at_period_end,
        current_period_end: s.current_period_end,
        is_on_demand: s.is_on_demand,
        price_cents: null,
        billing_period: null,
        display_name: null,
      }
    })

    const walletAnchor =
      enriched.find((s) => s.plan_code === PLAN_CODES.WALLET_ANCHOR) ?? null
    const normalSubscription =
      enriched.find((s) => s.plan_code !== PLAN_CODES.WALLET_ANCHOR) ?? null

    return {
      walletAnchor,
      normalSubscription,
      hasMandateEstablished:
        walletAnchor?.status === 'active' ||
        walletAnchor?.status === 'on_hold',
      hasActiveNormalSubscription:
        normalSubscription?.status === 'active' ||
        normalSubscription?.status === 'on_hold',
      currentNormalPlanCode: normalSubscription?.plan_code ?? null,
      isPendingCancellation:
        normalSubscription?.cancel_at_period_end ?? false,
    }
  })

export const fetchCompanyPayments = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<BillingPaymentRow[]> => {
    const companyId = await requireMemberCompanyId(
      context.supabase,
      context.session.user.id,
    )
    const { data, error } = await context.supabase
      .from('billing_payments')
      .select(
        `id, dodo_payment_id, amount_cents, tax_amount_cents, currency,
         status, payment_type, created_at, metadata`,
      )
      .eq('company_id', companyId)
      .in('status', ['succeeded', 'failed', 'refunded'])
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Failed to load payments: ${error.message}`)

    return data.map((row) => {
      const meta =
        row.metadata &&
        typeof row.metadata === 'object' &&
        !Array.isArray(row.metadata)
          ? (row.metadata as Record<string, unknown>)
          : {}
      return {
        id: row.id,
        dodo_payment_id: row.dodo_payment_id,
        amount_cents: row.amount_cents,
        tax_amount_cents: row.tax_amount_cents,
        currency: row.currency,
        status: row.status,
        payment_type: row.payment_type,
        created_at: row.created_at,
        metadata: {
          plan_code:
            typeof meta.plan_code === 'string' ? meta.plan_code : undefined,
          charge_type:
            typeof meta.charge_type === 'string' ? meta.charge_type : undefined,
          credits_granted:
            typeof meta.credits_granted === 'string'
              ? meta.credits_granted
              : undefined,
        },
      }
    })
  })

export const fetchServiceRates = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const companyId = await requireMemberCompanyId(
      context.supabase,
      context.session.user.id,
    )
    const { data, error } = await context.supabase.rpc(
      'get_company_service_rates',
      { p_company_id: companyId },
    )
    if (error) throw new Error(`Failed to load service rates: ${error.message}`)
    const row = Array.isArray(data) && data.length > 0 ? data[0] : undefined
    return {
      resume_screening_cost: row ? row.resume_screening_cost : 5,
      screening_interview_cost: row ? row.screening_interview_cost : 40,
      plan_name: row ? row.plan_name : 'Pay as you go',
    }
  })

export type { UsageStats }

/**
 * Aggregates credit_transactions for the Usage tab (source useUsageStats).
 * Daily series = last 14 days; category + per-Job = all-time consumption.
 */
export const fetchUsageStats = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<UsageStats> => {
    const companyId = await requireMemberCompanyId(
      context.supabase,
      context.session.user.id,
    )
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const [dailyResult, categoryResult, jobsResult, resumeTxResult, interviewTxResult] =
      await Promise.all([
        context.supabase
          .from('credit_transactions')
          .select('amount, created_at, transaction_type')
          .eq('company_id', companyId)
          .in('transaction_type', [
            'resume_screening',
            'screening_interview',
            'consume',
          ])
          .gte('created_at', fourteenDaysAgo.toISOString())
          .order('created_at', { ascending: true }),
        context.supabase
          .from('credit_transactions')
          .select('amount, transaction_type')
          .eq('company_id', companyId)
          .in('transaction_type', ['resume_screening', 'screening_interview']),
        context.supabase
          .from('jobs')
          .select('id, title')
          .eq('company_id', companyId)
          .eq('status', 'active'),
        context.supabase
          .from('credit_transactions')
          .select('amount, reference_id')
          .eq('company_id', companyId)
          .eq('transaction_type', 'resume_screening')
          .eq('reference_type', 'job_application'),
        context.supabase
          .from('credit_transactions')
          .select('amount, reference_id')
          .eq('company_id', companyId)
          .eq('transaction_type', 'screening_interview')
          .eq('reference_type', 'interview_session'),
      ])

    if (dailyResult.error) {
      throw new Error(
        `Failed to load daily usage: ${dailyResult.error.message}`,
      )
    }
    if (categoryResult.error) {
      throw new Error(
        `Failed to load category usage: ${categoryResult.error.message}`,
      )
    }
    if (jobsResult.error) {
      throw new Error(`Failed to load jobs for usage: ${jobsResult.error.message}`)
    }
    if (resumeTxResult.error) {
      throw new Error(
        `Failed to load resume usage: ${resumeTxResult.error.message}`,
      )
    }
    if (interviewTxResult.error) {
      throw new Error(
        `Failed to load interview usage: ${interviewTxResult.error.message}`,
      )
    }

    let resumeCredits = 0
    let interviewCredits = 0
    for (const tx of categoryResult.data) {
      const credits = Math.abs(tx.amount)
      if (tx.transaction_type === 'resume_screening') resumeCredits += credits
      else if (tx.transaction_type === 'screening_interview') {
        interviewCredits += credits
      }
    }

    const resumeByJob = new Map<string, { credits: number; count: number }>()
    const resumeTxs = resumeTxResult.data
    const appIds = resumeTxs
      .map((t) => t.reference_id)
      .filter((id): id is string => Boolean(id))
    if (appIds.length > 0) {
      const { data: apps, error: appsError } = await context.supabase
        .from('job_applications')
        .select('id, job_id')
        .in('id', appIds)
      if (appsError) {
        throw new Error(
          `Failed to resolve Job Applications for usage: ${appsError.message}`,
        )
      }
      const appToJob = new Map(
        apps.map((app) => [app.id, app.job_id] as const),
      )
      for (const tx of resumeTxs) {
        const jobId = tx.reference_id
          ? appToJob.get(tx.reference_id)
          : undefined
        if (!jobId) continue
        const current = resumeByJob.get(jobId) ?? { credits: 0, count: 0 }
        current.credits += Math.abs(tx.amount)
        current.count += 1
        resumeByJob.set(jobId, current)
      }
    }

    const interviewByJob = new Map<string, { credits: number; count: number }>()
    const interviewTxs = interviewTxResult.data
    const sessionIds = interviewTxs
      .map((t) => t.reference_id)
      .filter((id): id is string => Boolean(id))
    if (sessionIds.length > 0) {
      const { data: sessions, error: sessionsError } = await context.supabase
        .from('interview_sessions')
        .select('id, job_id')
        .in('id', sessionIds)
      if (sessionsError) {
        throw new Error(
          `Failed to resolve Interview Sessions for usage: ${sessionsError.message}`,
        )
      }
      const sessionToJob = new Map(
        sessions.map((s) => [s.id, s.job_id] as const),
      )
      for (const tx of interviewTxs) {
        const jobId = tx.reference_id
          ? sessionToJob.get(tx.reference_id)
          : undefined
        if (!jobId) continue
        const current = interviewByJob.get(jobId) ?? { credits: 0, count: 0 }
        current.credits += Math.abs(tx.amount)
        current.count += 1
        interviewByJob.set(jobId, current)
      }
    }

    const categoryData = buildCategoryUsage(resumeCredits, interviewCredits)
    return {
      dailyUsage: buildDailyUsage(dailyResult.data),
      categoryData,
      jobUsageData: buildJobUsageRows(
        jobsResult.data,
        resumeByJob,
        interviewByJob,
      ),
      totalCreditsUsed: resumeCredits + interviewCredits,
    }
  })

// ─── Mutations ───────────────────────────────────────────────────────────

const createCheckoutInput = z.object({
  planCode: z.string().min(1),
  quantity: z.number().int().positive().optional().default(1),
  amountCents: z.number().int().nonnegative().optional(),
  returnUrl: z.string().url(),
  billingEmail: z.string().email().optional(),
  billingName: z.string().min(1).optional(),
})

export const createCheckout = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(createCheckoutInput)
  .handler(async ({ context, data }) => {
    const user = context.session.user
    const email = data.billingEmail ?? user.email
    if (!email) throw new Error('Billing email is required')

    const { data: profile, error: profileError } = await context.supabase
      .from('profiles')
      .select('company_id, first_name, last_name, companies(name)')
      .eq('id', user.id)
      .maybeSingle()
    if (profileError) {
      throw new Error(`Failed to load profile: ${profileError.message}`)
    }
    if (!profile?.company_id) throw new Error('Member has no company')
    const companyId = profile.company_id

    const companyName = profile.companies?.name ?? 'Company'
    const fromProfile = `${profile.first_name} ${profile.last_name}`.trim()
    const billingName = data.billingName ?? (fromProfile || companyName)

    const product = await loadActiveProductByPlanCode(data.planCode)

    const isWalletAnchor = product.plan_code === PLAN_CODES.WALLET_ANCHOR
    const isNormalSubscription = !isWalletAnchor

    if (isNormalSubscription) {
      const { data: existingNormalSub } = await context.supabase
        .from('billing_subscriptions')
        .select('id, plan_code, cancel_at_period_end')
        .eq('company_id', companyId)
        .in('status', ['active', 'on_hold'])
        .neq('plan_code', PLAN_CODES.WALLET_ANCHOR)
        .maybeSingle()

      if (existingNormalSub) {
        if (existingNormalSub.cancel_at_period_end) {
          throw new Error(
            'You have a subscription pending cancellation. Please undo the cancellation or wait until the end of your billing period.',
          )
        }
        throw new Error(
          'You already have an active subscription. Use the Change Plan feature to upgrade or downgrade.',
        )
      }
    }

    if (isWalletAnchor) {
      const { data: existingWallet } = await context.supabase
        .from('billing_subscriptions')
        .select('id')
        .eq('company_id', companyId)
        .eq('plan_code', PLAN_CODES.WALLET_ANCHOR)
        .in('status', ['active', 'on_hold'])
        .maybeSingle()
      if (existingWallet) {
        throw new Error(
          'Payment mandate already established. Please use the top-up function instead.',
        )
      }
    }

    const { dodoCustomerId } = await getOrCreateDodoCustomer(
      companyId,
      email,
      billingName,
      user.id,
    )

    const metadata: Record<string, string> = {
      talsek_company_id: companyId,
      plan_code: product.plan_code,
    }
    const finalAmountCents = data.amountCents ?? 0
    if (isWalletAnchor) {
      metadata.charge_type = 'manual_topup'
      metadata.amount_cents = String(finalAmountCents)
      metadata.credits_granted = String(finalAmountCents)
    }

    if (isBillingStub()) {
      return {
        checkoutUrl: `${data.returnUrl}${data.returnUrl.includes('?') ? '&' : '?'}status=succeeded&stub=1`,
        sessionId: `stub_session_${Date.now()}`,
      }
    }

    const sessionConfig: Parameters<
      ReturnType<typeof getDodoClient>['checkoutSessions']['create']
    >[0] & {
      subscription_data?: {
        on_demand?: { mandate_only: boolean; product_price?: number }
      }
    } = {
      product_cart: [
        { product_id: product.dodo_product_id, quantity: data.quantity },
      ],
      customer: { customer_id: dodoCustomerId },
      return_url: data.returnUrl,
      metadata,
    }

    if (isWalletAnchor) {
      sessionConfig.subscription_data = {
        on_demand: {
          mandate_only: false,
          product_price: finalAmountCents,
        },
      }
    }

    const session = await getDodoClient().checkoutSessions.create(sessionConfig)
    return {
      checkoutUrl: session.checkout_url,
      sessionId: session.session_id,
    }
  })

const changePlanInput = z.object({
  newPlanCode: z.string().min(1),
})

export const changePlan = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(changePlanInput)
  .handler(async ({ context, data }) => {
    const companyId = await requireMemberCompanyId(
      context.supabase,
      context.session.user.id,
    )

    const { data: subscription, error: fetchError } = await context.supabase
      .from('billing_subscriptions')
      .select('id, dodo_subscription_id, plan_code, cancel_at_period_end')
      .eq('company_id', companyId)
      .in('status', ['active', 'on_hold'])
      .neq('plan_code', PLAN_CODES.WALLET_ANCHOR)
      .maybeSingle()

    if (fetchError) {
      throw new Error(`Failed to lookup subscription: ${fetchError.message}`)
    }
    if (!subscription) {
      throw new Error(
        'No active subscription found to change. Please subscribe to a plan first.',
      )
    }

    const newProduct = await loadActiveProductByPlanCode(data.newPlanCode)

    if (newProduct.plan_code === PLAN_CODES.WALLET_ANCHOR) {
      throw new Error(
        'Cannot change to wallet anchor plan. Use the downgrade to free option instead.',
      )
    }

    if (newProduct.plan_code === subscription.plan_code) {
      return {
        success: true as const,
        message: `You are already on the ${newProduct.display_name} plan`,
        alreadyOnPlan: true,
        newPlanCode: newProduct.plan_code,
      }
    }

    if (isBillingStub()) {
      return {
        success: true as const,
        message: `Plan change to ${newProduct.display_name} initiated. Your subscription will be updated shortly.`,
        newPlanCode: newProduct.plan_code,
      }
    }

    await getDodoClient().subscriptions.changePlan(
      subscription.dodo_subscription_id,
      {
        product_id: newProduct.dodo_product_id,
        quantity: 1,
        proration_billing_mode: 'full_immediately',
      },
    )

    return {
      success: true as const,
      message: `Plan change to ${newProduct.display_name} initiated. Your subscription will be updated shortly.`,
      newPlanCode: newProduct.plan_code,
    }
  })

const cancelSubscriptionInput = z.object({
  subscriptionId: z.string().uuid(),
})

export const cancelSubscription = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(cancelSubscriptionInput)
  .handler(async ({ context, data }) => {
    const companyId = await requireMemberCompanyId(
      context.supabase,
      context.session.user.id,
    )

    const { data: subscription, error: fetchError } = await context.supabase
      .from('billing_subscriptions')
      .select('dodo_subscription_id, status, plan_code, cancel_at_period_end')
      .eq('id', data.subscriptionId)
      .eq('company_id', companyId)
      .maybeSingle()

    if (fetchError || !subscription) {
      throw new Error('Subscription not found')
    }
    if (subscription.status !== 'active') {
      throw new Error(
        `Subscription is not active (current status: ${subscription.status})`,
      )
    }

    const isWalletAnchor = subscription.plan_code === PLAN_CODES.WALLET_ANCHOR
    const admin = getAdminClient()

    if (isWalletAnchor) {
      if (!isBillingStub()) {
        await getDodoClient().subscriptions.update(
          subscription.dodo_subscription_id,
          { status: 'cancelled' },
        )
      }
      await admin
        .from('billing_subscriptions')
        .update({
          status: 'cancelled',
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.subscriptionId)
        .eq('company_id', companyId)

      return {
        success: true as const,
        message: 'Payment mandate has been cancelled.',
        immediate: true,
      }
    }

    if (subscription.cancel_at_period_end) {
      return {
        success: true as const,
        message:
          'Subscription is already scheduled for cancellation at the end of the billing period',
        alreadyPending: true,
      }
    }

    if (!isBillingStub()) {
      await getDodoClient().subscriptions.update(
        subscription.dodo_subscription_id,
        { cancel_at_next_billing_date: true },
      )
    }

    await admin
      .from('billing_subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.subscriptionId)
      .eq('company_id', companyId)

    return {
      success: true as const,
      message:
        'Subscription will be cancelled at the end of the billing period',
    }
  })

const createTopupInput = z.object({
  amountCents: z
    .number()
    .int()
    .positive()
    .min(100, 'Minimum top-up amount is $1.00 (100 cents)'),
})

export const createTopup = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(createTopupInput)
  .handler(async ({ context, data }) => {
    const companyId = await requireMemberCompanyId(
      context.supabase,
      context.session.user.id,
    )

    // Prefer wallet_anchor mandate (dual-track); fall back to any active sub.
    const { data: walletSub } = await context.supabase
      .from('billing_subscriptions')
      .select('dodo_subscription_id')
      .eq('company_id', companyId)
      .eq('plan_code', PLAN_CODES.WALLET_ANCHOR)
      .eq('status', 'active')
      .maybeSingle()

    const { data: anySub } = walletSub
      ? { data: walletSub }
      : await context.supabase
          .from('billing_subscriptions')
          .select('dodo_subscription_id')
          .eq('company_id', companyId)
          .eq('status', 'active')
          .maybeSingle()

    if (!anySub) {
      throw new Error(
        'No active subscription found. Please complete checkout first.',
      )
    }

    const creditsGranted = data.amountCents

    if (isBillingStub()) {
      return {
        success: true as const,
        paymentId: `stub_pay_${Date.now()}`,
        message:
          'Top-up initiated. Credits will be added once payment is confirmed.',
        creditsGranted,
      }
    }

    const charge = await getDodoClient().subscriptions.charge(
      anySub.dodo_subscription_id,
      {
        product_price: data.amountCents,
        metadata: {
          talsek_company_id: companyId,
          amount_cents: String(data.amountCents),
          credits_granted: String(creditsGranted),
          charge_type: 'manual_topup',
        },
      },
    )

    return {
      success: true as const,
      paymentId: charge.payment_id,
      message:
        'Top-up initiated. Credits will be added once payment is confirmed.',
      creditsGranted,
    }
  })

const getInvoiceInput = z.object({
  paymentId: z.string().uuid(),
})

/** Minimal valid PDF used under BILLING_STUB. */
const STUB_PDF_BASE64 =
  'JVBERi0xLjEKJcKlCjEgMCBvYmo8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PmVuZG9iagoyIDAgb2JqPDwvVHlwZS9QYWdlcy9LaWRzWzMgMCBSXS9Db3VudCAxPj5lbmRvYmoKMyAwIG9iajw8L1R5cGUvUGFnZS9QYXJlbnQgMiAwIFIvTWVkaWFCb3hbMCAwIDMwMCAxNDRdPj5lbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTIgMDAwMDAgbiAKMDAwMDAwMDEwMSAwMDAwMCBuIAp0cmFpbGVyPDwvU2l6ZSA0L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMjE0CiUlRU9GCg=='

export const getInvoicePdf = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(getInvoiceInput)
  .handler(async ({ context, data }) => {
    const companyId = await requireMemberCompanyId(
      context.supabase,
      context.session.user.id,
    )

    const { data: payment, error } = await context.supabase
      .from('billing_payments')
      .select('dodo_payment_id, company_id')
      .eq('id', data.paymentId)
      .maybeSingle()

    if (error || !payment) throw new Error('Payment not found')
    if (payment.company_id !== companyId) {
      throw new Error('Access denied to this invoice')
    }

    if (isBillingStub() || payment.dodo_payment_id.startsWith('stub_')) {
      return {
        pdfBase64: STUB_PDF_BASE64,
        filename: `invoice-${data.paymentId}.pdf`,
      }
    }

    const invoiceResponse = await getDodoClient().invoices.payments.retrieve(
      payment.dodo_payment_id,
    )
    const pdfBlob = await invoiceResponse.blob()
    const buffer = Buffer.from(await pdfBlob.arrayBuffer())

    return {
      pdfBase64: buffer.toString('base64'),
      filename: `invoice-${data.paymentId}.pdf`,
    }
  })

// ─── Auto-refill settings (#14) ──────────────────────────────────────────

export type BillingSettingsRow = {
  company_id: string
  auto_refill_enabled: boolean
  auto_refill_threshold_credits: number
  auto_refill_amount_cents: number
  low_balance_alert_threshold: number
  last_auto_refill_at: string
}

export const fetchBillingSettings = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<BillingSettingsRow | null> => {
    await requireMemberCompanyId(
      context.supabase,
      context.session.user.id,
    )
    // Company scoping via RLS (ADR-0004) — no manual .eq('company_id').
    const { data, error } = await context.supabase
      .from('company_settings')
      .select(
        `company_id, auto_refill_enabled, auto_refill_threshold_credits,
         auto_refill_amount_cents, low_balance_alert_threshold, last_auto_refill_at`,
      )
      .maybeSingle()
    if (error) {
      throw new Error(`Failed to load billing settings: ${error.message}`)
    }
    return data
  })

const updateBillingSettingsInput = z.object({
  auto_refill_enabled: z.boolean(),
  auto_refill_threshold_credits: z.number().int().min(50).max(10000),
  auto_refill_amount_cents: z
    .number()
    .int()
    .min(100, 'Minimum auto-refill amount is $1.00'),
})

export const updateBillingSettings = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(updateBillingSettingsInput)
  .handler(async ({ context, data }): Promise<BillingSettingsRow> => {
    const companyId = await requireMemberCompanyId(
      context.supabase,
      context.session.user.id,
    )

    // User-scoped writes — RLS `user_is_company_admin` gates UPDATE/INSERT
    // (ADR-0004 / ADR-0019 §7). Do not bypass with getAdminClient.
    const { data: existing } = await context.supabase
      .from('company_settings')
      .select('company_id')
      .maybeSingle()

    if (existing) {
      const { data: updated, error } = await context.supabase
        .from('company_settings')
        .update({
          auto_refill_enabled: data.auto_refill_enabled,
          auto_refill_threshold_credits: data.auto_refill_threshold_credits,
          auto_refill_amount_cents: data.auto_refill_amount_cents,
          updated_at: new Date().toISOString(),
        })
        .eq('company_id', companyId)
        .select(
          `company_id, auto_refill_enabled, auto_refill_threshold_credits,
           auto_refill_amount_cents, low_balance_alert_threshold, last_auto_refill_at`,
        )
        .single()
      if (error) {
        throw new Error(`Failed to update billing settings: ${error.message}`)
      }
      return updated
    }

    const { data: inserted, error } = await context.supabase
      .from('company_settings')
      .insert({
        company_id: companyId,
        auto_refill_enabled: data.auto_refill_enabled,
        auto_refill_threshold_credits: data.auto_refill_threshold_credits,
        auto_refill_amount_cents: data.auto_refill_amount_cents,
      })
      .select(
        `company_id, auto_refill_enabled, auto_refill_threshold_credits,
         auto_refill_amount_cents, low_balance_alert_threshold, last_auto_refill_at`,
      )
      .single()
    if (error) {
      throw new Error(`Failed to create billing settings: ${error.message}`)
    }
    return inserted
  })
