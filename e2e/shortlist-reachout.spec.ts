import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import {
  ensureShortlistMemberReady,
  shortlistAdminClient,
  signInAsE2EMember,
} from './helpers/shortlist'

/**
 * #20 — single Shortlist sends Reachout (EMAIL_STUB) and advances stage.
 * Seeds a Job Application via admin (same pattern as resume-pipeline), ensures
 * Reachout Templates + credits, then exercises the confirm dialog. Asserts
 * `sent_reachout_emails` (stub observable) + resulting Job Stage.
 */

async function seedActiveApplication(jobId: string): Promise<{
  applicationId: string
  candidateEmail: string
  firstStageId: string
  secondStageId: string
}> {
  const admin = shortlistAdminClient()
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
    await ensureShortlistMemberReady()
    await signInAsE2EMember(page)
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

    const admin = shortlistAdminClient()
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
