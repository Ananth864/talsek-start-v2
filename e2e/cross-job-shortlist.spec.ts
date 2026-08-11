import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import {
  ensureShortlistMemberReady,
  shortlistAdminClient,
  signInAsE2EMember,
} from './helpers/shortlist'

/**
 * #45 — cross-Job Shortlist on the Candidates search page uses the shared
 * preparation module and resolves the correct Job + next Job Stage per result.
 *
 * Seeds two active Job Applications in two different Jobs, searches, asserts
 * both results are visible from differing Jobs, then Shortlists one and
 * verifies the Reachout targeted that result's Job Stage (not the other's).
 */

type SeededJobContext = {
  jobId: string
  jobTitle: string
  firstStageId: string
  secondStageId: string
}

async function findTwoShortlistableJobs(
  companyId: string,
): Promise<SeededJobContext[]> {
  const admin = shortlistAdminClient()
  const { data: jobs, error: jobsError } = await admin
    .from('jobs')
    .select('id, title')
    .eq('company_id', companyId)
  if (jobsError) {
    throw new Error(`Failed to load jobs: ${jobsError.message}`)
  }

  const contexts: SeededJobContext[] = []
  for (const job of jobs ?? []) {
    const { data: stages, error: stagesError } = await admin
      .from('job_stages')
      .select('id, stage_order')
      .eq('job_id', job.id)
      .order('stage_order', { ascending: true })
    if (stagesError || !stages || stages.length < 2) continue
    contexts.push({
      jobId: job.id,
      jobTitle: job.title,
      firstStageId: stages[0].id,
      secondStageId: stages[1].id,
    })
    if (contexts.length === 2) break
  }

  if (contexts.length < 2) {
    throw new Error(
      'E2E company needs at least two Jobs with two or more hiring stages for cross-job shortlist',
    )
  }
  return contexts
}

async function seedActiveApplication(
  ctx: SeededJobContext,
  candidateName: string,
): Promise<{ applicationId: string; candidateEmail: string }> {
  const admin = shortlistAdminClient()
  const candidateId = randomUUID()
  const candidateEmail = `e2e.xj.${randomUUID().slice(0, 8)}@example.com`
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
    job_id: ctx.jobId,
    candidate_id: candidateId,
    current_stage_id: ctx.firstStageId,
    candidate_name: candidateName,
    status: 'active',
    processing_source: 'form',
    match_score: 20,
    final_score: 80,
    meets_all_non_negotiables: true,
    preferred_requirements_matched: 1,
    parsed_candidate_data: {
      name: candidateName,
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
      summary: 'Seeded for cross-job Shortlist E2E.',
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

  return { applicationId, candidateEmail }
}

test.describe('Cross-job Shortlist (#45)', () => {
  test('shortlist from cross-job search resolves the correct Job and advances that result\u2019s stage', async ({
    page,
  }) => {
    test.setTimeout(120_000)
    const { companyId } = await ensureShortlistMemberReady()
    const [ctxA, ctxB] = await findTwoShortlistableJobs(companyId)

    const marker = `xj${randomUUID().slice(0, 6)}`
    const appA = await seedActiveApplication(ctxA, `E2E ${marker} A`)
    const appB = await seedActiveApplication(ctxB, `E2E ${marker} B`)

    await signInAsE2EMember(page)

    // Open the cross-job Candidates page from the sidebar.
    await page.getByTestId('candidates-nav').click()
    await expect(page).toHaveURL(/\/candidates/)
    await expect(page.getByTestId('candidates-page')).toBeVisible({
      timeout: 30_000,
    })

    // Search by the shared name marker so both seeded results are visible.
    await page.getByTestId('filter-name').fill(marker)
    await page.getByTestId('candidates-search').click()
    await expect(page.getByTestId('candidates-result-count')).toHaveText(
      /\d+ candidates? found/,
    )

    const cardA = page
      .getByTestId('candidate-card')
      .filter({ hasText: appA.candidateEmail })
    const cardB = page
      .getByTestId('candidate-card')
      .filter({ hasText: appB.candidateEmail })
    await expect(cardA).toBeVisible({ timeout: 30_000 })
    await expect(cardB).toBeVisible({ timeout: 30_000 })

    // The two visible results belong to different Jobs — the core cross-job
    // invariant. Proves the page resolved a distinct Job per result.
    await expect(cardA).toHaveAttribute('data-job-id', ctxA.jobId)
    await expect(cardB).toHaveAttribute('data-job-id', ctxB.jobId)
    expect(ctxA.jobId).not.toBe(ctxB.jobId)

    await expect(cardA).toHaveAttribute('data-application-id', appA.applicationId)
    await expect(cardB).toHaveAttribute('data-application-id', appB.applicationId)

    // Shortlist result A and complete the confirm flow.
    await page.waitForLoadState('networkidle')
    await expect(cardA.getByTestId('candidate-shortlist')).toHaveAttribute(
      'data-can-send-reachout',
      'true',
    )

    const setup = page.getByTestId('shortlist-template-setup-dialog')
    const dialog = page.getByTestId('candidate-shortlist-dialog')
    const shortlistError = cardA.getByTestId('candidate-shortlist-error')

    for (let attempt = 0; attempt < 3; attempt++) {
      await cardA.getByTestId('candidate-shortlist').click()
      await expect(setup.or(dialog).or(shortlistError)).toBeVisible({
        timeout: 20_000,
      })
      if (await dialog.isVisible().catch(() => false)) break
      if (await shortlistError.isVisible()) {
        throw new Error(
          `Shortlist blocked: ${await shortlistError.innerText()}`,
        )
      }
      // Templates may need a moment to load; retry the click.
      if (await setup.isVisible().catch(() => false)) {
        await page.getByTestId('setup-reply-to').fill(process.env.E2E_EMAIL!)
        await page.getByTestId('setup-template-save').click()
        await expect(dialog).toBeVisible({ timeout: 20_000 })
        break
      }
    }
    await expect(dialog).toBeVisible({ timeout: 20_000 })

    // The personalized body references result A's Job, not result B's.
    await expect(page.getByTestId('shortlist-body')).toHaveValue(
      new RegExp(ctxA.jobTitle),
    )
    await expect(page.getByTestId('shortlist-subject')).not.toHaveValue('')

    const subjectMarker = `E2E-XJ-${Date.now()}`
    await page.getByTestId('shortlist-subject').fill(subjectMarker)
    await page.getByTestId('candidate-shortlist-confirm').click()
    await expect(dialog).toHaveCount(0, { timeout: 30_000 })

    // Result B is still on the board, unaffected by result A's shortlist.
    await expect(cardB).toBeVisible()

    // The Reachout targeted result A's next Job Stage — NOT result B's. This is
    // the definitive proof that per-application Job/Stages resolution worked.
    const admin = shortlistAdminClient()
    await expect
      .poll(
        async () => {
          const { data } = await admin
            .from('sent_reachout_emails')
            .select(
              'id, status, subject, target_stage_id, job_application_id',
            )
            .eq('job_application_id', appA.applicationId)
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
        target_stage_id: ctxA.secondStageId,
      })

    // No stray Reachout leaked onto result B.
    const { data: stray } = await admin
      .from('sent_reachout_emails')
      .select('id')
      .eq('job_application_id', appB.applicationId)
      .limit(1)
      .maybeSingle()
    expect(stray).toBeNull()
  })
})
