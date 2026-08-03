# Notifications & email (Resend, prefs, cron, webhooks)

Ticket #17 ports the cross-cutting email/notification layer: deepen the Resend
seam for digests and Cal.com booking confirmations, Member notification
preferences, a secret-guarded daily-digest Vercel Cron, and a signed inbound
email webhook that runs Email Analysis via the existing pipeline.

## Decisions

### 1. One Resend module — deepen `src/server/lib/email.ts`

Invite (#15), daily digest, and Cal booking confirmation all go through
`sendResendEmail` / `isEmailStub()`. No second Resend client path.
`EMAIL_STUB=1` (or missing `RESEND_API_KEY`) no-ops all kinds for E2E.

### 2. Preferences = `profiles.email_notifications_enabled`

No separate preferences table (source parity). Server functions
`fetchNotificationPreferences` / `updateNotificationPreferences` are
user-scoped; RLS owns self-update. The daily digest does **not** call
`should_user_receive_notification` — `application_summary_view` already
filters on the boolean.

### 3. Daily digest cron mirrors billing cron

`/api/cron/daily-email-notifications` uses `assertCronAuthorized`
(`Authorization: Bearer CRON_SECRET`), `getAdminClient()`, and queries
`application_summary_view`. Schedule: `30 14 * * *` (20:00 IST), matching
the source GitHub Actions cron.

### 4. Inbound email webhook is signed (spec improvement over source)

Source SendGrid Inbound Parse had no signature check. The port requires
`EMAIL_WEBHOOK_SECRET` via `Authorization: Bearer` **or** `?secret=` query
(so the Parse destination URL can embed the secret). Multipart field shape
stays SendGrid-compatible. After insert, the handler **awaits**
`processJobApplicationPipeline` (ADR-0014) so Email Analysis runs when
`processing_source === 'email'` and `email_content.email_body` is set.

### 5. Cal booking webhook is Bearer-guarded

`/api/webhooks/cal-booking` requires `Authorization: Bearer CAL_WEBHOOK_SECRET`
(source had none). Handles `BOOKING_CREATED` / `BOOKING_RESCHEDULED`; other
events return 202 ignored.

## Consequences

- Dashboard exposes a Notifications dialog for the email-digest switch.
- Production needs `RESEND_API_KEY`, `CRON_SECRET`, `EMAIL_WEBHOOK_SECRET`,
  `CAL_WEBHOOK_SECRET`, and optional from/reply/video overrides.
- Playwright pins webhook + cron secrets alongside `EMAIL_STUB=1`.
