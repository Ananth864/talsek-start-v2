import { createFileRoute } from '@tanstack/react-router'
import { assertCronAuthorized } from '#/server/lib/billing/cron-auth'
import { runBillingAutoRefill } from '#/server/lib/billing/auto-refill'

async function handleCron(request: Request): Promise<Response> {
  const unauthorized = assertCronAuthorized(request)
  if (unauthorized) return unauthorized

  try {
    const summary = await runBillingAutoRefill()
    return Response.json(summary)
  } catch (error) {
    console.error('billing-auto-refill fatal error:', error)
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export const Route = createFileRoute('/api/cron/billing-auto-refill')({
  server: {
    handlers: {
      // Vercel Cron invokes GET with Authorization: Bearer CRON_SECRET.
      GET: async ({ request }) => handleCron(request),
      // POST kept for manual/ops triggers (source edge fn was POST-only).
      POST: async ({ request }) => handleCron(request),
    },
  },
})
