import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { writeFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * Characterisation spec for Applicant apply-by-token (ticket #11).
 * Seeds an enabled Form Config for the E2E Member's Job, then exercises the
 * public `/apply/$token` journey: Storage upload (signed URL) → submit →
 * awaited Resume AI pipeline under `AI_PIPELINE_STUB=1` (ADR-0014 / ADR-0015).
 */

async function signIn(page: Page) {
  await page.goto('/signin')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Email').fill(process.env.E2E_EMAIL!)
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

function minimalPdf(): Buffer {
  const text = `%PDF-1.1
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R >>endobj
4 0 obj<< /Length 44 >>stream
BT /F1 12 Tf 100 100 Td (E2E Resume) Tj ET
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

function adminClient() {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required to seed apply E2E',
    )
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function ensureFormTokenForJob(jobId: string): Promise<{
  token: string
  companyId: string
}> {
  const admin = adminClient()

  const { data: job, error: jobError } = await admin
    .from('jobs')
    .select('id, company_id')
    .eq('id', jobId)
    .single()
  if (jobError) {
    throw new Error(`Failed to load job: ${jobError.message}`)
  }

  const { data: stage } = await admin
    .from('job_stages')
    .select('id')
    .eq('job_id', jobId)
    .order('stage_order', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (!stage) {
    throw new Error('Job has no stages — create a Job with stages before apply E2E')
  }

  const { data: existing } = await admin
    .from('job_form_configs')
    .select('id, form_url_token, is_enabled, expires_at')
    .eq('job_id', jobId)
    .eq('is_enabled', true)
    .limit(1)
    .maybeSingle()

  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  if (existing?.form_url_token) {
    // Force an empty job-specific snapshot so the apply form is mandatory-only
    // (name/email/phone/resume) — avoids template custom questions blocking E2E.
    await admin
      .from('job_form_configs')
      .update({
        is_enabled: true,
        expires_at: future,
        questions: [],
        custom_question_text: {},
      })
      .eq('id', existing.id)
    return { token: existing.form_url_token, companyId: job.company_id }
  }

  const { data: templateId, error: templateError } = await admin.rpc(
    'get_or_create_form_template',
    { target_company_id: job.company_id },
  )
  if (templateError || !templateId) {
    throw new Error(
      `Failed to get form template: ${templateError?.message ?? 'null'}`,
    )
  }

  const token = randomUUID()
  const { error: insertError } = await admin.from('job_form_configs').insert({
    job_id: jobId,
    form_template_id: templateId,
    form_url_token: token,
    is_enabled: true,
    expires_at: future,
    questions: [],
    custom_question_text: {},
  })
  if (insertError) {
    throw new Error(`Failed to seed form config: ${insertError.message}`)
  }

  return { token, companyId: job.company_id }
}

test('invalid apply token is rejected', async ({ page }) => {
  await page.goto(`/apply/${randomUUID()}`)
  await expect(page.getByTestId('apply-invalid')).toBeVisible({
    timeout: 15_000,
  })
})

test('applicant applies by form token and pipeline activates the card', async ({
  page,
}) => {
  test.setTimeout(120_000)

  await signIn(page)
  await expect(page.getByRole('heading', { name: 'Your Jobs' })).toBeVisible()

  const firstJob = page.getByTestId('job-card').first()
  await expect(firstJob).toBeVisible()
  await firstJob.click()
  await expect(page).toHaveURL(/jobId=/)

  const jobId = new URL(page.url()).searchParams.get('jobId')
  expect(jobId).toBeTruthy()

  const { token } = await ensureFormTokenForJob(jobId!)

  // Public apply surface — no Member session required.
  await page.context().clearCookies()
  await page.goto(`/apply/${token}`)
  await expect(page.getByTestId('apply-page')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByTestId('apply-form')).toBeVisible()

  const email = `e2e.apply.${Date.now()}@example.com`
  await page.getByTestId('apply-name').fill('E2E Apply Candidate')
  await page.getByTestId('apply-email').fill(email)
  await page.getByTestId('apply-phone').fill('+15551234567')

  const pdfPath = join(tmpdir(), `e2e-apply-${Date.now()}.pdf`)
  writeFileSync(pdfPath, minimalPdf())
  try {
    await page.getByTestId('apply-resume').setInputFiles(pdfPath)
    await page.getByTestId('apply-submit').click()
    await expect(page.getByTestId('apply-success')).toBeVisible({
      timeout: 90_000,
    })
  } finally {
    try {
      unlinkSync(pdfPath)
    } catch {
      // ignore cleanup failures
    }
  }

  // Pipeline stub writes deterministic name; board shows active apps.
  await page.goto('/signin')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Email').fill(process.env.E2E_EMAIL!)
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)

  await page.goto(`/dashboard?jobId=${jobId}`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('candidates-list')).toBeVisible()
  // Stub name is shared across pipeline E2E seeds; pin this run by email.
  await expect(
    page.getByTestId('candidate-card').filter({ hasText: email }),
  ).toBeVisible({ timeout: 30_000 })
  await expect(
    page.getByTestId('candidate-card').filter({ hasText: email }),
  ).toContainText(/E2E Pipeline Candidate/i)
})
