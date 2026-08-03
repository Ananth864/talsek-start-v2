/**
 * Dodo Payments client (source: `_shared/dodoClient.ts`).
 * Lazy-init so module load stays safe when the key is absent (stub/E2E).
 */
import DodoPayments from 'dodopayments'
import { serverEnv } from './env'
import { PLAN_CODES } from '#/lib/billing-shared'

export { PLAN_CODES }

/** Playwright / local: skip live Dodo calls (ADR-0018 §5). */
export function isBillingStub(): boolean {
  const stub = serverEnv.BILLING_STUB
  return stub === '1' || stub === 'true'
}

let cached: DodoPayments | null = null

export function getDodoClient(): DodoPayments {
  if (isBillingStub()) {
    throw new Error('Dodo client unavailable under BILLING_STUB')
  }
  if (!serverEnv.DODO_PAYMENTS_API_KEY) {
    throw new Error('DODO_PAYMENTS_API_KEY is not set')
  }
  if (!cached) {
    const isProduction = serverEnv.APP_ENV === 'production'
    cached = new DodoPayments({
      bearerToken: serverEnv.DODO_PAYMENTS_API_KEY,
      webhookKey: serverEnv.DODO_PAYMENTS_WEBHOOK_SECRET ?? undefined,
      environment: isProduction ? 'live_mode' : 'test_mode',
      timeout: 30_000,
      maxRetries: 2,
    })
  }
  return cached
}
