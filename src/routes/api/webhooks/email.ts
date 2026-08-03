import { createFileRoute } from '@tanstack/react-router'
import { getAdminClient } from '#/server/lib/supabase'
import { assertEmailWebhookAuthorized } from '#/server/lib/notifications/webhook-auth'
import { processInboundEmail } from '#/server/lib/notifications/inbound-email'

export const Route = createFileRoute('/api/webhooks/email')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = assertEmailWebhookAuthorized(request)
        if (unauthorized) return unauthorized

        try {
          const formData = await request.formData()
          const admin = getAdminClient()
          const result = await processInboundEmail(admin, formData)

          // Always 200 for rejected/duplicate so SendGrid does not retry.
          return Response.json(result)
        } catch (error) {
          console.error('email-webhook error:', error)
          return Response.json(
            {
              error: error instanceof Error ? error.message : String(error),
            },
            { status: 400 },
          )
        }
      },
    },
  },
})
