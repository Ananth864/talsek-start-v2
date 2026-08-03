import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { writeFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * Characterisation spec for Applicant interview-by-token (ticket #12).
 * Seeds an `interview_sessions` row (Reachout #16 does not create sessions
 * yet), then exercises `/interview/$token`: start → question types → AI
 * follow-up/advance under `AI_PIPELINE_STUB=1` → Storage audio transcription
 * → completion. Also asserts expired tokens are rejected.
 */

test.use({
  permissions: ['microphone'],
  launchOptions: {
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
    ],
  },
})

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
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required to seed interview E2E',
    )
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Minimal valid WebM-ish bytes — stub transcription ignores content. */
function minimalWebm(): Buffer {
  return Buffer.from([
    0x1a, 0x45, 0xdf, 0xa3, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1f,
    0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81, 0x01, 0x42, 0xf2, 0x81, 0x04,
    0x42, 0xf3, 0x81, 0x08, 0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6d, 0x42,
    0x87, 0x81, 0x02, 0x42, 0x85, 0x81, 0x02,
  ])
}

async function seedInterviewSession(jobId: string): Promise<{
  token: string
  sessionId: string
}> {
  const admin = adminClient()

  const { data: job, error: jobError } = await admin
    .from('jobs')
    .select('id, company_id, title, salary_range')
    .eq('id', jobId)
    .single()
  if (jobError) throw new Error(`Failed to load job: ${jobError.message}`)

  const { data: stage } = await admin
    .from('job_stages')
    .select('id')
    .eq('job_id', jobId)
    .order('stage_order', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (!stage) {
    throw new Error('Job has no stages — create a Job before interview E2E')
  }

  const email = `e2e.interview.${Date.now()}@example.com`
  const { data: candidateId, error: candidateError } = await admin.rpc(
    'find_or_create_candidate',
    { candidate_email: email },
  )
  if (candidateError) {
    throw new Error(`Failed to create candidate: ${candidateError.message}`)
  }

  const { data: application, error: appError } = await admin
    .from('job_applications')
    .insert({
      job_id: jobId,
      candidate_id: candidateId,
      candidate_name: 'E2E Interview Candidate',
      status: 'active',
      current_stage_id: stage.id,
      processing_source: 'form',
      resume_url: `${job.company_id}/${jobId}/e2e-interview-placeholder.pdf`,
      match_score: 0,
      final_score: 0,
      meets_all_non_negotiables: false,
      preferred_requirements_matched: 0,
    })
    .select('id')
    .single()
  if (appError) {
    throw new Error(`Failed to create job application: ${appError.message}`)
  }

  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const interviewContext = {
    candidate_name: 'E2E Interview Candidate',
    job_title: job.title || 'Position',
    company_name: 'E2E Company',
    questions: [
      {
        id: 'q1',
        category: 'question',
        type: 'transcription_only',
        question: 'Please introduce yourself briefly.',
      },
      {
        id: 'q2',
        category: 'question',
        type: 'ai_conversation',
        question: 'Describe a challenging project you led recently.',
        max_follow_ups: 1,
      },
      {
        id: 'q3',
        category: 'question',
        type: 'boolean_choice',
        question: 'Are you willing to work the required shift timings?',
      },
      {
        id: 'q4',
        category: 'question',
        type: 'manual_input',
        question: 'What is your current CTC?',
        placeholder: 'Enter amount',
      },
      {
        id: 'q5',
        category: 'informative',
        type: 'display_only',
        question:
          'Thank you for completing this interview. We will be in touch soon.',
      },
    ],
  }

  const { data: session, error: sessionError } = await admin
    .from('interview_sessions')
    .insert({
      job_application_id: application.id,
      candidate_id: candidateId,
      job_id: jobId,
      token,
      status: 'pending',
      expires_at: expiresAt,
      interview_context: interviewContext,
      current_question_index: 0,
      questions_completed: [],
      current_question_follow_ups: [],
    })
    .select('id')
    .single()

  if (sessionError) {
    throw new Error(`Failed to seed interview session: ${sessionError.message}`)
  }

  return { token, sessionId: session.id }
}

async function seedExpiredInterviewSession(jobId: string): Promise<string> {
  const admin = adminClient()
  const { data: job } = await admin
    .from('jobs')
    .select('id, title')
    .eq('id', jobId)
    .single()
  if (!job) throw new Error('Job not found for expired session seed')

  const { data: stage } = await admin
    .from('job_stages')
    .select('id')
    .eq('job_id', jobId)
    .order('stage_order', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (!stage) throw new Error('No stages')

  const email = `e2e.interview.expired.${Date.now()}@example.com`
  const { data: candidateId } = await admin.rpc('find_or_create_candidate', {
    candidate_email: email,
  })

  const { data: application, error: appError } = await admin
    .from('job_applications')
    .insert({
      job_id: jobId,
      candidate_id: candidateId,
      candidate_name: 'E2E Expired Interview',
      status: 'active',
      current_stage_id: stage.id,
      processing_source: 'form',
      resume_url: `${jobId}/e2e-expired-placeholder.pdf`,
      match_score: 0,
      final_score: 0,
      meets_all_non_negotiables: false,
      preferred_requirements_matched: 0,
    })
    .select('id')
    .single()
  if (appError) {
    throw new Error(`Failed to seed expired JA: ${appError.message}`)
  }

  const token = randomUUID()
  const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { error } = await admin.from('interview_sessions').insert({
    job_application_id: application.id,
    candidate_id: candidateId,
    job_id: jobId,
    token,
    status: 'pending',
    expires_at: past,
    interview_context: {
      candidate_name: 'E2E Expired Interview',
      job_title: job.title || 'Position',
      company_name: 'E2E Company',
      questions: [
        {
          id: 'q1',
          category: 'informative',
          type: 'display_only',
          question: 'Unused',
        },
      ],
    },
    current_question_index: 0,
    questions_completed: [],
    current_question_follow_ups: [],
  })
  if (error) throw new Error(`Failed to seed expired session: ${error.message}`)
  return token
}

test('invalid interview token is rejected', async ({ page }) => {
  await page.goto(`/interview/${randomUUID()}`)
  await expect(page.getByTestId('interview-invalid')).toBeVisible({
    timeout: 15_000,
  })
})

test('expired interview token is rejected', async ({ page }) => {
  test.setTimeout(90_000)

  await signIn(page)
  await expect(page.getByRole('heading', { name: 'Jobs' })).toBeVisible()
  const firstJob = page.getByTestId('job-card').first()
  await expect(firstJob).toBeVisible()
  await firstJob.click()
  await expect(page).toHaveURL(/jobId=/)
  const jobId = new URL(page.url()).searchParams.get('jobId')
  expect(jobId).toBeTruthy()

  const token = await seedExpiredInterviewSession(jobId!)
  await page.context().clearCookies()
  await page.goto(`/interview/${token}`)
  await expect(page.getByTestId('interview-invalid')).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByTestId('interview-invalid')).toContainText(/expired/i)
})

test('applicant completes interview by token with stubbed AI', async ({
  page,
}) => {
  test.setTimeout(180_000)

  await signIn(page)
  await expect(page.getByRole('heading', { name: 'Jobs' })).toBeVisible()
  const firstJob = page.getByTestId('job-card').first()
  await expect(firstJob).toBeVisible()
  await firstJob.click()
  await expect(page).toHaveURL(/jobId=/)
  const jobId = new URL(page.url()).searchParams.get('jobId')
  expect(jobId).toBeTruthy()

  const { token, sessionId } = await seedInterviewSession(jobId!)

  await page.context().clearCookies()
  await page.goto(`/interview/${token}`)
  await expect(page.getByTestId('interview-page')).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByTestId('interview-welcome')).toBeVisible()

  // Wait until mic check settles (granted, denied, or fake device).
  await expect(page.getByTestId('interview-begin')).toBeEnabled({
    timeout: 15_000,
  })
  await page.getByTestId('interview-begin').click()
  await expect(page.getByTestId('interview-stage')).toBeVisible({
    timeout: 20_000,
  })
  // Surface start errors immediately if present.
  await expect(page.getByTestId('interview-start-error')).toHaveCount(0)

  // Q1 transcription_only — Storage upload + stub Whisper
  const webmPath = join(tmpdir(), `e2e-interview-${Date.now()}.webm`)
  writeFileSync(webmPath, minimalWebm())
  try {
    await page.getByTestId('interview-audio-file').setInputFiles(webmPath)
    // Stub transcription may advance so quickly that the pending-transcription
    // banner is already cleared — accept either the banner or Q2 progress.
    await Promise.race([
      page
        .getByTestId('interview-transcription')
        .waitFor({ state: 'visible', timeout: 30_000 }),
      page
        .getByTestId('interview-progress')
        .filter({ hasText: 'Question 2' })
        .waitFor({ state: 'visible', timeout: 30_000 }),
    ])
    // After stub transcription + conversation, advances to Q2
    await expect(page.getByTestId('interview-progress')).toContainText(
      'Question 2',
      { timeout: 30_000 },
    )

    // Q2 ai_conversation — first answer → follow-up (stub), second → next
    await page.getByTestId('interview-typed-answer').fill(
      'I led a migration of our ATS from SPA to TanStack Start with AI scoring.',
    )
    await page.getByTestId('interview-typed-submit').click()
    await expect(page.getByTestId('interview-voice')).toContainText(
      /concrete example/i,
      { timeout: 20_000 },
    )
    await page.getByTestId('interview-typed-answer').fill(
      'We cut resume screening latency by shipping a sync pipeline with stubs for E2E.',
    )
    await page.getByTestId('interview-typed-submit').click()
    await expect(page.getByTestId('interview-progress')).toContainText(
      'Question 3',
      { timeout: 20_000 },
    )

    // Q3 boolean
    await page.getByTestId('interview-boolean-yes').click()
    await expect(page.getByTestId('interview-progress')).toContainText(
      'Question 4',
      { timeout: 15_000 },
    )

    // Q4 manual
    await page.getByTestId('interview-manual-input').fill('1200000')
    await page.getByTestId('interview-manual-submit').click()
    await expect(page.getByTestId('interview-progress')).toContainText(
      'Question 5',
      { timeout: 15_000 },
    )

    // Q5 display_only → complete
    await page.getByTestId('interview-display-continue').click()
    await expect(page.getByTestId('interview-complete')).toBeVisible({
      timeout: 15_000,
    })
  } finally {
    try {
      unlinkSync(webmPath)
    } catch {
      // ignore
    }
  }

  const admin = adminClient()
  const { data: finished } = await admin
    .from('interview_sessions')
    .select('status, questions_completed, current_question_index')
    .eq('id', sessionId)
    .single()

  expect(finished?.status).toBe('completed')
  const completed = finished?.questions_completed
  expect(Array.isArray(completed) ? completed.length : 0).toBeGreaterThan(0)
})
