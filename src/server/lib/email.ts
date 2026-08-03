/**
 * Outbound email via Resend (ticket #15 invite; #17 will deepen this seam).
 * When RESEND_API_KEY is absent or EMAIL_STUB is set, sends are no-ops so
 * invite flows stay exercisable in local/E2E without a live provider.
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
  if (isEmailStub()) {
    console.info('[email] stub invite send', {
      to: params.to,
      isResend: Boolean(params.isResend),
      companyName: params.companyName,
    })
    return
  }

  const apiKey = serverEnv.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not configured')
  }

  const fromAddress =
    serverEnv.RESEND_INVITE_FROM ?? 'Talsek <no-reply@talsek.com>'
  const replyTo = serverEnv.RESEND_INVITE_REPLY_TO ?? null
  const subject =
    serverEnv.RESEND_INVITE_SUBJECT ??
    (params.isResend
      ? `${params.companyName} reminder: finish setting up your Talsek access`
      : `${params.companyName} invited you to Talsek`)

  const emailPayload: Record<string, unknown> = {
    from: fromAddress,
    to: [params.to],
    subject,
    html: buildInviteEmailHtml(params),
    text: buildInviteEmailText(params),
  }

  if (replyTo) {
    emailPayload.reply_to = replyTo
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
    throw new Error(`Resend invite failed: ${errorText}`)
  }
}
