import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

/**
 * Characterisation spec for Member interview review + form answers in the
 * candidate profile (ticket #22 / issue #22). Seeds a completed Interview
 * Session and a Form Submission on an E2E Job Application, then asserts the
 * profile Interview tab (Q&A + conversation transcript) and Form Answers
 * section on Requirement Analysis.
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
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required to seed profile review E2E',
    )
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function seedReviewFixtures(jobId: string): Promise<{
  candidateName: string
  applicationId: string
}> {
  const admin = adminClient()
  const candidateName = `E2E Review ${Date.now()}`

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
    throw new Error('Job has no stages — create a Job before profile review E2E')
  }

  const email = `e2e.review.${Date.now()}@example.com`
  const { data: candidateId, error: candidateError } = await admin.rpc(
    'find_or_create_candidate',
    { candidate_email: email },
  )
  if (candidateError || !candidateId) {
    throw new Error(
      `Failed to create candidate: ${candidateError?.message ?? 'null'}`,
    )
  }

  let formConfigId: string
  const { data: existingConfig } = await admin
    .from('job_form_configs')
    .select('id, form_url_token')
    .eq('job_id', jobId)
    .limit(1)
    .maybeSingle()

  if (existingConfig) {
    formConfigId = existingConfig.id
    await admin
      .from('job_form_configs')
      .update({
        is_enabled: true,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        questions: [],
        custom_question_text: {},
      })
      .eq('id', existingConfig.id)
  } else {
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
    const { data: created, error: configError } = await admin
      .from('job_form_configs')
      .insert({
        job_id: jobId,
        form_template_id: templateId,
        form_url_token: token,
        is_enabled: true,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        questions: [],
        custom_question_text: {},
      })
      .select('id')
      .single()
    if (configError) {
      throw new Error(`Failed to create form config: ${configError.message}`)
    }
    formConfigId = created.id
  }

  const { error: submissionError } = await admin.from('form_submissions').insert({
    job_form_config_id: formConfigId,
    candidate_id: candidateId,
    submission_data: {
      phone: '+15551234567',
      experience: 5,
      relocation: 'Yes',
    },
    resume_path: `${job.company_id}/${jobId}/e2e-review-placeholder.pdf`,
    ip_address: '127.0.0.1',
    user_agent: 'playwright-e2e',
    processing_status: 'processed',
    processed_at: new Date().toISOString(),
  })
  if (submissionError) {
    throw new Error(
      `Failed to seed form submission: ${submissionError.message}`,
    )
  }

  const { data: application, error: appError } = await admin
    .from('job_applications')
    .insert({
      job_id: jobId,
      candidate_id: candidateId,
      candidate_name: candidateName,
      status: 'active',
      current_stage_id: stage.id,
      processing_source: 'form',
      resume_url: `${job.company_id}/${jobId}/e2e-review-placeholder.pdf`,
      match_score: 72,
      final_score: 72,
      meets_all_non_negotiables: true,
      preferred_requirements_matched: 1,
    })
    .select('id')
    .single()
  if (appError) {
    throw new Error(`Failed to create job application: ${appError.message}`)
  }

  const interviewContext = {
    candidate_name: candidateName,
    job_title: job.title || 'Position',
    company_name: 'E2E Company',
    questions: [
      {
        id: 'q1',
        category: 'question',
        type: 'transcription_only',
        question: 'Please give a brief introduction about yourself.',
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
    ],
  }

  const questionsCompleted = [
    {
      questionId: 'q1',
      category: 'question',
      mainQuestion: 'Please give a brief introduction about yourself.',
      mainAnswer: 'I am a senior engineer with ten years of experience.',
      timestamp: new Date().toISOString(),
    },
    {
      questionId: 'q2',
      category: 'question',
      mainQuestion: 'Describe a challenging project you led recently.',
      mainAnswer: 'I led a migration of our billing system under a hard deadline.',
      followUps: [
        {
          question: 'What was the hardest trade-off you made?',
          answer: 'We deferred a non-critical reporting feature to hit the date.',
          reasoning: 'probe_depth',
          timestamp: new Date().toISOString(),
        },
      ],
      ai_assessment: 'Strong ownership and clear prioritisation.',
      satisfactory: true,
      timestamp: new Date().toISOString(),
    },
    {
      questionId: 'q3',
      category: 'question',
      mainQuestion: 'Are you willing to work the required shift timings?',
      mainAnswer: 'Yes',
      timestamp: new Date().toISOString(),
    },
    {
      questionId: 'q4',
      category: 'question',
      mainQuestion: 'What is your current CTC?',
      mainAnswer: '1500000',
      timestamp: new Date().toISOString(),
    },
  ]

  const { error: sessionError } = await admin.from('interview_sessions').insert({
    job_application_id: application.id,
    candidate_id: candidateId,
    job_id: jobId,
    token: randomUUID(),
    status: 'completed',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    interview_context: interviewContext,
    current_question_index: 4,
    questions_completed: questionsCompleted,
    current_question_follow_ups: [],
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  })
  if (sessionError) {
    throw new Error(
      `Failed to seed interview session: ${sessionError.message}`,
    )
  }

  return { candidateName, applicationId: application.id }
}

test('profile Interview tab and Form Answers show completed session + submission', async ({
  page,
}) => {
  await signIn(page)
  await expect(page.getByRole('heading', { name: 'Jobs' })).toBeVisible()

  const firstJob = page.getByTestId('job-card').first()
  await expect(firstJob).toBeVisible()
  await firstJob.click()
  await expect(page).toHaveURL(/jobId=/)

  const jobId = new URL(page.url()).searchParams.get('jobId')
  expect(jobId).toBeTruthy()

  const { candidateName } = await seedReviewFixtures(jobId!)

  // Reload the Job board so the seeded application appears.
  await page.goto(`/dashboard?jobId=${jobId}`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('candidates-list')).toBeVisible()

  const card = page
    .getByTestId('candidate-card')
    .filter({ hasText: candidateName })
  await expect(card).toBeVisible({ timeout: 30_000 })

  await card.getByTestId('candidate-view-profile').click()
  const dialog = page.getByTestId('candidate-profile-dialog')
  await expect(dialog).toBeVisible()

  // Interview score badge replaces Match when a session exists (async fetch).
  await expect(dialog.getByTestId('profile-interview-score')).toBeVisible({
    timeout: 15_000,
  })

  await dialog.getByRole('tab', { name: /^Interview$/i }).click()
  await expect(dialog.getByTestId('interview-session-panel')).toBeVisible()
  await expect(dialog.getByTestId('interview-session-status')).toContainText(
    /completed/i,
  )
  await expect(dialog.getByTestId('interview-analysis')).toBeVisible()
  await expect(dialog.getByText(/brief introduction/i)).toBeVisible()
  await expect(
    dialog.getByText(/challenging project you led recently/i),
  ).toBeVisible()

  await dialog.getByTestId('show-full-conversation').click()
  const conversation = page.getByTestId('conversation-modal')
  await expect(conversation).toBeVisible()
  await expect(
    conversation.getByText(/migration of our billing system/i),
  ).toBeVisible()
  await expect(conversation.getByTestId('conversation-follow-up')).toBeVisible()
  await expect(
    conversation.getByText(/hardest trade-off/i),
  ).toBeVisible()
  await conversation.getByTestId('conversation-close').click()
  await expect(conversation).toBeHidden()

  await dialog.getByRole('tab', { name: /Requirement Analysis/i }).click()
  await expect(dialog.getByTestId('form-answers-section')).toBeVisible()
  await expect(dialog.getByTestId('form-answer-row').first()).toBeVisible()
  await expect(dialog.getByText('+15551234567')).toBeVisible()
})
