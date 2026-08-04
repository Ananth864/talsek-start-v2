import { test, expect } from '@playwright/test'
import type { Page, Locator } from '@playwright/test'

/**
 * Job requirements edit round-trip (ticket #23).
 * Creates a Job via the 4-step wizard, opens its detail, edits requirements
 * (exclude / add / remove), saves, and asserts persistence after refetch.
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

test('member edits job requirements after creation', async ({ page }) => {
  test.setTimeout(120_000)
  await signIn(page)
  await expect(page.getByRole('heading', { name: 'Your Jobs' })).toBeVisible()

  const createButton = page.getByTestId('create-job-button')
  await expect(createButton).toBeVisible()
  await createButton.click()

  const dialog = page.getByTestId('job-creation-dialog')
  await expect(dialog).toBeVisible()

  // Resume-only path — no logistics required for this edit journey.
  await dialog
    .getByRole('button', { name: /Resume Screening Only/i })
    .click()
  await advanceWizard(dialog)

  const uniqueTitle = `E2E Req Edit ${Date.now()}`
  await dialog.locator('#jc-title').fill(uniqueTitle)
  await page.getByTestId('job-description-input').fill(JD_TEXT)

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
  const preferredSecond = dialog.getByRole('textbox', {
    name: /^preferred requirements 2$/i,
  })
  const nonNegFirst = dialog.getByRole('textbox', {
    name: /^non-negotiables 1$/i,
  })
  const nonNegSecond = dialog.getByRole('textbox', {
    name: /^non-negotiables 2$/i,
  })

  await preferredFirst.fill('Preferred A — keep included')
  if (await preferredSecond.count()) {
    await preferredSecond.fill('Preferred B — will exclude')
  } else {
    await dialog.getByRole('button', { name: /^add$/i }).first().click()
    await dialog
      .getByRole('textbox', { name: /^preferred requirements 2$/i })
      .fill('Preferred B — will exclude')
  }
  await nonNegFirst.fill('Non-negotiable A — keep')
  if (await nonNegSecond.count()) {
    await nonNegSecond.fill('Non-negotiable B — will remove')
  } else {
    await dialog.getByRole('button', { name: /^add$/i }).nth(1).click()
    await dialog
      .getByRole('textbox', { name: /^non-negotiables 2$/i })
      .fill('Non-negotiable B — will remove')
  }

  await advanceWizard(dialog)
  await expect(dialog.getByTestId('job-creation-step')).toContainText(
    /Step 4 of 4/i,
  )
  await expect(dialog.getByTestId('job-creation-form-setup')).toBeVisible()
  await dialog.getByTestId('job-creation-form-enabled').click()
  await dialog.getByTestId('job-creation-create').click()
  await expect(page.getByTestId('job-creation-confirm')).toBeVisible({
    timeout: 15_000,
  })
  await page.getByTestId('job-creation-confirm-submit').click()
  await expect(dialog).not.toBeVisible({ timeout: 30_000 })

  // Dismiss success dialog if it appears.
  const success = page.getByTestId('job-creation-success-dialog')
  if (await success.isVisible().catch(() => false)) {
    await page.getByTestId('success-dialog-done').click()
    await expect(success).not.toBeVisible()
  }

  const jobCard = page.getByRole('listitem').filter({ hasText: uniqueTitle })
  await expect(jobCard).toBeVisible({ timeout: 15_000 })
  await jobCard.getByTestId('open-job-details').click()

  const detail = page.getByTestId('job-detail')
  await expect(detail).toBeVisible()
  await expect(detail.getByText(uniqueTitle)).toBeVisible()
  await expect(detail.getByText(/2 included/i).first()).toBeVisible()

  await detail.getByTestId('edit-job-requirements').click()
  await expect(detail.getByTestId('save-job-requirements')).toBeVisible()

  const preferredPanel = detail.getByTestId('job-requirements-preferred')
  const preferredRows = preferredPanel.locator('[data-testid^="requirement-row-"]')
  const preferredCount = await preferredRows.count()
  expect(preferredCount).toBeGreaterThanOrEqual(2)
  const excludeId = await preferredRows
    .nth(1)
    .getAttribute('data-testid')
    .then((id) => id!.replace('requirement-row-', ''))
  await detail.getByTestId(`requirement-include-${excludeId}`).click()

  const nonNegPanel = detail.getByTestId('job-requirements-non-negotiables')
  const nonNegRows = nonNegPanel.locator('[data-testid^="requirement-row-"]')
  const nonNegCount = await nonNegRows.count()
  expect(nonNegCount).toBeGreaterThanOrEqual(2)
  const removeId = await nonNegRows
    .nth(1)
    .getAttribute('data-testid')
    .then((id) => id!.replace('requirement-row-', ''))
  await detail.getByTestId(`requirement-remove-${removeId}`).click()
  await expect(nonNegRows).toHaveCount(nonNegCount - 1)

  await detail.getByTestId('requirement-add-preferred').click()
  const newPreferredRow = preferredPanel
    .locator('[data-testid^="requirement-row-"]')
    .last()
  const newPreferredId = await newPreferredRow
    .getAttribute('data-testid')
    .then((id) => id!.replace('requirement-row-', ''))
  await detail
    .getByTestId(`requirement-text-${newPreferredId}`)
    .fill('Preferred C — added after create')

  await detail.getByTestId('save-job-requirements').click()
  await expect(detail.getByTestId('save-job-requirements')).toHaveCount(0)

  // Counts live in DetailRows (not inside the editor panels).
  const includedCounts = detail.getByText(/\d+ included/)
  await expect(includedCounts).toHaveCount(2)
  await expect(includedCounts.nth(0)).toHaveText(`${preferredCount} included`)
  await expect(includedCounts.nth(1)).toHaveText(
    `${nonNegCount - 1} included`,
  )
  await expect(detail.getByText('Preferred C — added after create')).toBeVisible()
  await expect(detail.getByText('Preferred B — will exclude')).toBeVisible()
  await expect(
    detail.getByText('Non-negotiable B — will remove'),
  ).toHaveCount(0)

  await page.keyboard.press('Escape')
  await expect(detail).toHaveCount(0)

  // Persistence check via reload + reopen (details sheet is portal-mounted).
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Your Jobs' })).toBeVisible({
    timeout: 15_000,
  })
  const reopenedCard = page
    .getByRole('listitem')
    .filter({ hasText: uniqueTitle })
  await expect(reopenedCard).toBeVisible({ timeout: 15_000 })
  // detailsJob is resolved from the jobs query — retry until the sheet mounts.
  await expect(async () => {
    await reopenedCard.getByTestId('open-job-details').click()
    await expect(page.getByTestId('job-detail')).toBeVisible({ timeout: 3_000 })
  }).toPass({ timeout: 25_000 })
  const reopened = page.getByTestId('job-detail')
  const reopenedCounts = reopened.getByText(/\d+ included/)
  await expect(reopenedCounts).toHaveCount(2)
  await expect(reopenedCounts.nth(0)).toHaveText(`${preferredCount} included`)
  await expect(reopenedCounts.nth(1)).toHaveText(
    `${nonNegCount - 1} included`,
  )
  await expect(
    reopened.getByText('Preferred C — added after create'),
  ).toBeVisible()
})
