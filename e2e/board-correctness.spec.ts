import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

/**
 * #24 — board correctness: fit filter, credits-exhausted banner,
 * insufficient-credits dialog, and 404. Credit states use admin ledger
 * seeding (same billing stub surface as billing.spec.ts).
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
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for board-correctness E2E',
    )
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function memberCompanyId(): Promise<{
  companyId: string
  userId: string
}> {
  const admin = adminClient()
  const email = process.env.E2E_EMAIL!
  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, company_id')
    .eq('email', email)
    .maybeSingle()
  if (error || !profile?.company_id) {
    throw new Error(`E2E member profile not found: ${error?.message}`)
  }
  return { companyId: profile.company_id, userId: profile.id }
}

type LedgerSnapshot = { id: string; amount_remaining: number }

/** Snapshot + zero remaining lots; optionally seed a small top-up lot. */
async function pinCreditBalance(
  companyId: string,
  target: number,
): Promise<{ snapshot: LedgerSnapshot[]; seededLotId: string | null }> {
  const admin = adminClient()
  const { data: lots, error } = await admin
    .from('credit_ledger')
    .select('id, amount_remaining')
    .eq('company_id', companyId)
  if (error) {
    throw new Error(`Failed to read credit ledger: ${error.message}`)
  }
  const snapshot = lots as LedgerSnapshot[]
  if (snapshot.length > 0) {
    const { error: zeroError } = await admin
      .from('credit_ledger')
      .update({ amount_remaining: 0 })
      .eq('company_id', companyId)
    if (zeroError) {
      throw new Error(`Failed to zero credits: ${zeroError.message}`)
    }
  }

  let seededLotId: string | null = null
  if (target > 0) {
    seededLotId = randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 365)
    const { error: insertError } = await admin.from('credit_ledger').insert({
      id: seededLotId,
      company_id: companyId,
      amount_initial: target,
      amount_remaining: target,
      expires_at: expiresAt.toISOString(),
      source_type: 'topup',
    })
    if (insertError) {
      throw new Error(`Failed to seed credit lot: ${insertError.message}`)
    }
  }
  return { snapshot, seededLotId }
}

async function restoreCreditBalance(
  companyId: string,
  snapshot: LedgerSnapshot[],
  seededLotId: string | null,
) {
  const admin = adminClient()
  if (seededLotId) {
    await admin.from('credit_ledger').delete().eq('id', seededLotId)
  }
  for (const lot of snapshot) {
    await admin
      .from('credit_ledger')
      .update({ amount_remaining: lot.amount_remaining })
      .eq('id', lot.id)
      .eq('company_id', companyId)
  }
}

async function ensureInterviewTemplate(companyId: string) {
  const admin = adminClient()
  const email = process.env.E2E_EMAIL!
  const { data: settingsRow } = await admin
    .from('company_settings')
    .select('company_id, settings')
    .eq('company_id', companyId)
    .maybeSingle()
  const settings = (settingsRow?.settings ?? {}) as Record<string, unknown>
  const interview = {
    subject: 'E2E Interview {{job_title}}',
    body: `Hi {{candidate_name}},\n\nPlease take the interview:\n{{interview_link}}\n\nBest,\nE2E`,
    reply_to_email: email,
    created_at: new Date().toISOString(),
  }
  const nextSettings = { ...settings, interview_template: interview }
  if (settingsRow) {
    const { error } = await admin
      .from('company_settings')
      .update({ settings: nextSettings })
      .eq('company_id', companyId)
    if (error) throw new Error(`Failed to seed interview template: ${error.message}`)
  } else {
    const { error } = await admin.from('company_settings').insert({
      company_id: companyId,
      settings: nextSettings,
    })
    if (error) throw new Error(`Failed to insert settings: ${error.message}`)
  }
}

