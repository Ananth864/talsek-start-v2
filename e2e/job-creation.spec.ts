import { test, expect } from '@playwright/test'

/**
 * Characterisation spec for the Job-creation journey (ticket #5).
 * Same capture-against-source technique as the auth / jobs-list specs: authored
 * to the source app's behaviour, replayed against the new app. Uses E2E_EMAIL /
 * E2E_PASSWORD (a real Member — an admin of its company so the RLS INSERT policy
 * passes, with `canCreateJob` enabled).
 *
 * The AI parse is non-deterministic, so per the testing decisions the spec
 * exercises the FLOW, not model output: with no provider keys configured in
 * `.env.local` the parse server fn returns a deterministic derivation, which
 * makes the parse → review → create path fully reproducible here.
 */
const JD_TEXT = [
  '5+ years of React experience.',
  'Strong TypeScript skills.',
  'Production AWS experience.',
  "Bachelor's degree in Computer Science.",
].join('\n')

test('member creates a job from a pasted job description', async ({ page }) => {
  await page.goto('/signin')
  await page.waitForLoadState('networkidle')

  await page.getByLabel('Email').fill(process.env.E2E_EMAIL!)
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading', { name: 'Jobs' })).toBeVisible()

  // The Create-Job button is gated by canCreateJob (the E2E member has it).
  const createButton = page.getByTestId('create-job-button')
  await expect(createButton).toBeVisible()
  await createButton.click()

  const dialog = page.getByTestId('job-creation-dialog')
  await expect(dialog).toBeVisible()

  // A unique title makes the created Job traceable in the live project.
  const uniqueTitle = `E2E Port Job ${Date.now()}`
  await page.getByLabel(/job title/i).fill(uniqueTitle)
  await page.getByTestId('job-description-input').fill(JD_TEXT)

  // Parse fires on the details → review transition. With provider credentials
  // configured this is a real (non-deterministic) AI call; the spec mandates
  // asserting the FLOW, not the model output, so we confirm the review step is
  // reachable and the parsed requirements are editable — back-filling empties
  // only if a particular run's AI output came back sparse.
  await dialog.getByRole('button', { name: /parse & review/i }).click()
  await expect(
    dialog.getByRole('heading', { name: /review requirements/i }),
  ).toBeVisible({ timeout: 60_000 })

  const preferredFirst = dialog.getByRole('textbox', {
    name: /^preferred requirements 1$/i,
  })
  const nonNegFirst = dialog.getByRole('textbox', {
    name: /^non-negotiables 1$/i,
  })
  if (!(await preferredFirst.inputValue())) {
    await preferredFirst.fill('Parsed preferred requirement')
  }
  if (!(await nonNegFirst.inputValue())) {
    await nonNegFirst.fill('Parsed non-negotiable requirement')
  }

  // Submit creates the Job.
  await dialog.getByRole('button', { name: /^create job$/i }).click()
  await expect(dialog).not.toBeVisible()

  // The created Job appears in the list (['jobs'] invalidation refetch).
  await expect(
    page.getByRole('listitem').filter({ hasText: uniqueTitle }),
  ).toBeVisible()
})

test('job creation is gated by canCreateJob at the button', async ({ page }) => {
  // The E2E member has canCreateJob, so the button is present. This asserts the
  // gating surface exists and is wired to the profile context; the negative
  // case (no button / server FORBIDDEN) requires a second, permission-less
  // member account and is covered by the server-fn check + manual verification.
  await page.goto('/signin')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Email').fill(process.env.E2E_EMAIL!)
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByTestId('create-job-button')).toBeVisible()
})
