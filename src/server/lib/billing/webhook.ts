/**
 * Dodo webhook event processing (source: `supabase/functions/dodo-webhook`).
 * Sole writer of billing subscription/payment/credit state (ADR-0019).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  DisputeOpenedWebhookEvent,
  PaymentCancelledWebhookEvent,
  PaymentFailedWebhookEvent,
  PaymentSucceededWebhookEvent,
  RefundFailedWebhookEvent,
  RefundSucceededWebhookEvent,
  SubscriptionActiveWebhookEvent,
  SubscriptionCancelledWebhookEvent,
  SubscriptionPlanChangedWebhookEvent,
  SubscriptionRenewedWebhookEvent,
  SubscriptionUpdatedWebhookEvent,
  UnwrapWebhookEvent,
} from 'dodopayments/resources'
import type { Database, Json } from '#/integrations/supabase/types'
import { lookupCompanyByDodoCustomer } from '../billing-customer'
import { PLAN_CODES } from '../dodo'

type AdminClient = SupabaseClient<Database>
type SubscriptionStatus = Database['public']['Enums']['subscription_status_enum']
type Meta = Partial<Record<string, string>>

function asMetadata(
  value: Record<string, string | number | boolean> | null | undefined,
): Meta {
  if (!value) return {}
  const out: Meta = {}
  for (const [key, v] of Object.entries(value)) {
    out[key] = String(v)
  }
  return out
}

function metaAsJson(metadata: Meta): Json {
  return metadata
}

function extractCustomerId(event: UnwrapWebhookEvent): string | undefined {
  if (!('data' in event)) return undefined
  const data = event.data as unknown as {
    customer?: { customer_id?: string }
  }
  return data.customer?.customer_id
}

function extractSubscriptionId(event: UnwrapWebhookEvent): string | undefined {
  if (!('data' in event)) return undefined
  const data = event.data as unknown as { subscription_id?: string }
  return data.subscription_id
}

function extractPaymentId(event: UnwrapWebhookEvent): string | undefined {
  if (!('data' in event)) return undefined
  const data = event.data as unknown as { payment_id?: string }
  return data.payment_id
}

async function resolveCompanyId(
  metadata: Meta,
  customerId: string,
): Promise<string> {
  const fromMeta = metadata.talsek_company_id
  const companyId =
    fromMeta && fromMeta.length > 0
      ? fromMeta
      : await lookupCompanyByDodoCustomer(customerId)
  if (!companyId) {
    throw new Error(`Company not found for customer: ${customerId}`)
  }
  return companyId
}

async function resolvePlanCode(
  admin: AdminClient,
  dodoProductId: string,
  metadata: Meta,
): Promise<string> {
  const { data, error } = await admin
    .from('billing_products_config')
    .select('plan_code')
    .eq('dodo_product_id', dodoProductId)
    .maybeSingle()
  if (error) {
    console.warn('Product lookup error:', error.message)
  }
  if (data?.plan_code) return data.plan_code
  if (metadata.plan_code) return metadata.plan_code
  return 'unknown'
}

async function handleSubscriptionActive(
  admin: AdminClient,
  event: SubscriptionActiveWebhookEvent,
): Promise<void> {
  const subscription = event.data
  const metadata = asMetadata(subscription.metadata)
  const customerId = subscription.customer.customer_id
  const companyId = await resolveCompanyId(metadata, customerId)
  const planCode = await resolvePlanCode(
    admin,
    subscription.product_id,
    metadata,
  )
  const isOnDemand = planCode === PLAN_CODES.WALLET_ANCHOR

  const { error } = await admin.from('billing_subscriptions').upsert(
    {
      company_id: companyId,
      dodo_subscription_id: subscription.subscription_id,
      dodo_product_id: subscription.product_id,
      plan_code: planCode,
      status: subscription.status,
      is_on_demand: isOnDemand,
      current_period_start: subscription.previous_billing_date,
      current_period_end: subscription.next_billing_date,
      metadata: metaAsJson(metadata),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'dodo_subscription_id' },
  )
  if (error) {
    throw new Error(`subscription.active upsert failed: ${error.message}`)
  }
}

async function handleSubscriptionRenewed(
  admin: AdminClient,
  event: SubscriptionRenewedWebhookEvent,
): Promise<void> {
  const subscription = event.data
  const { error } = await admin
    .from('billing_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: subscription.previous_billing_date,
      current_period_end: subscription.next_billing_date,
      updated_at: new Date().toISOString(),
    })
    .eq('dodo_subscription_id', subscription.subscription_id)
  if (error) {
    throw new Error(`subscription.renewed update failed: ${error.message}`)
  }
}

async function handleSubscriptionUpdated(
  admin: AdminClient,
  event: SubscriptionUpdatedWebhookEvent,
): Promise<void> {
  const subscription = event.data
  const { error } = await admin
    .from('billing_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: subscription.previous_billing_date,
      current_period_end: subscription.next_billing_date,
      metadata: metaAsJson(asMetadata(subscription.metadata)),
      updated_at: new Date().toISOString(),
    })
    .eq('dodo_subscription_id', subscription.subscription_id)
  if (error) {
    throw new Error(`subscription.updated update failed: ${error.message}`)
  }
}

async function handleSubscriptionCancelled(
  admin: AdminClient,
  event: SubscriptionCancelledWebhookEvent,
): Promise<void> {
  const subscription = event.data
  const { error } = await admin
    .from('billing_subscriptions')
    .update({
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_next_billing_date,
      updated_at: new Date().toISOString(),
    })
    .eq('dodo_subscription_id', subscription.subscription_id)
  if (error) {
    throw new Error(`subscription.cancelled update failed: ${error.message}`)
  }
}

async function handleSubscriptionStatusOnly(
  admin: AdminClient,
  dodoSubscriptionId: string,
  status: SubscriptionStatus,
  label: string,
): Promise<void> {
  const { error } = await admin
    .from('billing_subscriptions')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('dodo_subscription_id', dodoSubscriptionId)
  if (error) {
    throw new Error(`${label} update failed: ${error.message}`)
  }
}

async function handleSubscriptionPlanChanged(
  admin: AdminClient,
  event: SubscriptionPlanChangedWebhookEvent,
): Promise<void> {
  const subscription = event.data
  const metadata = asMetadata(subscription.metadata)
  const customerId = subscription.customer.customer_id
  const companyId = await resolveCompanyId(metadata, customerId)
  const planCode = await resolvePlanCode(
    admin,
    subscription.product_id,
    metadata,
  )
  const isOnDemand = planCode === PLAN_CODES.WALLET_ANCHOR

  if (planCode.startsWith('ent_')) {
    await admin
      .from('billing_subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('company_id', companyId)
      .eq('status', 'active')
      .neq('plan_code', PLAN_CODES.WALLET_ANCHOR)
      .neq('dodo_subscription_id', subscription.subscription_id)
  }

  const { error } = await admin.from('billing_subscriptions').upsert(
    {
      company_id: companyId,
      dodo_subscription_id: subscription.subscription_id,
      dodo_product_id: subscription.product_id,
      plan_code: planCode,
      status: subscription.status,
      is_on_demand: isOnDemand,
      current_period_start: subscription.previous_billing_date,
      current_period_end: subscription.next_billing_date,
      cancel_at_period_end: false,
      metadata: metaAsJson(metadata),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'dodo_subscription_id' },
  )
  if (error) {
    throw new Error(`subscription.plan_changed upsert failed: ${error.message}`)
  }
}

/**
 * Record a succeeded payment and grant credits (1¢ = 1 credit, 365d expiry).
 * Exported for BILLING_STUB auto-refill to simulate the webhook credit path.
 */
