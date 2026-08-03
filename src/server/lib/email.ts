/**
 * Outbound email via Resend (invites #15; digests / booking confirmations #17).
 * When RESEND_API_KEY is absent or EMAIL_STUB is set, sends are no-ops so
 * flows stay exercisable in local/E2E without a live provider.
 */
import { serverEnv } from './env'

export type InviteEmailParams = {
  to: string
  inviteLink: string
  companyName: string
  firstName?: string | null
  lastName?: string | null
  customMessage?: string | null
  isResend?: boolean
}

export type DailyDigestJobStats = {
  title: string
  excellent_count: number
  good_count: number
  average_count: number
  below_average_count: number
  total_applications: number
}

export type DailyDigestEmailParams = {
  to: string
  firstName: string
  lastName: string
  jobs: DailyDigestJobStats[]
  totalApplications: number
}

export type CalBookingAttendee = {
  email: string
  name?: string | null
  firstName?: string | null
  timeZone?: string | null
}

export type CalBookingEmailParams = {
  to: string
  attendee: CalBookingAttendee
  bookingTitle?: string | null
  startTime: string
  bookingTimeZone?: string | null
  triggerEvent: string
  bookingUid: string
}

export type SendResendEmailParams = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from: string
  replyTo?: string | null
  headers?: Record<string, string>
  /** Label used in stub logs and error messages. */
  kind: string
}

