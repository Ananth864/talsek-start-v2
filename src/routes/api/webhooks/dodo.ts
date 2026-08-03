import { createFileRoute } from '@tanstack/react-router'
import { unwrapDodoWebhook } from '#/server/lib/dodo'
import { getAdminClient } from '#/server/lib/supabase'
import { processDodoWebhookEvent } from '#/server/lib/billing/webhook'

export const Route = createFileRoute('/api/webhooks/dodo')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const webhookId = request.headers.get('webhook-id')
        const rawBody = await request.text()

        if (!webhookId) {
          return new Response('Missing webhook-id header', { status: 400 })
        }

        const headers: Record<string, string> = {}
        request.headers.forEach((value, key) => {
          headers[key] = value
        })

        let event
        try {
          event = unwrapDodoWebhook(rawBody, headers)
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Unknown verification error'
          console.error('Webhook verification failed:', message)
          return new Response('Invalid signature or payload', { status: 401 })
        }

        const admin = getAdminClient()
        const result = await processDodoWebhookEvent(
          admin,
          webhookId,
          event,
          rawBody,
        )

        if (result.kind === 'duplicate') {
          return Response.json({ received: true, duplicate: true })
        }
        if (result.kind === 'failed') {
          console.error('Webhook processing error:', result.message)
          return new Response('Internal Server Error', { status: 500 })
        }

        return Response.json({ received: true })
      },
    },
  },
})
