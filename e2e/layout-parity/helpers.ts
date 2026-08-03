import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

/** Desktop-primary viewport for layout-parity (ADR-0030 §4). */
export const LAYOUT_PARITY_VIEWPORT = { width: 1280, height: 800 } as const

/**
 * Sign in as the configured E2E Member and land on /dashboard.
 * Shared by layout-parity specs only — do not import into behavioural e2e/.
 */
export async function signInAsMember(page: Page) {
  const email = process.env.E2E_EMAIL
  const password = process.env.E2E_PASSWORD
  if (!email || !password) {
    throw new Error('E2E_EMAIL and E2E_PASSWORD must be set for layout-parity')
  }

  await page.goto('/signin')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: /^sign in$/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

/** Admin client for layout-parity Applicant token seeding (duplicated from
 * behavioural apply/interview specs — do not import those files). */
export function layoutParityAdminClient() {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for Applicant layout-parity seeding',
    )
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Resolve the first Job on the Member dashboard for token seeding. */
export async function resolveFirstJobId(page: Page): Promise<string> {
  await signInAsMember(page)
  await expect(
    page.getByRole('heading', { name: 'Jobs', exact: true }),
  ).toBeVisible()
  const firstJob = page.getByTestId('job-card').first()
  await expect(firstJob).toBeVisible({ timeout: 15_000 })
  await firstJob.click()
  await expect(page).toHaveURL(/jobId=/)
  const jobId = new URL(page.url()).searchParams.get('jobId')
  if (!jobId) throw new Error('Expected jobId in URL after opening job card')
  return jobId
}

/**
 * Ensure an enabled Form Config exists for the Job (mandatory fields only)
 * and seed a short job description so JD expand chrome is assertable.
 */
export async function ensureApplyFormToken(jobId: string): Promise<{
  token: string
}> {
  const admin = layoutParityAdminClient()

  const { data: job, error: jobError } = await admin
    .from('jobs')
    .select('id, company_id, job_description_raw')
    .eq('id', jobId)
    .single()
  if (jobError) {
    throw new Error(`Failed to load job: ${jobError.message}`)
  }

  if (!job.job_description_raw?.trim()) {
    await admin
      .from('jobs')
      .update({
        job_description_raw:
          '<p>Layout-parity job description for Applicant apply chrome.</p>',
      })
      .eq('id', jobId)
  }

  const { data: stage } = await admin
    .from('job_stages')
    .select('id')
    .eq('job_id', jobId)
    .order('stage_order', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (!stage) {
    throw new Error('Job has no stages — cannot seed apply Form Config')
  }

  const { data: existing } = await admin
    .from('job_form_configs')
    .select('id, form_url_token')
    .eq('job_id', jobId)
    .eq('is_enabled', true)
    .limit(1)
    .maybeSingle()

  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  if (existing?.form_url_token) {
    await admin
      .from('job_form_configs')
      .update({
        is_enabled: true,
        expires_at: future,
        questions: [],
        custom_question_text: {},
      })
      .eq('id', existing.id)
    return { token: existing.form_url_token }
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

  return { token }
}

/** Seed a pending Interview Session for welcome + begin layout asserts. */
export async function seedPendingInterviewSession(jobId: string): Promise<{
  token: string
}> {
  const admin = layoutParityAdminClient()

  const { data: job, error: jobError } = await admin
    .from('jobs')
    .select('id, company_id, title')
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
    throw new Error('Job has no stages — cannot seed Interview Session')
  }

  const email = `layout.parity.interview.${Date.now()}@example.com`
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
      candidate_name: 'Layout Parity Interview Candidate',
      status: 'active',
      current_stage_id: stage.id,
      processing_source: 'form',
      resume_url: `${job.company_id}/${jobId}/layout-parity-interview.pdf`,
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
  const informativeMarker =
    'Now we will move on to the manual input section. Please type or select the appropriate answer for each question.'

  const { error: sessionError } = await admin.from('interview_sessions').insert({
    job_application_id: application.id,
    candidate_id: candidateId,
    job_id: jobId,
    token,
    status: 'pending',
    expires_at: expiresAt,
    interview_context: {
      candidate_name: 'Layout Parity Interview Candidate',
      job_title: job.title || 'Position',
      company_name: 'Layout Parity Co',
      questions: [
        {
          id: 'lp-q1',
          category: 'question',
          type: 'transcription_only',
          question: 'Please introduce yourself briefly.',
        },
        {
          id: 'lp-q2',
          category: 'informative',
          type: 'display_only',
          question: informativeMarker,
        },
        {
          id: 'lp-q3',
          category: 'question',
          type: 'boolean_choice',
          question: 'Are you open to relocating?',
        },
        {
          id: 'lp-q4',
          category: 'question',
          type: 'manual_input',
          question: 'What is your notice period in days?',
          placeholder: 'Enter days',
        },
        {
          id: 'lp-q5',
          category: 'informative',
          type: 'display_only',
          question: 'Thank you for completing this interview.',
        },
      ],
    },
    current_question_index: 0,
    questions_completed: [],
    current_question_follow_ups: [],
  })
  if (sessionError) {
    throw new Error(`Failed to seed interview session: ${sessionError.message}`)
  }

  return { token }
}