/** Skip live Resend when stubbed or when the API key is unset. */
export function isEmailStub(): boolean {
  const stub = serverEnv.EMAIL_STUB
  if (stub === '1' || stub === 'true') return true
  return !serverEnv.RESEND_API_KEY
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatMessageHtml(message?: string | null): string {
  if (!message) return ''

  const sanitized = escapeHtml(message.trim())
  if (!sanitized) return ''

  const paragraphs = sanitized
    .split(/\r?\n\r?\n/)
    .map((block) => block.replace(/\r?\n/g, '<br />'))
    .map(
      (block) =>
        `<p style="margin: 0 0 16px 0; line-height: 1.5;">${block}</p>`,
    )
    .join('')

  return `
    <tr>
      <td style="padding: 0 0 20px 0;">
        <div style="background: #f7f7f9; border-radius: 12px; padding: 16px;">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #111827;">Personal message</p>
          ${paragraphs}
        </div>
      </td>
    </tr>
  `
}

/**
 * Shared Resend POST. Stub mode logs and returns without calling the API.
 */
export async function sendResendEmail(
  params: SendResendEmailParams,
): Promise<void> {
  if (isEmailStub()) {
    console.info(`[email] stub ${params.kind} send`, {
      to: params.to,
      subject: params.subject,
      from: params.from,
    })
    return
  }

  const apiKey = serverEnv.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not configured')
  }

  const emailPayload: Record<string, unknown> = {
    from: params.from,
    to: Array.isArray(params.to) ? params.to : [params.to],
    subject: params.subject,
    html: params.html,
  }

  if (params.text) {
    emailPayload.text = params.text
  }
  if (params.replyTo) {
    emailPayload.reply_to = params.replyTo
  }
  if (params.headers && Object.keys(params.headers).length > 0) {
    emailPayload.headers = params.headers
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailPayload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Resend ${params.kind} failed: ${errorText}`)
  }
}

export function buildInviteEmailHtml(params: InviteEmailParams): string {
  const {
    companyName,
    firstName,
    lastName,
    inviteLink,
    customMessage,
    isResend,
  } = params
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'there'
  const intro = isResend
    ? `${companyName} asked us to resend your access link.`
    : `${companyName} has invited you to join their workspace on Talsek.`
  const primaryCta = isResend ? 'Set up your password' : 'Accept invite'

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(companyName)} invitation</title>
      </head>
      <body style="margin:0; padding:0; background:#f7f7f9; font-family: Arial, sans-serif; color:#111827;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td align="center" style="padding: 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 520px; background:#ffffff; border:1px solid #e5e7eb; border-radius: 16px; padding: 32px;">
                <tr>
                  <td style="text-align: left;">
                    <p style="margin:0 0 12px 0; font-size: 16px;">Hi ${escapeHtml(displayName)},</p>
                    <p style="margin:0 0 16px 0; font-size: 16px; line-height: 1.6;">${escapeHtml(intro)}</p>
                  </td>
                </tr>
                ${formatMessageHtml(customMessage)}
                <tr>
                  <td style="padding: 0 0 24px 0;">
                    <a href="${escapeHtml(inviteLink)}" style="background:#2563eb; color:#ffffff; padding: 14px 24px; border-radius: 999px; text-decoration: none; font-weight: 600; display: inline-block;">
                      ${escapeHtml(primaryCta)}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 14px; line-height: 1.6; color: #4b5563;">
                    <p style="margin: 0 0 8px 0;">If the button doesn’t work, copy and paste this link into your browser:</p>
                    <p style="margin: 0; word-break: break-all;">
                      <a href="${escapeHtml(inviteLink)}" style="color:#2563eb;">${escapeHtml(inviteLink)}</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 32px; font-size: 12px; color:#6b7280;">
                    <p style="margin: 0;">You’re receiving this email because your team uses Talsek for hiring.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

export function buildInviteEmailText(params: InviteEmailParams): string {
  const {
    companyName,
    firstName,
    lastName,
    inviteLink,
    customMessage,
    isResend,
  } = params
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'there'
  const intro = isResend
    ? `${companyName} asked us to resend your access link.`
    : `${companyName} has invited you to join their workspace on Talsek.`
  const messageBlock = customMessage ? `\n\n${customMessage.trim()}` : ''

  return `Hi ${displayName},

${intro}${messageBlock}

Set up your password: ${inviteLink}

If you didn’t expect this invitation, you can safely ignore it.`
}

/**
 * Deliver a Member invite email. Under stub mode, logs and returns without
 * calling Resend so invite create/resend still succeed in E2E.
 */
export async function sendInviteEmail(params: InviteEmailParams): Promise<void> {
  const fromAddress =
    serverEnv.RESEND_INVITE_FROM ?? 'Talsek <no-reply@talsek.com>'
  const replyTo = serverEnv.RESEND_INVITE_REPLY_TO ?? null
  const subject =
    serverEnv.RESEND_INVITE_SUBJECT ??
    (params.isResend
      ? `${params.companyName} reminder: finish setting up your Talsek access`
      : `${params.companyName} invited you to Talsek`)

  await sendResendEmail({
    kind: 'invite',
    to: params.to,
    from: fromAddress,
    replyTo,
    subject,
    html: buildInviteEmailHtml(params),
    text: buildInviteEmailText(params),
  })
}

export function buildDailyDigestHtml(params: DailyDigestEmailParams): string {
  const { firstName, lastName, jobs, totalApplications } = params
  const year = new Date().getFullYear()

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Talsek - Daily Application Summary</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .header {
            text-align: center;
            background: #4366B0;
            color: white;
            padding: 30px 20px;
            border-radius: 12px 12px 0 0;
            margin-bottom: 0;
        }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 16px; }
        .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 12px 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .summary {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            text-align: center;
        }
        .summary h2 { color: #1e293b; margin: 0 0 10px 0; font-size: 24px; }
        .summary p { color: #64748b; margin: 0; font-size: 16px; }
        .job-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin-bottom: 20px;
            overflow: hidden;
        }
        .job-header {
            background: #1e293b;
            color: white;
            padding: 15px 20px;
            font-weight: 600;
            font-size: 18px;
        }
        .job-stats {
            padding: 20px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
        }
        .stat-item {
            text-align: center;
            padding: 12px;
            border-radius: 6px;
            font-weight: 500;
        }
        .excellent { background: #dcfce7; color: #166534; }
        .good { background: #dbeafe; color: #1d4ed8; }
        .average { background: #fef3c7; color: #92400e; }
        .below-average { background: #fecaca; color: #dc2626; }
        .stat-number { font-size: 24px; font-weight: 700; display: block; }
        .stat-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8; }
        .cta-section {
            text-align: center;
            margin: 30px 0;
            padding: 25px;
            background: #f8fafc;
            border-radius: 8px;
        }
        .cta-button {
            display: inline-block;
            background: #4366B0;
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            color: #64748b;
            font-size: 14px;
            border-top: 1px solid #e2e8f0;
        }
        .footer a { color: #3b82f6; text-decoration: none; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Daily Application Summary</h1>
        <p>Your Talsek recruitment update</p>
    </div>

    <div class="content">
        <div class="summary">
            <h2>Hello ${escapeHtml(firstName)} ${escapeHtml(lastName)}!</h2>
            <p>You received <strong>${totalApplications}</strong> new application${totalApplications !== 1 ? 's' : ''} across ${jobs.length} job${jobs.length !== 1 ? 's' : ''} in the last 24 hours.</p>
        </div>

        ${jobs
          .map(
            (job) => `
            <div class="job-card">
                <div class="job-header">${escapeHtml(job.title)}</div>
                <div class="job-stats">
                    <div class="stat-item excellent">
                        <span class="stat-number">${job.excellent_count}</span>
                        <span class="stat-label">Excellent (80+)</span>
                    </div>
                    <div class="stat-item good">
                        <span class="stat-number">${job.good_count}</span>
                        <span class="stat-label">Good (60-79)</span>
                    </div>
                    <div class="stat-item average">
                        <span class="stat-number">${job.average_count}</span>
                        <span class="stat-label">Average (40-59)</span>
                    </div>
                    <div class="stat-item below-average">
                        <span class="stat-number">${job.below_average_count}</span>
                        <span class="stat-label">Below Avg (&lt;40)</span>
                    </div>
                </div>
            </div>
        `,
          )
          .join('')}

        <div class="cta-section">
            <p style="margin: 0 0 15px 0; color: #64748b;">Ready to review your candidates?</p>
            <a href="https://talsek.com/dashboard" class="cta-button" style="color: #ffffff !important; text-decoration: none;">
                View Dashboard →
            </a>
        </div>
    </div>

    <div class="footer">
        <p>This summary includes applications received in the last 24 hours (IST timezone).</p>
        <p>
            <a href="https://talsek.com/dashboard">Open Talsek</a>
        </p>
        <p style="margin-top: 15px; font-size: 12px; opacity: 0.7;">
            © ${year} Talsek. All rights reserved.
        </p>
    </div>
</body>
</html>`
}

export async function sendDailyDigestEmail(
  params: DailyDigestEmailParams,
): Promise<void> {
  const from =
    serverEnv.RESEND_NOTIFICATIONS_FROM ?? 'Talsek <notifications@talsek.com>'

  await sendResendEmail({
    kind: 'daily-digest',
    to: params.to,
    from,
    subject: 'Talsek - Daily Summary of Applications',
    html: buildDailyDigestHtml(params),
    headers: {
      'X-Notification-Type': 'daily-summary',
      'X-User-ID': params.to,
    },
  })
}

function formatMeetingTime(isoString: string, timeZone?: string | null): string {
  try {
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) {
      throw new Error('Invalid date')
    }
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: timeZone ?? 'UTC',
    }).format(date)
  } catch {
    return isoString
  }
}