async function seedActiveBeforeInterview(jobId: string): Promise<{
  applicationId: string
  candidateEmail: string
  stageId: string
}> {
  const admin = adminClient()
  const { error: jobError } = await admin
    .from('jobs')
    .select('id, company_id')
    .eq('id', jobId)
    .single()
  if (jobError) throw new Error(`Failed to load job: ${jobError.message}`)

  const { data: stages, error: stagesError } = await admin
    .from('job_stages')
    .select('id, stage_order, hiring_stage:hiring_stages(name)')
    .eq('job_id', jobId)
    .order('stage_order', { ascending: true })
  if (stagesError) {
    throw new Error(`Failed to load stages: ${stagesError.message}`)
  }
  if (stages.length === 0) {
    throw new Error('E2E Job has no hiring stages')
  }

  const interviewIndex = stages.findIndex((s) => {
    const hs = s.hiring_stage as { name?: string } | { name?: string }[] | null
    const name = Array.isArray(hs) ? hs[0]?.name : hs?.name
    return name === 'Screening Interview'
  })
  if (interviewIndex <= 0) {
    throw new Error(
      'E2E Job needs a stage before Screening Interview for credit-gate shortlist',
    )
  }
  const stageBeforeInterview = stages[interviewIndex - 1]

  const candidateId = randomUUID()
  const applicationId = randomUUID()
  const candidateEmail = `e2e.board.${candidateId.slice(0, 8)}@example.com`

  const { error: candError } = await admin.from('candidates').insert({
    id: candidateId,
    email: candidateEmail,
  })
  if (candError) {
    throw new Error(`Failed to seed candidate: ${candError.message}`)
  }

  const { error: appError } = await admin.from('job_applications').insert({
    id: applicationId,
    candidate_id: candidateId,
    candidate_name: 'E2E Board Candidate',
    job_id: jobId,
    current_stage_id: stageBeforeInterview.id,
    status: 'active',
    final_score: 80,
    match_score: 20,
    meets_all_non_negotiables: true,
    preferred_requirements_matched: 1,
    processing_source: 'form',
    parsed_candidate_data: {
      name: 'E2E Board Candidate',
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
      summary: 'Seeded for board-correctness E2E.',
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
    stageId: stageBeforeInterview.id,
  }
}

test.describe('Board correctness (#24)', () => {
  test('fit filter narrows the board and composes with stage tabs and search', async ({
    page,
  }) => {
    await signIn(page)
    await page.getByTestId('job-card').first().click()
    await expect(page).toHaveURL(/jobId=/)
    await expect(page.getByTestId('candidates-list')).toBeVisible()
    await expect(page.getByTestId('fit-filter')).toBeVisible()
    await expect(page.getByTestId('stage-tabs')).toBeVisible()
    await expect(page.getByTestId('candidate-search')).toBeVisible()

    await page.getByTestId('fit-filter').click()
    await page.getByTestId('fit-filter-rejected').click()
    await expect(page.getByTestId('fit-filter')).toContainText(/Rejected/i)

    const rejectedCards = page.getByTestId('candidate-card')
    const rejectedCount = await rejectedCards.count()
    if (rejectedCount === 0) {
      await expect(
        page.getByText(/no candidates match this filter/i),
      ).toBeVisible()
    } else {
      for (let i = 0; i < rejectedCount; i++) {
        await expect(
          rejectedCards.nth(i).getByTestId('candidate-status'),
        ).toHaveText(/rejected/i)
      }
    }

    await page.getByTestId('fit-filter').click()
    await page.getByTestId('fit-filter-all').click()
    await expect(page.getByTestId('fit-filter')).toContainText(/All Candidates/i)

    const search = page.getByTestId('candidate-search')
    await search.fill('___no_such_candidate_xyz___')
    await expect(
      page.getByText(/no candidates match this filter/i),
    ).toBeVisible()
    await search.fill('')

    const stageTabs = page.getByTestId('stage-tab')
    if ((await stageTabs.count()) > 1) {
      await stageTabs.nth(1).click()
      await expect(page).toHaveURL(/stageId=/)
      await expect(page.getByTestId('fit-filter')).toBeVisible()
    }
  })

  test('credits-exhausted banner appears when balance is too low, and not otherwise', async ({
    page,
  }) => {
    test.setTimeout(90_000)
    const { companyId } = await memberCompanyId()
    let snapshot: LedgerSnapshot[] = []
    let seededLotId: string | null = null

    try {
      ;({ snapshot, seededLotId } = await pinCreditBalance(companyId, 1000))
      await signIn(page)
      await expect(page.getByRole('heading', { name: 'Jobs' })).toBeVisible()
      await expect(page.getByTestId('credits-exhausted-banner')).toHaveCount(0)

      // Below resume-screening cost but not zero → Low Credits.
      await restoreCreditBalance(companyId, snapshot, seededLotId)
      ;({ snapshot, seededLotId } = await pinCreditBalance(companyId, 1))
      await page.reload()
      await expect(page.getByTestId('credits-exhausted-banner')).toBeVisible({
        timeout: 30_000,
      })
      await expect(page.getByTestId('credits-exhausted-banner')).toHaveAttribute(
        'data-state',
        'low',
      )

      await restoreCreditBalance(companyId, snapshot, seededLotId)
      ;({ snapshot, seededLotId } = await pinCreditBalance(companyId, 0))
      await page.reload()
      await expect(page.getByTestId('credits-exhausted-banner')).toBeVisible({
        timeout: 30_000,
      })
      await expect(page.getByTestId('credits-exhausted-banner')).toHaveAttribute(
        'data-state',
        'exhausted',
      )
      await page.getByTestId('credits-banner-add').click()
      await expect(page).toHaveURL(/\/billing/)
    } finally {
      await restoreCreditBalance(companyId, snapshot, seededLotId)
    }
  })

  test('paid interview shortlist with insufficient credits shows blocking dialog to billing', async ({
    page,
  }) => {
    test.setTimeout(90_000)
    const { companyId, userId } = await memberCompanyId()
    let snapshot: LedgerSnapshot[] = []
    let seededLotId: string | null = null

    try {
      const admin = adminClient()
      await admin
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
        .eq('id', userId)

      await ensureInterviewTemplate(companyId)
      ;({ snapshot, seededLotId } = await pinCreditBalance(companyId, 0))

      await signIn(page)
      await expect(page.getByTestId('candidates-list')).toBeVisible({
        timeout: 30_000,
      })
      const jobId = new URL(page.url()).searchParams.get('jobId')
      expect(jobId).toBeTruthy()

      const { applicationId, candidateEmail, stageId } =
        await seedActiveBeforeInterview(jobId!)

      await page.goto(`/dashboard?jobId=${jobId}&stageId=${stageId}`)
      await expect(page.getByTestId('candidates-list')).toBeVisible({
        timeout: 30_000,
      })

      const card = page
        .getByTestId('candidate-card')
        .filter({ hasText: candidateEmail })
      await expect(card).toBeVisible({ timeout: 30_000 })
      await expect(card).toHaveAttribute('data-application-id', applicationId)

      await card.getByTestId('candidate-shortlist').click()
      const modal = page.getByTestId('insufficient-credits-modal')
      await expect(modal).toBeVisible({ timeout: 20_000 })
      await expect(
        page.getByTestId('insufficient-credits-required'),
      ).not.toHaveText('0')

      await page.getByTestId('insufficient-credits-add').click()
      await expect(page).toHaveURL(/\/billing/)
    } finally {
      await restoreCreditBalance(companyId, snapshot, seededLotId)
    }
  })

  test('unknown URLs render a 404 page with a link home', async ({ page }) => {
    await page.goto('/this-route-definitely-does-not-exist-24')
    await expect(page.getByTestId('not-found-page')).toBeVisible()
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible()
    await expect(page.getByTestId('not-found-home')).toBeVisible()
    await page.getByTestId('not-found-home').click()
    await expect(page).toHaveURL(/\/(dashboard|signin)/)
  })
})
