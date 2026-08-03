/** Shared billing constants safe for client + server. */

export const PLAN_CODES = {
  WALLET_ANCHOR: 'wallet_anchor',
  STARTER_MONTHLY: 'starter_monthly',
  STARTER_ANNUAL: 'starter_annual',
} as const

export type PlanType = 'No Plan' | 'Pay as you go' | 'Tier 1' | 'Enterprise'

export function planLabelFromCode(planCode: string | null | undefined): PlanType {
  if (!planCode) return 'No Plan'
  if (planCode === PLAN_CODES.WALLET_ANCHOR) return 'Pay as you go'
  if (planCode.includes('starter') || planCode === 'tier_1') return 'Tier 1'
  if (planCode.startsWith('ent_') || planCode.includes('enterprise')) {
    return 'Enterprise'
  }
  return 'No Plan'
}

export function resolveCurrentPlanLabel(
  hasWalletAnchor: boolean,
  normalPlanCode: string | null,
): PlanType {
  if (normalPlanCode) return planLabelFromCode(normalPlanCode)
  if (hasWalletAnchor) return 'Pay as you go'
  return 'No Plan'
}

export function getPaymentDescription(payment: {
  payment_type: string
  metadata: {
    plan_code?: string
    charge_type?: string
  }
}): string {
  const { payment_type, metadata } = payment
  const chargeType = metadata.charge_type
  const planCode = metadata.plan_code

  if (chargeType === 'manual_topup') return 'Credit Top-up'
  if (chargeType === 'auto_refill') return 'Auto-Refill Top-up'
  if (payment_type === 'subscription') {
    if (planCode?.includes('starter') || planCode === 'tier_1') {
      return 'Tier 1 Subscription'
    }
    if (planCode?.startsWith('ent_') || planCode?.includes('enterprise')) {
      return 'Enterprise Subscription'
    }
    if (planCode === PLAN_CODES.WALLET_ANCHOR) return 'Wallet Anchor Setup'
    return `Subscription (${planCode || 'unknown'})`
  }
  return payment_type === 'topup' ? 'Credit Top-up' : 'Payment'
}
