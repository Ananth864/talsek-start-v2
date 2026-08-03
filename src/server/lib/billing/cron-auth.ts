import { serverEnv } from '../env'

/**
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` on GET.
 * Reject when the secret is unset or the header does not match.
 */
export function assertCronAuthorized(request: Request): Response | null {
  const secret = serverEnv.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return Response.json(
      { error: 'Unauthorized - Invalid cron credentials' },
      { status: 401 },
    )
  }
  return null
}
