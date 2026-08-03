import { test, expect } from '@playwright/test'

/**
 * Characterisation spec for the Job-creation journey (#5 + #28 restorations).
 * Uses E2E_EMAIL / E2E_PASSWORD (a real Member — admin of its company so the
 * RLS INSERT policy passes, with `canCreateJob` enabled).
 *
 * Covers logistics fields (resume + interview), the post-create success dialog
 * with copy actions / form-config shortcut, and job-card copy buttons. The AI
 * parse is non-deterministic; with no provider keys the parse server fn returns
 * a deterministic derivation so the flow stays reproducible.
 */
const JD_TEXT = [
  '5+ years of React experience.',
  'Strong TypeScript skills.',
  'Production AWS experience.',
  "Bachelor's degree in Computer Science.",
].join('\n')

test('member creates a job with logistics and uses success/copy actions', async ({
  page,
}) => {
  await page.goto('/signin')
  await page.waitForLoadState('networkidle')

  await page.getByLabel('Email').fill(process.env.E2E_EMAIL!)
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading', { name: 'Jobs' })).toBeVisible()

  const createButton = page.getByTestId('create-job-button')
  await expect(createButton).toBeVisible()
  await createButton.click()

  const dialog = page.getByTestId('job-creation-dialog')
  await expect(dialog).toBeVisible()

  const uniqueTitle = `E2E Port Job ${Date.now()}`
  await page.getByLabel(/job title/i).fill(uniqueTitle)

  // Resume + interview reveals logistics (joining, location, shift, travel).
  await page.getByLabel(/service type/i).click()
  await page.getByRole('option', { name: /resume \+ interview/i }).click()

  const logistics = page.getByTestId('job-logistics-fields')
  await expect(logistics).toBeVisible()

  await page.getByTestId('jc-joining').click()
  await page.getByRole('option', { name: 'In 1-2 Months' }).click()

  await page.getByTestId('jc-locmode').click()
  await page.getByRole('option', { name: 'Hybrid' }).click()
  await page.getByTestId('jc-location-details').fill('Bengaluru')
  await page.getByTestId('jc-hybrid').click()
  await page.getByRole('option', { name: '2/3 Hybrid' }).click()

  await page.getByTestId('jc-shift').click()
  await page.getByRole('option', { name: 'Standard' }).click()

  await page.getByTestId('jc-travel').click()
  await page.getByRole('option', { name: 'Yes' }).click()
  await page.getByTestId('jc-travel-pct').click()
  await page.getByRole('option', { name: '25% - 50%' }).click()

  await page.getByTestId('job-description-input').fill(JD_TEXT)

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

  await dialog.getByRole('button', { name: /^create job$/i }).click()
  await expect(dialog).not.toBeVisible()

  const success = page.getByTestId('job-creation-success-dialog')
  await expect(success).toBeVisible()
  await expect(page.getByTestId('success-forwarding-email')).not.toHaveValue('')

  await page.getByTestId('copy-success-forwarding-email').click()
  await expect(success.getByText(/email copied to clipboard/i)).toBeVisible()

  // Opt-in Form Config shortcut (story 31) → save → apply link becomes copyable.
  await expect(page.getByTestId('success-configure-form')).toBeVisible()
  await page.getByTestId('success-configure-form').click()
  const formDialog = page.getByTestId('job-form-config-dialog')
  await expect(formDialog).toBeVisible()
  // Drop unlabeled custom questions from the company template (same as forms e2e).
  const removeCustom = formDialog.getByTestId('remove-question-customQuestion')
  while ((await removeCustom.count()) > 0) {
    await removeCustom.first().click()
  }
  await formDialog.getByTestId('job-form-save').click()
  await expect(formDialog.getByTestId('job-form-banner')).toContainText(
    /created|saved/i,
    { timeout: 30_000 },
  )
  await formDialog.getByRole('button', { name: /^close$/i }).click()
  await expect(formDialog).not.toBeVisible()

  await expect(page.getByTestId('success-form-link')).toBeVisible()
  await page.getByTestId('copy-success-form-link').click()
  await expect(success.getByText(/form link copied to clipboard/i)).toBeVisible()

  await page.getByTestId('success-dialog-done').click()
  await expect(success).not.toBeVisible()

  const jobCard = page.getByRole('listitem').filter({ hasText: uniqueTitle })
  await expect(jobCard).toBeVisible()
  await expect(jobCard.getByTestId('copy-forwarding-email')).toBeVisible()
  await jobCard.getByTestId('copy-forwarding-email').click()
  await expect(jobCard.getByTestId('copy-apply-link')).toBeVisible()
  await jobCard.getByTestId('copy-apply-link').click()
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