export async function grantCreditsForSucceededPayment(
  admin: AdminClient,
  input: {
    companyId: string
    dodoPaymentId: string
    dodoCustomerId: string
    dodoSubscriptionId: string | null
    totalAmountCents: number
    taxAmountCents: number
    currency: string
    metadata: Meta
  },
): Promise<void> {
  const preTaxAmountCents = input.totalAmountCents - input.taxAmountCents
  const chargeType = input.metadata.charge_type
  const planCode = input.metadata.plan_code
  const isTopupCharge =
    chargeType === 'manual_topup' || chargeType === 'auto_refill'
  const sourceType = isTopupCharge
    ? 'topup'
    : input.dodoSubscriptionId
      ? 'subscription'
      : 'topup'

  const { data: paymentRecord, error: paymentError } = await admin
    .from('billing_payments')
    .insert({
      company_id: input.companyId,
      dodo_payment_id: input.dodoPaymentId,
      dodo_customer_id: input.dodoCustomerId,
      dodo_subscription_id: input.dodoSubscriptionId,
      amount_cents: preTaxAmountCents,
      tax_amount_cents: input.taxAmountCents,
      currency: input.currency,
      status: 'succeeded',
      payment_type: input.dodoSubscriptionId ? 'subscription' : 'topup',
      metadata: metaAsJson(input.metadata),
    })
    .select()
    .single()

  if (paymentError) {
    if (paymentError.code === '23505') {
      return
    }
    throw new Error(`Payment insert failed: ${paymentError.message}`)
  }

  const creditsGranted = preTaxAmountCents
  if (creditsGranted <= 0) return

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 365)

  const { data: ledgerEntry, error: ledgerError } = await admin
    .from('credit_ledger')
    .insert({
      company_id: input.companyId,
      amount_initial: creditsGranted,
      amount_remaining: creditsGranted,
      expires_at: expiresAt.toISOString(),
      source_type: sourceType,
      source_payment_id: paymentRecord.id,
    })
    .select()
    .single()

  if (ledgerError) {
    throw new Error(`Ledger insert failed: ${ledgerError.message}`)
  }

  const { data: balanceResult } = await admin.rpc('get_company_credit_balance', {
    p_company_id: input.companyId,
  })
  const currentBalance =
    typeof balanceResult === 'number' ? balanceResult : 0

  let description: string
  if (chargeType === 'auto_refill') {
    description = `Auto-refill top-up (${creditsGranted} credits)`
  } else if (chargeType === 'manual_topup') {
    description = `Manual top-up (${creditsGranted} credits)`
  } else {
    description = `Credits from ${planCode ?? 'payment'}`
  }

  const { error: txError } = await admin.from('credit_transactions').insert({
    company_id: input.companyId,
    ledger_entry_id: ledgerEntry.id,
    amount: creditsGranted,
    balance_after: currentBalance,
    transaction_type: 'purchase',
    description,
    reference_type: 'payment',
    reference_id: paymentRecord.id,
  })
  if (txError) {
    console.error('Failed to insert credit_transactions:', txError.message)
  }
}

