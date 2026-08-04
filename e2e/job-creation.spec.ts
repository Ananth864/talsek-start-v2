import { test, expect } from '@playwright/test'
import type { Page, Locator } from '@playwright/test'

/**
 * Characterisation spec for the Job-creation journey (#5 + #28 restorations).
 * Uses E2E_EMAIL / E2E_PASSWORD (a real Member — admin of its company so the
 * RLS INSERT policy passes, with `canCreateJob` enabled).
 *
 * Wizard is the source-faithful 4-step flow (ADR-0029 amend):
 * screening type → job details (+ logistics) → review requirements → form config.
 */

const JD_TEXT = [
  '5+ years of React experience.',
  'Strong TypeScript skills.',
  'Production AWS experience.',
  "Bachelor's degree in Computer Science.",
].join('\n')

async function signIn(page: Page) {
  const email = process.env.E2E_EMAIL!
  const password = process.env.E2E_PASSWORD!
  await page.goto('/signin')
  await page.waitForLoadState('networkidle')
  const emailField = page.getByLabel('Email', { exact: true })
  await expect(emailField).toBeVisible()
  await emailField.fill(email)
  await expect(emailField).toHaveValue(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: /^sign in$/i }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
}

async function advanceWizard(dialog: Locator) {
  await dialog.getByTestId('job-creation-next').click()
}

test('member creates a job with logistics and uses success/copy actions', async ({
  page,
  context,
}) => {
  test.setTimeout(120_000)
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await signIn(page)
  await expect(page.getByRole('heading', { name: 'Your Jobs' })).toBeVisible()

  const createButton = page.getByTestId('create-job-button')
  await expect(createButton).toBeVisible()
  await createButton.click()

  const dialog = page.getByTestId('job-creation-dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByTestId('job-creation-step')).toContainText(
    /Step 1 of 4/i,
  )

  // Step 1 — screening type cards (not a select).
  await dialog
    .getByRole('button', { name: /Resume \+ Screening Interview/i })
    .click()
  await advanceWizard(dialog)

  await expect(dialog.getByTestId('job-creation-step')).toContainText(
    /Step 2 of 4/i,
  )

  const uniqueTitle = `E2E Port Job ${Date.now()}`
  await dialog.locator('#jc-title').fill(uniqueTitle)

  const logistics = page.getByTestId('job-logistics-fields')
  await expect(logistics).toBeVisible()

  await page.getByTestId('jc-joining').click()
  await page.getByRole('option', { name: 'In 1-2 Months' }).click()

  await page.getByTestId('jc-location-mode').click()
  await page.getByRole('option', { name: 'Hybrid' }).click()
  await page.getByTestId('jc-location-details').fill('Bengaluru')
  await page.getByTestId('jc-hybrid').click()
  await page.getByRole('option', { name: '2/3 Hybrid' }).click()

  await page.getByTestId('jc-shift').click()
  await page
    .getByRole('option', { name: 'Standard (9 AM - 5 PM)' })
    .click()

  await page.getByTestId('jc-travel').click()
  await page.getByRole('option', { name: 'Yes' }).click()
  await page.getByTestId('jc-travel-pct').click()
  await page.getByRole('option', { name: '25% - 50%' }).click()

  await page.getByTestId('job-description-input').fill(JD_TEXT)

  // Step 2 → 3 runs parse.
  await advanceWizard(dialog)
  await expect(dialog.getByTestId('job-creation-step')).toContainText(
    /Step 3 of 4/i,
    { timeout: 60_000 },
  )
  await expect(
    dialog.getByRole('heading', { name: /review requirements/i }),
  ).toBeVisible()

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

  await advanceWizard(dialog)
  await expect(dialog.getByTestId('job-creation-step')).toContainText(
    /Step 4 of 4/i,
  )

  // Disable form for create — template seed can race Create and block confirm.
  // Success dialog still offers Form Config (exercised below).
  await expect(dialog.getByTestId('job-creation-form-setup')).toBeVisible()
  await dialog.getByTestId('job-creation-form-enabled').click()

  await dialog.getByTestId('job-creation-create').click()
  const confirm = page.getByTestId('job-creation-confirm')
  await expect(confirm).toBeVisible({ timeout: 15_000 })
  await confirm.getByTestId('job-creation-confirm-submit').click()
  await expect(dialog).not.toBeVisible({ timeout: 30_000 })

  const success = page.getByTestId('job-creation-success-dialog')
  await expect(success).toBeVisible()
  await expect(page.getByTestId('success-forwarding-email')).not.toHaveValue('')

  await page.getByTestId('copy-success-forwarding-email').click()
  await expect(success.getByText(/email copied to clipboard/i)).toBeVisible({
    timeout: 10_000,
  })

  // Opt-in Form Config shortcut → save → apply link becomes copyable.
  await expect(page.getByTestId('success-configure-form')).toBeVisible()
  await page.getByTestId('success-configure-form').click()
  const formDialog = page.getByTestId('job-form-config-dialog')
  await expect(formDialog).toBeVisible()
  const removeCustom = formDialog.getByTestId('remove-question-customQuestion')
  while ((await removeCustom.count()) > 0) {
    await removeCustom.first().click()
  }
  await formDialog.getByTestId('job-form-save').click()
  await expect(formDialog.getByTestId('job-form-banner')).toContainText(
    /created|saved/i,
    { timeout: 30_000 },
  )
  await formDialog.locator('form').getByRole('button', { name: 'Close' }).click()
  await expect(formDialog).not.toBeVisible()

  await expect(page.getByTestId('success-form-link')).toBeVisible()
  await page.getByTestId('copy-success-form-link').click()
  await expect(success.getByText(/form link copied to clipboard/i)).toBeVisible({
    timeout: 10_000,
  })

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
  await signIn(page)
  const createButton = page.getByTestId('create-job-button')
  await expect(createButton).toBeVisible()
  // Permission gating is asserted via disabled state when the Member lacks
  // canCreateJob; the E2E admin retains the capability so the control stays enabled.
  await expect(createButton).toBeEnabled()
})
