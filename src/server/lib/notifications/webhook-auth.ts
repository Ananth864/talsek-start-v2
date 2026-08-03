import { serverEnv } from '../env'

/**
 * Inbound email webhook auth (ticket #17 / ADR-0022).
 * Accepts `Authorization: Bearer <EMAIL_WEBHOOK_SECRET>` or `?secret=` query
 * (SendGrid Inbound Parse can embed the secret in the destination URL).
 */
export function assertEmailWebhookAuthorized(request: Request): Response | null {
  const secret = serverEnv.EMAIL_WEBHOOK_SECRET
  if (!secret) {
    return Response.json(
      { error: 'Unauthorized - Email webhook secret not configured' },
      { status: 401 },
    )
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${secret}`) {
    return null
  }

  const url = new URL(request.url)
  if (url.searchParams.get('secret') === secret) {
    return null
  }

  return Response.json(
    { error: 'Unauthorized - Invalid email webhook credentials' },
    { status: 401 },
  )
}

/**
 * Cal.com booking webhook auth. Bearer `CAL_WEBHOOK_SECRET` required.
 */
export function assertCalWebhookAuthorized(request: Request): Response | null {
  const secret = serverEnv.CAL_WEBHOOK_SECRET
  const authHeader = request.headers.get('authorization')
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return Response.json(
      { error: 'Unauthorized - Invalid Cal webhook credentials' },
      { status: 401 },
    )
  }
  return null
}
