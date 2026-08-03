import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

/**
 * Characterisation for billing Usage tab (#30).
 * Seeds credit_transactions (service role) and asserts charts + per-Job table
 * render with correct aggregates. Runs under BILLING_STUB via Playwright webServer.
 */

async function signIn(page: Page) {
  await page.goto('/signin')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Email').fill(process.env.E2E_EMAIL!)
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

function adminClient() {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for billing usage E2E',
    )
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

test.describe('billing usage tab', () => {
  test('Usage tab shows time/service charts and per-Job aggregates from seeded data', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    const admin = adminClient()
    const email = process.env.E2E_EMAIL!

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, company_id')
      .eq('email', email)
      .maybeSingle()
    if (profileError || !profile?.company_id) {
      throw new Error(`E2E member profile not found: ${profileError?.message}`)
    }
    const companyId = profile.company_id

    const { data: job, error: jobError } = await admin
      .from('jobs')
      .select('id, title')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (jobError || !job) {
      throw new Error(
        `Need an active Job for usage E2E: ${jobError?.message ?? 'none found'}`,
      )
    }

    const { data: stage, error: stageError } = await admin
      .from('job_stages')
      .select('id')
      .eq('job_id', job.id)
      .order('stage_order', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (stageError || !stage) {
      throw new Error(
        `Job has no stages for usage seed: ${stageError?.message}`,
      )
    }

    const candidateId = randomUUID()
    const applicationId = randomUUID()
    const sessionId = randomUUID()
    const txIds = [randomUUID(), randomUUID(), randomUUID()]
    const resumeCreditsEach = 5
    const interviewCredits = 40
    const expectedJobCredits = resumeCreditsEach * 2 + interviewCredits

    const cleanup = async () => {
      await admin.from('credit_transactions').delete().in('id', txIds)
      await admin.from('interview_sessions').delete().eq('id', sessionId)
      await admin.from('job_applications').delete().eq('id', applicationId)
      await admin.from('candidates').delete().eq('id', candidateId)
    }

    try {
      const { error: candidateError } = await admin.from('candidates').insert({
        id: candidateId,
        email: `e2e.usage.${Date.now()}@example.com`,
      })
      if (candidateError) {
        throw new Error(`seed candidate failed: ${candidateError.message}`)
      }

      const { error: appError } = await admin.from('job_applications').insert({
        id: applicationId,
        job_id: job.id,
        candidate_id: candidateId,
        current_stage_id: stage.id,
        candidate_name: 'E2E Usage Seed',
        status: 'active',
        processing_source: 'form',
        match_score: 0,
        final_score: 0,
        meets_all_non_negotiables: false,
        preferred_requirements_matched: 0,
      })
      if (appError) {
        throw new Error(`seed application failed: ${appError.message}`)
      }

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const { error: sessionError } = await admin
        .from('interview_sessions')
        .insert({
          id: sessionId,
          job_id: job.id,
          job_application_id: applicationId,
          candidate_id: candidateId,
          token: `e2e-usage-${sessionId.slice(0, 8)}`,
          expires_at: expiresAt,
          status: 'completed',
          interview_context: {},
        })
      if (sessionError) {
        throw new Error(`seed interview session failed: ${sessionError.message}`)
      }

      const now = new Date().toISOString()
      const { error: txError } = await admin.from('credit_transactions').insert([
        {
          id: txIds[0],
          company_id: companyId,
          amount: -resumeCreditsEach,
          balance_after: 0,
          description: 'E2E usage resume 1',
          reference_id: applicationId,
          reference_type: 'job_application',
          transaction_type: 'resume_screening',
          created_at: now,
        },
        {
          id: txIds[1],
          company_id: companyId,
          amount: -resumeCreditsEach,
          balance_after: 0,
          description: 'E2E usage resume 2',
          reference_id: applicationId,
          reference_type: 'job_application',
          transaction_type: 'resume_screening',
          created_at: now,
        },
        {
          id: txIds[2],
          company_id: companyId,
          amount: -interviewCredits,
          balance_after: 0,
          description: 'E2E usage interview',
          reference_id: sessionId,
          reference_type: 'interview_session',
          transaction_type: 'screening_interview',
          created_at: now,
        },
      ])
      if (txError) {
        throw new Error(`seed credit_transactions failed: ${txError.message}`)
      }

      await signIn(page)
      await page.goto('/billing')
      await expect(page.getByRole('heading', { name: 'Billing' })).toBeVisible()

      await page.getByTestId('usage-tab').click()
      await expect(page.getByTestId('usage-panel')).toBeVisible()
      await expect(page.getByTestId('usage-daily-chart')).toBeVisible()
      await expect(page.getByTestId('usage-service-chart')).toBeVisible()
      await expect(page.getByTestId('usage-job-table')).toBeVisible()

      await expect(page.getByText('Daily Credit Usage')).toBeVisible()
      await expect(page.getByText('Usage by Service')).toBeVisible()
      await expect(page.getByText('Credits Used per Job')).toBeVisible()

      // Totals include any pre-existing company usage — assert at least our seed.
      const totalText = await page
        .getByTestId('usage-total-credits')
        .innerText()
      const total = Number(totalText.replace(/,/g, ''))
      expect(total).toBeGreaterThanOrEqual(expectedJobCredits)

      const jobRow = page.getByTestId(`usage-job-row-${job.id}`)
      await expect(jobRow).toBeVisible()
      await expect(jobRow).toContainText(job.title)

      const resumesText = await page
        .getByTestId(`usage-job-resumes-${job.id}`)
        .innerText()
      const interviewsText = await page
        .getByTestId(`usage-job-interviews-${job.id}`)
        .innerText()
      const creditsText = await page
        .getByTestId(`usage-job-credits-${job.id}`)
        .innerText()

      expect(Number(resumesText)).toBeGreaterThanOrEqual(2)
      expect(Number(interviewsText)).toBeGreaterThanOrEqual(1)
      expect(Number(creditsText.replace(/,/g, ''))).toBeGreaterThanOrEqual(
        expectedJobCredits,
      )
    } finally {
      await cleanup()
    }
  })
})