async function handlePaymentSucceeded(
  admin: AdminClient,
  event: PaymentSucceededWebhookEvent,
): Promise<void> {
  const payment = event.data
  const metadata = asMetadata(payment.metadata)
  const customerId = payment.customer.customer_id
  const companyId = await resolveCompanyId(metadata, customerId)
  const subscriptionId =
    payment.subscription_id || metadata.subscription_id || null

  if (subscriptionId) {
    const { data: sub } = await admin
      .from('billing_subscriptions')
      .select('id')
      .eq('dodo_subscription_id', subscriptionId)
      .maybeSingle()
    if (!sub) {
      console.warn(
        `payment.succeeded ${payment.payment_id} references missing subscription ${subscriptionId}`,
      )
    }
  }

  await grantCreditsForSucceededPayment(admin, {
    companyId,
    dodoPaymentId: payment.payment_id,
    dodoCustomerId: customerId,
    dodoSubscriptionId: subscriptionId,
    totalAmountCents: payment.total_amount,
    taxAmountCents: payment.tax ?? 0,
    currency: payment.currency,
    metadata,
  })
}

async function handlePaymentFailed(
  admin: AdminClient,
  event: PaymentFailedWebhookEvent,
): Promise<void> {
  const payment = event.data
  const metadata = asMetadata(payment.metadata)
  const customerId = payment.customer.customer_id
  const companyId = await resolveCompanyId(metadata, customerId)
  const subscriptionId = metadata.subscription_id
  const taxAmountCents = payment.tax ?? 0
  const preTaxAmountCents = payment.total_amount - taxAmountCents

  const { error } = await admin.from('billing_payments').upsert(
    {
      dodo_payment_id: payment.payment_id,
      dodo_customer_id: customerId,
      company_id: companyId,
      amount_cents: preTaxAmountCents,
      tax_amount_cents: taxAmountCents,
      currency: payment.currency,
      status: 'failed',
      payment_type: subscriptionId ? 'subscription' : 'topup',
      metadata: metaAsJson(metadata),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'dodo_payment_id' },
  )
  if (error) {
    throw new Error(`payment.failed upsert failed: ${error.message}`)
  }
}

async function handlePaymentCancelled(
  admin: AdminClient,
  event: PaymentCancelledWebhookEvent,
): Promise<void> {
  const { error } = await admin
    .from('billing_payments')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('dodo_payment_id', event.data.payment_id)
  if (error) {
    throw new Error(`payment.cancelled update failed: ${error.message}`)
  }
}

