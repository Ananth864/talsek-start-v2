import { createFileRoute } from '@tanstack/react-router'
import { assertCalWebhookAuthorized } from '#/server/lib/notifications/webhook-auth'
import { processCalBookingWebhook } from '#/server/lib/notifications/cal-booking'

export const Route = createFileRoute('/api/webhooks/cal-booking')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = assertCalWebhookAuthorized(request)
        if (unauthorized) return unauthorized

        try {
          const body = await request.json()
          const result = await processCalBookingWebhook(body)

          if (result.status === 'ignored') {
            return Response.json(result, { status: 202 })
          }

          return Response.json(result)
        } catch (error) {
          console.error('cal-booking-webhook error:', error)
          const message =
            error instanceof Error ? error.message : 'Unexpected error'
          const status = message.includes('Invalid Cal booking') ? 400 : 500
          return Response.json({ error: message }, { status })
        }
      },
    },
  },
})
