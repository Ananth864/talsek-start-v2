import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

/**
 * #20 — single Shortlist sends Reachout (EMAIL_STUB) and advances stage.
 * Seeds a Job Application via admin (same pattern as resume-pipeline), ensures
 * Reachout Templates + credits, then exercises the confirm dialog. Asserts
 * `sent_reachout_emails` (stub observable) + resulting Job Stage.
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
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for shortlist E2E',
    )
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function ensureE2EPermsTemplateAndCredits(): Promise<{
  companyId: string
  userId: string
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
    subject: 'E2E Reachout {{job_title}}',
    body: `Hi {{candidate_name}},\n\nWe would like to move forward for {{job_title}}.\n\nBest,\nE2E`,
    reply_to_email: email,
    created_at: new Date().toISOString(),
  }
  const interview = {
    subject: 'E2E Interview {{job_title}}',
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

  return { companyId, userId: profile.id }
}

async function seedActiveApplication(jobId: string): Promise<{
  applicationId: string
  candidateEmail: string
  firstStageId: string
  secondStageId: string
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

  const { data: stages, error: stagesError } = await admin
    .from('job_stages')
    .select('id, stage_order')
    .eq('job_id', jobId)
    .order('stage_order', { ascending: true })
  if (stagesError) {
    throw new Error(`Failed to load stages: ${stagesError.message}`)
  }
  if (stages.length < 2) {
    throw new Error('E2E Job needs at least two hiring stages for shortlist')
  }

  const candidateId = randomUUID()
  const candidateEmail = `e2e.shortlist.${randomUUID().slice(0, 8)}@example.com`
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
    candidate_name: 'E2E Shortlist Candidate',
    status: 'active',
    processing_source: 'form',
    match_score: 20,
    final_score: 80,
    meets_all_non_negotiables: true,
    preferred_requirements_matched: 1,
    parsed_candidate_data: {
      name: 'E2E Shortlist Candidate',
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
      summary: 'Seeded for Shortlist Reachout E2E.',
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

  void job
  return {
    applicationId,
    candidateEmail,
    firstStageId: stages[0].id,
    secondStageId: stages[1].id,
  }
}

test.describe('Shortlist Reachout send (#20)', () => {
  test('shortlist opens confirm dialog, stubs email, advances stage', async ({
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

    const { applicationId, candidateEmail, firstStageId, secondStageId } =
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

    // Let hydration settle; locale date mismatches used to remount and drop the
    // first Shortlist click. Fixed en-US formatting + one retry covers residual races.
    await page.waitForLoadState('networkidle')
    await expect(card.getByTestId('candidate-shortlist')).toHaveAttribute(
      'data-can-send-reachout',
      'true',
    )
    await expect(card.getByTestId('candidate-shortlist')).toBeEnabled()

    const list = page.getByTestId('candidates-list')
    for (let attempt = 0; attempt < 2; attempt++) {
      await card.getByTestId('candidate-shortlist').click()
      const active = await list.getAttribute('data-shortlist-active')
      if (active === applicationId) break
      if (attempt === 1) {
        await expect
          .poll(async () => list.getAttribute('data-shortlist-active'), {
            timeout: 10_000,
          })
          .toBe(applicationId)
      }
    }

    const setup = page.getByTestId('shortlist-template-setup-dialog')
    const dialog = page.getByTestId('candidate-shortlist-dialog')
    const shortlistError = card.getByTestId('candidate-shortlist-error')
    await expect(setup.or(dialog).or(shortlistError)).toBeVisible({
      timeout: 30_000,
    })
    if (await shortlistError.isVisible()) {
      throw new Error(`Shortlist blocked: ${await shortlistError.innerText()}`)
    }
    if (await setup.isVisible()) {
      await page.getByTestId('setup-reply-to').fill(process.env.E2E_EMAIL!)
      await page.getByTestId('setup-template-save').click()
      await expect(dialog).toBeVisible({ timeout: 20_000 })
    }

    await expect(page.getByTestId('shortlist-subject')).not.toHaveValue('')
    await expect(page.getByTestId('shortlist-body')).not.toHaveValue('')

    const subjectMarker = `E2E-SL-${Date.now()}`
    await page.getByTestId('shortlist-subject').fill(subjectMarker)

    await page.getByTestId('candidate-shortlist-confirm').click()
    await expect(dialog).toHaveCount(0, { timeout: 30_000 })

    await page.goto(`/dashboard?jobId=${jobId}&stageId=${secondStageId}`)
    await expect(
      page.getByTestId('candidate-card').filter({ hasText: candidateEmail }),
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
            .eq('job_application_id', applicationId)
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
      .eq('job_application_id', applicationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    expect(emailRow?.sendgrid_message_id).toMatch(/^stub-/)
  })
})
