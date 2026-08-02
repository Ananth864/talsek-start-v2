import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

/**
 * Characterisation spec for bulk upload + bulk shortlist (ticket #10).
 * Uploads a PDF via Storage (signed URL), processes through the stubbed
 * pipeline, asserts the board card, then bulk-shortlists to the next stage.
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
BT /F1 12 Tf 100 100 Td (E2E Bulk Resume) Tj ET
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
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for bulk E2E',
    )
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function ensureJobHasNextStage(jobId: string): Promise<{
  firstStageId: string
  secondStageId: string
  jobTitle: string
}> {
  const admin = adminClient()
  const { data: job, error: jobError } = await admin
    .from('jobs')
    .select('id, title')
    .eq('id', jobId)
    .single()
  if (jobError) {
    throw new Error(`Failed to load job: ${jobError.message}`)
  }

  const { data: stages, error } = await admin
    .from('job_stages')
    .select('id, stage_order')
    .eq('job_id', jobId)
    .order('stage_order', { ascending: true })

  if (error) throw new Error(`Failed to load stages: ${error.message}`)
  if (stages.length < 2) {
    throw new Error(
      'E2E Job needs at least two hiring stages for bulk shortlist',
    )
  }
  return {
    firstStageId: stages[0].id,
    secondStageId: stages[1].id,
    jobTitle: job.title,
  }
}

test.describe('Bulk upload + bulk shortlist (#10)', () => {
  test('uploads a resume via Storage, runs pipeline, then bulk shortlists', async ({
    page,
  }) => {
    await signIn(page)
    await expect(page.getByTestId('candidates-list')).toBeVisible({
      timeout: 30_000,
    })

    const jobId = new URL(page.url()).searchParams.get('jobId')
    expect(jobId).toBeTruthy()
    const { firstStageId, secondStageId, jobTitle } =
      await ensureJobHasNextStage(jobId!)

    const uniqueEmail = `e2e.bulk.${randomUUID().slice(0, 8)}@example.com`
    const pdfPath = join(tmpdir(), `e2e-bulk-${randomUUID()}.pdf`)
    writeFileSync(pdfPath, minimalPdf())

    try {
      await page.getByTestId('bulk-upload-nav').click()
      await expect(page).toHaveURL(/\/bulk-upload/)
      await expect(page.getByTestId('bulk-upload-page')).toBeVisible()

      await page.getByTestId('bulk-upload-job-select').click()
      await page.getByRole('option', { name: jobTitle }).click()

      await page.getByTestId('bulk-upload-file-input').setInputFiles(pdfPath)
      await expect(page.getByTestId('bulk-upload-row')).toHaveCount(1)
      await page.getByTestId('bulk-upload-email').fill(uniqueEmail)

      await page.getByTestId('bulk-upload-analyze').click()
      await expect(
        page.locator('[data-testid="bulk-upload-row"][data-status="done"]'),
      ).toBeVisible({ timeout: 90_000 })

      await page.getByRole('link', { name: /back to jobs/i }).click()
      await expect(page).toHaveURL(/\/dashboard/)

      await page.goto(`/dashboard?jobId=${jobId}&stageId=${firstStageId}`)
      await expect(page.getByTestId('candidates-list')).toBeVisible({
        timeout: 30_000,
      })

      const card = page
        .getByTestId('candidate-card')
        .filter({ hasText: uniqueEmail })
      await expect(card).toBeVisible({ timeout: 60_000 })

      await page.getByTestId('bulk-shortlist-enter').click()
      await expect(page.getByTestId('bulk-action-confirm-bar')).toBeVisible()
      await card.getByTestId('candidate-bulk-select').click()
      await expect(page.getByTestId('bulk-action-confirm-bar')).toContainText(
        '1 selected',
      )
      await page.getByTestId('bulk-action-confirm').click()
      await expect(page.getByTestId('bulk-shortlist-dialog')).toBeVisible()
      await page.getByTestId('bulk-shortlist-confirm').click()
      await expect(page.getByTestId('bulk-shortlist-dialog')).toHaveCount(0, {
        timeout: 30_000,
      })

      await page.goto(`/dashboard?jobId=${jobId}&stageId=${secondStageId}`)
      await expect(
        page.getByTestId('candidate-card').filter({ hasText: uniqueEmail }),
      ).toBeVisible({ timeout: 30_000 })
    } finally {
      try {
        unlinkSync(pdfPath)
      } catch {
        // ignore
      }
    }
  })
})