export function buildCalBookingEmailBody(params: {
  attendee: CalBookingAttendee
  bookingTitle?: string | null
  startTime: string
  bookingTimeZone?: string | null
  videoUrl: string
}): { subject: string; html: string; text: string } {
  const attendeeName =
    params.attendee.name || params.attendee.firstName || 'there'
  const meetingWindow = formatMeetingTime(
    params.startTime,
    params.attendee.timeZone ?? params.bookingTimeZone,
  )
  const meetingTitle =
    params.bookingTitle ?? 'your upcoming conversation with Talsek'

  const subject = `Your Talsek booking: ${meetingTitle}`
  const html = [
    `<p>Hi ${escapeHtml(attendeeName)},</p>`,
    `<p>Thanks for booking time with the Talsek team! We're excited to connect.</p>`,
    `<p>To help you get the most out of our conversation, we've recorded a quick overview of the platform:</p>`,
    `<p><a href="${escapeHtml(params.videoUrl)}" target="_blank" rel="noopener">Watch the Talsek demo</a></p>`,
    `<p>We'll meet on <strong>${escapeHtml(meetingWindow)}</strong>. If anything changes, you can reschedule directly from your Cal.com confirmation.</p>`,
    `<p>Looking forward to speaking with you!</p>`,
    `<p>&mdash; The Talsek Team</p>`,
  ].join('')

  const text = [
    `Hi ${attendeeName},`,
    ``,
    `Thanks for booking time with the Talsek team! We're excited to connect.`,
    ``,
    `Watch the Talsek demo: ${params.videoUrl}`,
    ``,
    `We'll meet on ${meetingWindow}. If anything changes, you can reschedule directly from your Cal.com confirmation.`,
    ``,
    `Looking forward to speaking with you!`,
    ``,
    `— The Talsek Team`,
  ].join('\n')

  return { subject, html, text }
}

export async function sendCalBookingEmail(
  params: CalBookingEmailParams,
): Promise<void> {
  const from =
    serverEnv.CAL_BOOKING_FROM_EMAIL ?? 'Talsek <bookings@talsek.com>'
  const replyTo = serverEnv.CAL_BOOKING_REPLY_TO_EMAIL ?? 'hello@talsek.com'
  const videoUrl =
    serverEnv.CAL_BOOKING_VIDEO_URL ??
    'https://fzchuyjwiphrojyibjrv.supabase.co/storage/v1/object/public/videos/demo-video.mp4'

  const message = buildCalBookingEmailBody({
    attendee: params.attendee,
    bookingTitle: params.bookingTitle,
    startTime: params.startTime,
    bookingTimeZone: params.bookingTimeZone,
    videoUrl,
  })

  await sendResendEmail({
    kind: 'cal-booking',
    to: params.to,
    from,
    replyTo,
    subject: message.subject,
    html: message.html,
    text: message.text,
    headers: {
      'X-Cal-Trigger-Event': params.triggerEvent,
      'X-Cal-Booking-Uid': params.bookingUid,
    },
  })
}
