import { test, expect } from '@playwright/test'
import { writeFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  ensureShortlistMemberReady,
  restoreCredits,
  shortlistAdminClient,
  signInAsE2EMember,
  snapshotAndZeroCredits,
} from './helpers/shortlist'

/**
 * Characterisation spec for bulk upload + bulk Shortlist Reachout + bulk reject
 * (#10 / #21). Upload still exercises Storage → pipeline; Shortlist asserts
 * stubbed `sent_reachout_emails` + stage advance; reject asserts status.
 */

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

async function ensureJobHasNextStage(jobId: string): Promise<{
  firstStageId: string
  secondStageId: string
  jobTitle: string
}> {
  const admin = shortlistAdminClient()
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
  const admin = shortlistAdminClient()
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

// ─── Bulk credits-gate helpers (#44) ──────────────────────────────────────

async function findPreInterviewStage(
  companyId: string,
): Promise<{ jobId: string; stageId: string }> {
  const admin = shortlistAdminClient()
  const { data: rows, error } = await admin
    .from('job_stages')
    .select(
      'id, job_id, stage_order, hiring_stage:hiring_stages(name), jobs!inner(company_id)',
    )
    .eq('jobs.company_id', companyId)
    .order('stage_order', { ascending: true })
  if (error) {
    throw new Error(`Failed to load stages: ${error.message}`)
  }

  const byJob = new Map<
    string,
    { id: string; name: string; order: number }[]
  >()
  for (const row of rows ?? []) {
    const hs = row.hiring_stage as
      | { name?: string }
      | { name?: string }[]
      | null
    const name = Array.isArray(hs) ? hs[0]?.name : hs?.name
    if (!row.job_id || !name) continue
    const arr = byJob.get(row.job_id) ?? []
    arr.push({ id: row.id, name, order: row.stage_order })
    byJob.set(row.job_id, arr)
  }

  for (const [jobId, stages] of byJob) {
    const interviewIdx = stages.findIndex(
      (s) => s.name === 'Screening Interview',
    )
    if (interviewIdx > 0) {
      return { jobId, stageId: stages[interviewIdx - 1].id }
    }
  }
  throw new Error(
    'No Job with a stage before Screening Interview found for the E2E company',
  )
}

async function seedCandidateAtStage(
  jobId: string,
  stageId: string,
  marker: string,
): Promise<string> {
  const admin = shortlistAdminClient()
  const candidateId = randomUUID()
  const candidateEmail = `e2e.bulk.credits.${candidateId.slice(0, 8)}@example.com`
  const { error: candError } = await admin.from('candidates').insert({
    id: candidateId,
    email: candidateEmail,
  })
  if (candError) {
    throw new Error(`Failed to seed candidate: ${candError.message}`)
  }
  const { error: appError } = await admin.from('job_applications').insert({
    id: randomUUID(),
    job_id: jobId,
    candidate_id: candidateId,
    current_stage_id: stageId,
    candidate_name: marker,
    status: 'active',
    match_score: 20,
    final_score: 80,
    meets_all_non_negotiables: true,
    preferred_requirements_matched: 1,
    processing_source: 'form',
    parsed_candidate_data: {
      name: marker,
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
      summary: 'Seeded for bulk credits E2E.',
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
  return candidateEmail
}

test.describe('Bulk upload + bulk shortlist + bulk reject (#10 / #21)', () => {
  test('uploads a resume, bulk shortlists with Reachout, advances stage', async ({
    page,
  }) => {
    test.setTimeout(180_000)
    await ensureShortlistMemberReady({ templateLabel: 'E2E Bulk' })
    await signInAsE2EMember(page)
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

      const admin = shortlistAdminClient()
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
    await ensureShortlistMemberReady({ templateLabel: 'E2E Bulk' })
    await signInAsE2EMember(page)
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

    const admin = shortlistAdminClient()
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

  test('bulk interview shortlist blocks when credits are insufficient for the batch', async ({
    page,
  }) => {
    test.setTimeout(180_000)
    const { companyId } = await ensureShortlistMemberReady({
      templateLabel: 'E2E Bulk',
    })
    const snapshot = await snapshotAndZeroCredits(companyId)

    try {
      const { jobId, stageId } = await findPreInterviewStage(companyId)
      const email1 = await seedCandidateAtStage(
        jobId,
        stageId,
        'E2E Bulk Credits A',
      )
      const email2 = await seedCandidateAtStage(
        jobId,
        stageId,
        'E2E Bulk Credits B',
      )

      await signInAsE2EMember(page)
      await page.goto(`/dashboard?jobId=${jobId}&stageId=${stageId}`)
      await expect(page.getByTestId('candidates-list')).toBeVisible({
        timeout: 30_000,
      })
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(
        () => {},
      )

      const card1 = page
        .getByTestId('candidate-card')
        .filter({ hasText: email1 })
      const card2 = page
        .getByTestId('candidate-card')
        .filter({ hasText: email2 })
      await expect(card1).toBeVisible({ timeout: 60_000 })
      await expect(card2).toBeVisible({ timeout: 60_000 })

      await page.getByTestId('bulk-action-menu').click()
      await page.getByTestId('bulk-shortlist-enter').click()
      await expect(page.getByTestId('bulk-action-confirm-bar')).toBeVisible()
      await card1.getByTestId('candidate-bulk-select').click()
      await card2.getByTestId('candidate-bulk-select').click()
      await expect(page.getByTestId('bulk-action-confirm-bar')).toContainText(
        /2 selected/,
      )

      // The credit/rates queries may still be loading on first paint; the
      // bulk gate no-ops while they settle, then fires the blocking dialog.
      const modal = page.getByTestId('insufficient-credits-modal')
      await expect
        .poll(
          async () => {
            await page.getByTestId('bulk-action-confirm').click()
            return modal.isVisible().catch(() => false)
          },
          { timeout: 20_000 },
        )
        .toBe(true)
      await expect(modal).toBeVisible()
      await expect(
        page.getByTestId('insufficient-credits-required'),
      ).not.toHaveText('0')
    } finally {
      await restoreCredits(companyId, snapshot)
    }
  })
})
