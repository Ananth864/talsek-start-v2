import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

/**
 * #17 — notification prefs, daily-digest cron, signed inbound email webhook,
 * Cal booking confirmation. EMAIL_STUB / AI_PIPELINE_STUB / webhook secrets
 * are pinned by playwright.config for E2E_TARGET=new.
 */

function adminClient() {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for notifications E2E',
    )
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function cronSecret() {
  return process.env.CRON_SECRET && process.env.CRON_SECRET.length > 0
    ? process.env.CRON_SECRET
    : 'e2e-cron-secret'
}

function emailWebhookSecret() {
  return process.env.EMAIL_WEBHOOK_SECRET &&
    process.env.EMAIL_WEBHOOK_SECRET.length > 0
    ? process.env.EMAIL_WEBHOOK_SECRET
    : 'e2e-email-webhook-secret'
}

function calWebhookSecret() {
  return process.env.CAL_WEBHOOK_SECRET &&
    process.env.CAL_WEBHOOK_SECRET.length > 0
    ? process.env.CAL_WEBHOOK_SECRET
    : 'e2e-cal-webhook-secret'
}

async function signIn(page: Page) {
  await page.goto('/signin')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Email').fill(process.env.E2E_EMAIL!)
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

/** Minimal valid PDF bytes for inbound webhook attachments. */
function minimalPdf(): Buffer {
  const text = `%PDF-1.1
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R >>endobj
4 0 obj<< /Length 44 >>stream
BT /F1 12 Tf 100 100 Td (E2E Email) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
trailer<< /Size 5 /Root 1 0 R >>
startxref
307
%%EOF
`
  return Buffer.from(text, 'utf8')
}

test.describe('notifications & email', () => {
  test('daily-digest cron without CRON_SECRET is rejected', async ({
    request,
  }) => {
    const res = await request.get('/api/cron/daily-email-notifications')
    expect(res.status()).toBe(401)

    const resPost = await request.post('/api/cron/daily-email-notifications')
    expect(resPost.status()).toBe(401)
  })

  test('daily-digest cron with CRON_SECRET succeeds under EMAIL_STUB', async ({
    request,
  }) => {
    const res = await request.get('/api/cron/daily-email-notifications', {
      headers: { Authorization: `Bearer ${cronSecret()}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(typeof body.emails_sent).toBe('number')
    expect(typeof body.emails_failed).toBe('number')
  })

  test('Member can toggle email notification preferences', async ({ page }) => {
    test.setTimeout(60_000)
    const admin = adminClient()
    const email = process.env.E2E_EMAIL!

    const { data: profile, error } = await admin
      .from('profiles')
      .select('id, email_notifications_enabled')
      .eq('email', email)
      .maybeSingle()
    if (error || !profile) {
      throw new Error(`E2E profile not found: ${error?.message}`)
    }

    const original = Boolean(profile.email_notifications_enabled)

    try {
      await admin
        .from('profiles')
        .update({ email_notifications_enabled: true })
        .eq('id', profile.id)

      await signIn(page)
      await page.getByTestId('notifications-nav').click()
      await expect(page.getByTestId('notification-preferences')).toBeVisible()

      const toggle = page.getByTestId('email-notifications-switch')
      await expect(toggle).toBeChecked()
      await toggle.click()
      await expect(toggle).not.toBeChecked({ timeout: 15_000 })

      await expect
        .poll(
          async () => {
            const { data } = await admin
              .from('profiles')
              .select('email_notifications_enabled')
              .eq('id', profile.id)
              .single()
            return data?.email_notifications_enabled
          },
          { timeout: 15_000 },
        )
        .toBe(false)

      await toggle.click()
      await expect(toggle).toBeChecked({ timeout: 15_000 })

      await expect
        .poll(
          async () => {
            const { data } = await admin
              .from('profiles')
              .select('email_notifications_enabled')
              .eq('id', profile.id)
              .single()
            return data?.email_notifications_enabled
          },
          { timeout: 15_000 },
        )
        .toBe(true)
    } finally {
      await admin
        .from('profiles')
        .update({ email_notifications_enabled: original })
        .eq('id', profile.id)
    }
  })

  test('unsigned inbound email webhook is rejected', async ({ request }) => {
    const res = await request.post('/api/webhooks/email', {
      multipart: {
        to: 'acme-abc123@jobs.talsek.com',
        from: 'Candidate <cand@example.com>',
        subject: 'Application',
        text: 'Please find my resume',
      },
    })
    expect(res.status()).toBe(401)
  })

  test('signed inbound email webhook creates application + analyses', async ({
    request,
  }) => {
    test.setTimeout(90_000)
    const admin = adminClient()
    const memberEmail = process.env.E2E_EMAIL!

    const { data: profile } = await admin
      .from('profiles')
      .select('id, company_id')
      .eq('email', memberEmail)
      .maybeSingle()
    if (!profile?.company_id) {
      throw new Error('E2E member company not found')
    }

    const { data: job } = await admin
      .from('jobs')
      .select('id, forwarding_code, status')
      .eq('company_id', profile.company_id)
      .eq('status', 'active')
      .not('forwarding_code', 'is', null)
      .limit(1)
      .maybeSingle()

    if (!job?.forwarding_code) {
      test.skip(true, 'No active Job with forwarding_code for E2E company')
      return
    }

    const candidateEmail = `e2e.inbound.${randomUUID().slice(0, 8)}@example.com`
    const to = `acme-${job.forwarding_code}@jobs.talsek.com`
    const emailBody =
      'Hello, I am applying for this role and have attached my resume.'

    let applicationId: string | undefined
    let candidateId: string | undefined

    try {
      const res = await request.post('/api/webhooks/email', {
        headers: {
          Authorization: `Bearer ${emailWebhookSecret()}`,
        },
        multipart: {
          to,
          from: `E2E Inbound <${candidateEmail}>`,
          subject: 'Job application',
          text: emailBody,
          attachment1: {
            name: 'resume.pdf',
            mimeType: 'application/pdf',
            buffer: minimalPdf(),
          },
        },
      })

      expect(res.status()).toBe(200)
      const body = await res.json()
      expect(body.status).toBe('success')
      applicationId = body.applicationId
      candidateId = body.candidateId
      expect(applicationId).toBeTruthy()

      const { data: app } = await admin
        .from('job_applications')
        .select('id, processing_source, status, email_content')
        .eq('id', applicationId!)
        .single()

      expect(app?.processing_source).toBe('email')
      const emailContent = app?.email_content as
        | { email_body?: string; email_analysis?: unknown }
        | null
        | undefined
      expect(emailContent?.email_body).toBe(emailBody)
      // Email Analysis merges into email_content under the sync pipeline (ADR-0014).
      expect(emailContent?.email_analysis).toBeTruthy()
      expect(app?.status === 'active' || app?.status === 'pending').toBe(true)
    } finally {
      if (applicationId) {
        await admin.from('job_applications').delete().eq('id', applicationId)
      }
      if (candidateId) {
        await admin.from('candidates').delete().eq('id', candidateId)
      }
    }
  })

  test('unsigned Cal booking webhook is rejected', async ({ request }) => {
    const res = await request.post('/api/webhooks/cal-booking', {
      data: {
        triggerEvent: 'BOOKING_CREATED',
        payload: {
          uid: 'book_e2e',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 3600_000).toISOString(),
          title: 'Demo',
          attendees: [{ email: 'guest@example.com', name: 'Guest' }],
        },
      },
    })
    expect(res.status()).toBe(401)
  })

  test('signed Cal booking webhook sends under EMAIL_STUB', async ({
    request,
  }) => {
    const res = await request.post('/api/webhooks/cal-booking', {
      headers: {
        Authorization: `Bearer ${calWebhookSecret()}`,
        'content-type': 'application/json',
      },
      data: {
        triggerEvent: 'BOOKING_CREATED',
        payload: {
          uid: `book_${randomUUID().slice(0, 8)}`,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 3600_000).toISOString(),
          title: 'Talsek demo',
          timeZone: 'UTC',
          attendees: [
            { email: 'guest@example.com', name: 'Guest', timeZone: 'UTC' },
          ],
        },
      },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ status: 'success', sent: 1 })
  })
})
