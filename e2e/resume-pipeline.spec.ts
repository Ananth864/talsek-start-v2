import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

/**
 * Characterisation spec for the Resume AI pipeline (ticket #9).
 * Exercises the synchronous Extraction → Match (+ optional Email) chain via
 * the profile dialog's Re-run AI control. Playwright's webServer sets
 * `AI_PIPELINE_STUB=1` so the server writes deterministic shapes without
 * live provider calls (ADR-0014 §5). Seeds a Job Application when the E2E
 * Member's selected Job has none yet — full form/email intake remains #11.
 */

async function signIn(page: Page) {
  await page.goto('/signin')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Email').fill(process.env.E2E_EMAIL!)
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

/** Minimal valid PDF bytes for Storage upload (content unused under stub). */
function minimalPdf(): Uint8Array {
  const text = `%PDF-1.1
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R >>endobj
4 0 obj<< /Length 44 >>stream
BT /F1 12 Tf 100 100 Td (E2E Resume) Tj ET
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
  return new TextEncoder().encode(text)
}

async function ensureSeededApplication(jobId: string): Promise<string> {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required to seed pipeline E2E',
    )
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: existing } = await admin
    .from('job_applications')
    .select('id, resume_url, parsed_candidate_data, ai_analysis')
    .eq('job_id', jobId)
    .eq('status', 'active')
    .not('resume_url', 'is', null)
    .limit(1)
    .maybeSingle()

  if (existing?.id && existing.resume_url) {
    // Prior failed seeds may lack concrete JSON shapes the profile needs.
    if (!existing.parsed_candidate_data || !existing.ai_analysis) {
      await admin
        .from('job_applications')
        .update({
          candidate_name: 'Before Pipeline Seed',
          parsed_candidate_data: {
            name: 'Before Pipeline Seed',
            email: 'e2e.pipeline@example.com',
            phone: 'not mentioned',
            location: 'Remote',
            current_role: 'Engineer',
            total_experience_years: 1,
            work_experience: [],
            education: [],
            technical_skills: [],
            soft_skills: [],
            certifications: [],
            summary: 'Seed row awaiting Resume AI pipeline.',
            potential_concerns: [],
            potential_concerns_questions: [],
            career_level: 'junior',
          },
          ai_analysis: {
            recommendation: 'MODERATE_FIT',
            individual_scores: {
              role_responsibility_readiness_score: 0,
              concerns_mitigation_score: 0,
              prestige_score: 0,
              overall_fit_score: 0,
            },
            rationale: 'Seed placeholder',
            candidate_readiness: 'Seed placeholder',
            strengths_for_role: [],
            potential_concerns: [],
            preferred_requirements_analysis: { details: [] },
            non_negotiables_analysis: { details: [] },
          },
        })
        .eq('id', existing.id)
    }
    return existing.id
  }

  const { data: job, error: jobError } = await admin
    .from('jobs')
    .select('id, company_id')
    .eq('id', jobId)
    .single()
  if (jobError) {
    throw new Error(`Failed to load job for seed: ${jobError.message}`)
  }

  const { data: stage, error: stageError } = await admin
    .from('job_stages')
    .select('id')
    .eq('job_id', jobId)
    .order('stage_order', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (stageError || !stage) {
    throw new Error(
      `Job has no stages to attach an application: ${stageError?.message}`,
    )
  }

  const candidateId = randomUUID()
  const email = `e2e.pipeline.${Date.now()}@example.com`
  const { error: candidateError } = await admin.from('candidates').insert({
    id: candidateId,
    email,
  })
  if (candidateError) {
    throw new Error(`Failed to seed candidate: ${candidateError.message}`)
  }

  const resumePath = `${job.company_id}/${jobId}/${candidateId}_e2e.pdf`
  const { error: uploadError } = await admin.storage
    .from('resumes')
    .upload(resumePath, minimalPdf(), {
      contentType: 'application/pdf',
      upsert: true,
    })
  if (uploadError) {
    throw new Error(`Failed to upload seed resume: ${uploadError.message}`)
  }

  // Minimal concrete shapes so the profile dialog can open before Re-run AI
  // overwrites them with the deterministic stub (ADR-0014 §5).
  const seedParsed = {
    name: 'Before Pipeline Seed',
    email: email,
    phone: 'not mentioned',
    location: 'Remote',
    current_role: 'Engineer',
    total_experience_years: 1,
    work_experience: [],
    education: [],
    technical_skills: [],
    soft_skills: [],
    certifications: [],
    summary: 'Seed row awaiting Resume AI pipeline.',
    potential_concerns: [],
    potential_concerns_questions: [],
    career_level: 'junior' as const,
  }
  const seedAnalysis = {
    recommendation: 'MODERATE_FIT' as const,
    individual_scores: {
      role_responsibility_readiness_score: 0,
      concerns_mitigation_score: 0,
      prestige_score: 0,
      overall_fit_score: 0,
    },
    rationale: 'Seed placeholder',
    candidate_readiness: 'Seed placeholder',
    strengths_for_role: [] as string[],
    potential_concerns: [] as string[],
    preferred_requirements_analysis: { details: [] },
    non_negotiables_analysis: { details: [] },
  }

  const applicationId = randomUUID()
  const { error: appError } = await admin.from('job_applications').insert({
    id: applicationId,
    job_id: jobId,
    candidate_id: candidateId,
    current_stage_id: stage.id,
    resume_url: resumePath,
    candidate_name: 'Before Pipeline Seed',
    status: 'active',
    processing_source: 'form',
    match_score: 0,
    final_score: 0,
    meets_all_non_negotiables: false,
    preferred_requirements_matched: 0,
    parsed_candidate_data: seedParsed,
    ai_analysis: seedAnalysis,
  })
  if (appError) {
    throw new Error(`Failed to seed job application: ${appError.message}`)
  }

  return applicationId
}

test('Re-run AI runs the sync resume pipeline and refreshes the profile', async ({
  page,
}) => {
  // If a prior webServer was reused without AI_PIPELINE_STUB, the live AI
  // path can hang past Playwright defaults — fail fast with a clear signal.
  test.setTimeout(120_000)

  await signIn(page)
  await expect(page.getByRole('heading', { name: 'Jobs' })).toBeVisible()

  const firstJob = page.getByTestId('job-card').first()
  await expect(firstJob).toBeVisible()
  await firstJob.click()
  await expect(page).toHaveURL(/jobId=/)

  const jobId = new URL(page.url()).searchParams.get('jobId')
  expect(jobId).toBeTruthy()

  await ensureSeededApplication(jobId!)

  // Re-select the Job so a just-seeded application appears (Realtime INSERT
  // also works; navigating with jobId is deterministic after seed).
  await page.goto(`/dashboard?jobId=${jobId}`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('candidates-list')).toBeVisible()

  const card = page.getByTestId('candidate-card').first()
  await expect(card).toBeVisible({ timeout: 15_000 })
  await card.getByTestId('candidate-view-profile').click()

  const dialog = page.getByTestId('candidate-profile-dialog')
  await expect(dialog).toBeVisible()

  const rerun = dialog.getByTestId('profile-rerun-ai')
  await expect(rerun).toBeEnabled()
  await rerun.click()

  // Stub path completes in-process; button returns to idle when the mutation
  // settles. Assert the deterministic stub name landed on the profile.
  await expect(rerun).toBeEnabled({ timeout: 60_000 })
  await expect(dialog.getByTestId('profile-rerun-ai-error')).toHaveCount(0)
  await expect(
    dialog.getByRole('heading', { name: /E2E Pipeline Candidate/i }),
  ).toBeVisible({ timeout: 15_000 })
  await expect(dialog.getByTestId('profile-match-score')).not.toHaveText(
    /Match: 0%/,
  )
})