async function handleRefundSucceeded(
  admin: AdminClient,
  event: RefundSucceededWebhookEvent,
): Promise<void> {
  const refund = event.data
  const { error } = await admin
    .from('billing_payments')
    .update({
      status: 'refunded',
      refunded_amount_cents: refund.amount ?? undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('dodo_payment_id', refund.payment_id)
  if (error) {
    throw new Error(`refund.succeeded update failed: ${error.message}`)
  }
}

function handleRefundFailed(event: RefundFailedWebhookEvent): void {
  console.warn(`Refund failed for payment: ${event.data.payment_id}`)
}

async function handleDisputeOpened(
  admin: AdminClient,
  event: DisputeOpenedWebhookEvent,
): Promise<void> {
  const { error } = await admin
    .from('billing_payments')
    .update({
      status: 'disputed',
      updated_at: new Date().toISOString(),
    })
    .eq('dodo_payment_id', event.data.payment_id)
  if (error) {
    throw new Error(`dispute.opened update failed: ${error.message}`)
  }
}

async function dispatchEvent(
  admin: AdminClient,
  event: UnwrapWebhookEvent,
): Promise<void> {
  switch (event.type) {
    case 'subscription.active':
      await handleSubscriptionActive(admin, event)
      break
    case 'subscription.renewed':
      await handleSubscriptionRenewed(admin, event)
      break
    case 'subscription.updated':
      await handleSubscriptionUpdated(admin, event)
      break
    case 'subscription.cancelled':
      await handleSubscriptionCancelled(admin, event)
      break
    case 'subscription.failed':
      await handleSubscriptionStatusOnly(
        admin,
        event.data.subscription_id,
        event.data.status,
        'subscription.failed',
      )
      break
    case 'subscription.on_hold':
      await handleSubscriptionStatusOnly(
        admin,
        event.data.subscription_id,
        event.data.status,
        'subscription.on_hold',
      )
      break
    case 'subscription.expired':
      await handleSubscriptionStatusOnly(
        admin,
        event.data.subscription_id,
        event.data.status,
        'subscription.expired',
      )
      break
    case 'subscription.plan_changed':
      await handleSubscriptionPlanChanged(admin, event)
      break
    case 'payment.succeeded':
      await handlePaymentSucceeded(admin, event)
      break
    case 'payment.failed':
      await handlePaymentFailed(admin, event)
      break
    case 'payment.cancelled':
      await handlePaymentCancelled(admin, event)
      break
    case 'refund.succeeded':
      await handleRefundSucceeded(admin, event)
      break
    case 'refund.failed':
      handleRefundFailed(event)
      break
    case 'dispute.opened':
      await handleDisputeOpened(admin, event)
      break
    default:
      console.warn(`Unhandled webhook event type: ${String(
        (event as { type?: string }).type,
      )}`)
  }
}

export type ProcessWebhookResult =
  | { kind: 'duplicate' }
  | { kind: 'processed' }
  | { kind: 'failed'; message: string }

/**
 * Idempotent webhook processing. Replays are allowed when the prior attempt
 * failed (so Dodo retries can recover). Successful events short-circuit.
 */
export async function processDodoWebhookEvent(
  admin: AdminClient,
  webhookId: string,
  event: UnwrapWebhookEvent,
  rawBody: string,
): Promise<ProcessWebhookResult> {
  const { data: existing } = await admin
    .from('processed_webhook_events')
    .select('webhook_id, status')
    .eq('webhook_id', webhookId)
    .maybeSingle()

  if (existing?.status === 'processed') {
    return { kind: 'duplicate' }
  }

  let payload: Json
  try {
    payload = JSON.parse(rawBody) as Json
  } catch {
    payload = { raw: rawBody }
  }

  try {
    await dispatchEvent(admin, event)

    const row = {
      webhook_id: webhookId,
      event_type: event.type,
      dodo_customer_id: extractCustomerId(event) ?? null,
      dodo_subscription_id: extractSubscriptionId(event) ?? null,
      dodo_payment_id: extractPaymentId(event) ?? null,
      status: 'processed',
      error_message: null as string | null,
      payload,
    }

    if (existing) {
      const { error } = await admin
        .from('processed_webhook_events')
        .update(row)
        .eq('webhook_id', webhookId)
      if (error) {
        throw new Error(`Failed to mark webhook processed: ${error.message}`)
      }
    } else {
      const { error } = await admin.from('processed_webhook_events').insert(row)
      if (error && error.code !== '23505') {
        throw new Error(`Failed to record webhook: ${error.message}`)
      }
    }

    return { kind: 'processed' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const failRow = {
      webhook_id: webhookId,
      event_type: event.type,
      status: 'failed',
      error_message: message,
      payload,
    }
    if (existing) {
      await admin
        .from('processed_webhook_events')
        .update(failRow)
        .eq('webhook_id', webhookId)
    } else {
      await admin.from('processed_webhook_events').insert(failRow)
    }
    return { kind: 'failed', message }
  }
}
