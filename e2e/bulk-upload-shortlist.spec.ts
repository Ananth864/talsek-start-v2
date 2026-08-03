import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

/**
 * Characterisation spec for bulk upload + bulk Shortlist Reachout + bulk reject
 * (#10 / #21). Upload still exercises Storage → pipeline; Shortlist asserts
 * stubbed `sent_reachout_emails` + stage advance; reject asserts status.
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

async function ensureE2EPermsTemplateAndCredits(): Promise<{
  companyId: string
}> {
  const admin = adminClient()
  const email = process.env.E2E_EMAIL!
  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, company_id, permissions')
    .eq('email', email)
    .maybeSingle()
  if (error || !profile?.company_id) {
    throw new Error(`E2E member profile not found: ${error?.message}`)
  }

  const { error: updateError } = await admin
    .from('profiles')
    .update({
      role: 'admin',
      must_change_password: false,
      permissions: {
        canCreateJob: true,
        canSendReachout: true,
        canManageTemplates: true,
        canManageForms: true,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)
  if (updateError) {
    throw new Error(`Failed to seed permissions: ${updateError.message}`)
  }

  const companyId = profile.company_id
  const { data: settingsRow } = await admin
    .from('company_settings')
    .select('company_id, settings')
    .eq('company_id', companyId)
    .maybeSingle()

  const settings = (settingsRow?.settings ?? {}) as Record<string, unknown>
  const reachout = {
    subject: 'E2E Bulk Reachout {{job_title}}',
    body: `Hi {{candidate_name}},\n\nWe would like to move forward for {{job_title}}.\n\nBest,\nE2E`,
    reply_to_email: email,
    created_at: new Date().toISOString(),
  }
  const interview = {
    subject: 'E2E Bulk Interview {{job_title}}',
    body: `Hi {{candidate_name}},\n\nPlease take the interview:\n{{interview_link}}\n\nBest,\nE2E`,
    reply_to_email: email,
    created_at: new Date().toISOString(),
  }
  const nextSettings = {
    ...settings,
    reachout_template: reachout,
    interview_template: interview,
  }

  if (settingsRow) {
    const { error: settingsError } = await admin
      .from('company_settings')
      .update({ settings: nextSettings })
      .eq('company_id', companyId)
    if (settingsError) {
      throw new Error(`Failed to seed templates: ${settingsError.message}`)
    }
  } else {
    const { error: insertError } = await admin.from('company_settings').insert({
      company_id: companyId,
      settings: nextSettings,
    })
    if (insertError) {
      throw new Error(`Failed to insert templates: ${insertError.message}`)
    }
  }

  const { data: balance } = await admin.rpc('get_company_credit_balance', {
    p_company_id: companyId,
  })
  if (typeof balance !== 'number' || balance < 500) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 365)
    const { error: creditError } = await admin.from('credit_ledger').insert({
      company_id: companyId,
      amount_initial: 1000,
      amount_remaining: 1000,
      expires_at: expiresAt.toISOString(),
      source_type: 'topup',
    })
    if (creditError) {
      throw new Error(`Failed to seed credits: ${creditError.message}`)
    }
  }

  return { companyId }
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

async function seedActiveApplication(jobId: string): Promise<{
  applicationId: string
  candidateEmail: string
  firstStageId: string
}> {
  const admin = adminClient()
  const { data: stages, error: stagesError } = await admin
    .from('job_stages')
    .select('id, stage_order')
    .eq('job_id', jobId)
    .order('stage_order', { ascending: true })
  if (stagesError) {
    throw new Error(`Failed to load stages: ${stagesError.message}`)
  }
  if (stages.length < 1) {
    throw new Error('E2E Job needs at least one hiring stage')
  }

  const candidateId = randomUUID()
  const candidateEmail = `e2e.bulk.reject.${randomUUID().slice(0, 8)}@example.com`
  const { error: candidateError } = await admin.from('candidates').insert({
    id: candidateId,
    email: candidateEmail,
  })
  if (candidateError) {
    throw new Error(`Failed to seed candidate: ${candidateError.message}`)
  }

  const applicationId = randomUUID()
  const { error: appError } = await admin.from('job_applications').insert({
    id: applicationId,
    job_id: jobId,
    candidate_id: candidateId,
    current_stage_id: stages[0].id,
    candidate_name: 'E2E Bulk Reject Candidate',
    status: 'active',
    processing_source: 'form',
    match_score: 20,
    final_score: 80,
    meets_all_non_negotiables: true,
    preferred_requirements_matched: 1,
    parsed_candidate_data: {
      name: 'E2E Bulk Reject Candidate',
      email: candidateEmail,
      phone: 'not mentioned',
      location: 'Remote',
      current_role: 'Engineer',
      total_experience_years: 3,
      work_experience: [],
      education: [],
      technical_skills: [{ skill: 'TypeScript', justification: 'E2E' }],
      soft_skills: [],
      certifications: [],
      summary: 'Seeded for bulk reject E2E.',
      potential_concerns: [],
      potential_concerns_questions: [],
      career_level: 'mid',
    },
    ai_analysis: {
      recommendation: 'GOOD_FIT',
      individual_scores: {
        role_responsibility_readiness_score: 70,
        concerns_mitigation_score: 70,
        prestige_score: 70,
        overall_fit_score: 70,
      },
      rationale: 'E2E seed',
      candidate_readiness: 'Ready',
      strengths_for_role: ['TypeScript'],
      potential_concerns: [],
      preferred_requirements_analysis: { details: [] },
      non_negotiables_analysis: { details: [] },
    },
  })
  if (appError) {
    throw new Error(`Failed to seed job application: ${appError.message}`)
  }

  return {
    applicationId,
    candidateEmail,
    firstStageId: stages[0].id,
  }
}

test.describe('Bulk upload + bulk shortlist + bulk reject (#10 / #21)', () => {
  test('uploads a resume, bulk shortlists with Reachout, advances stage', async ({
    page,
  }) => {
    test.setTimeout(180_000)
    await ensureE2EPermsTemplateAndCredits()
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
      const applicationId = await card.getAttribute('data-application-id')
      expect(applicationId).toBeTruthy()

      await page.getByTestId('bulk-shortlist-enter').click()
      await expect(page.getByTestId('bulk-action-confirm-bar')).toBeVisible()
      await card.getByTestId('candidate-bulk-select').click()
      await expect(page.getByTestId('bulk-action-confirm-bar')).toContainText(
        '1 selected',
      )
      await page.getByTestId('bulk-action-confirm').click()
      await expect(page.getByTestId('bulk-shortlist-dialog')).toBeVisible()
      await expect(page.getByTestId('bulk-shortlist-subject')).not.toHaveValue('')
      await expect(page.getByTestId('bulk-shortlist-body')).not.toHaveValue('')

      const subjectMarker = `E2E-BULK-SL-${Date.now()}`
      await page.getByTestId('bulk-shortlist-subject').fill(subjectMarker)

      await page.getByTestId('bulk-shortlist-confirm').click()
      await expect(page.getByTestId('bulk-shortlist-dialog')).toHaveCount(0, {
        timeout: 60_000,
      })

      await page.goto(`/dashboard?jobId=${jobId}&stageId=${secondStageId}`)
      await expect(
        page.getByTestId('candidate-card').filter({ hasText: uniqueEmail }),
      ).toBeVisible({ timeout: 30_000 })

      const admin = adminClient()
      await expect
        .poll(
          async () => {
            const { data } = await admin
              .from('sent_reachout_emails')
              .select(
                'id, status, subject, sendgrid_message_id, target_stage_id',
              )
              .eq('job_application_id', applicationId!)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
            return data
          },
          { timeout: 20_000 },
        )
        .toMatchObject({
          status: 'sent',
          subject: subjectMarker,
          target_stage_id: secondStageId,
        })

      const { data: emailRow } = await admin
        .from('sent_reachout_emails')
        .select('sendgrid_message_id')
        .eq('job_application_id', applicationId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      expect(emailRow?.sendgrid_message_id).toMatch(/^stub-/)
    } finally {
      try {
        unlinkSync(pdfPath)
      } catch {
        // ignore
      }
    }
  })

  test('bulk reject marks selected Job Applications rejected', async ({
    page,
  }) => {
    test.setTimeout(120_000)
    await ensureE2EPermsTemplateAndCredits()
    await signIn(page)
    await expect(page.getByTestId('candidates-list')).toBeVisible({
      timeout: 30_000,
    })

    const jobId = new URL(page.url()).searchParams.get('jobId')
    expect(jobId).toBeTruthy()

    const { applicationId, candidateEmail, firstStageId } =
      await seedActiveApplication(jobId!)

    await page.goto(`/dashboard?jobId=${jobId}&stageId=${firstStageId}`)
    await expect(page.getByTestId('candidates-list')).toBeVisible({
      timeout: 30_000,
    })

    const card = page
      .getByTestId('candidate-card')
      .filter({ hasText: candidateEmail })
    await expect(card).toBeVisible({ timeout: 30_000 })
    await expect(card).toHaveAttribute('data-application-id', applicationId)

    await page.waitForLoadState('networkidle')
    const rejectEnter = page.getByTestId('bulk-reject-enter')
    await expect(rejectEnter).toBeEnabled()
    await rejectEnter.click()
    await expect(page.getByTestId('bulk-action-confirm-bar')).toBeVisible({
      timeout: 15_000,
    })
    await card.getByTestId('candidate-bulk-select').click()
    await expect(page.getByTestId('bulk-action-confirm-bar')).toContainText(
      '1 selected',
    )
    await page.getByTestId('bulk-action-confirm').click()
    await expect(page.getByTestId('bulk-reject-dialog')).toBeVisible()
    await page.getByTestId('bulk-reject-confirm').click()
    await expect(page.getByTestId('bulk-reject-dialog')).toHaveCount(0, {
      timeout: 30_000,
    })

    await expect(card).toContainText(/rejected/i, { timeout: 30_000 })

    const admin = adminClient()
    await expect
      .poll(
        async () => {
          const { data } = await admin
            .from('job_applications')
            .select('status')
            .eq('id', applicationId)
            .maybeSingle()
          return data?.status
        },
        { timeout: 15_000 },
      )
      .toBe('rejected')
  })
})
