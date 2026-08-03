import { test, expect } from '@playwright/test'

/**
 * Job requirements edit round-trip (ticket #23).
 * Creates a Job, opens its detail, edits requirements (exclude / add / remove),
 * saves, and asserts the Job detail reflects the persisted lists after refetch.
 */
const JD_TEXT = [
  '5+ years of React experience.',
  'Strong TypeScript skills.',
  'Production AWS experience.',
  "Bachelor's degree in Computer Science.",
].join('\n')

test('member edits job requirements after creation', async ({ page }) => {
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

  const uniqueTitle = `E2E Req Edit ${Date.now()}`
  await page.getByLabel(/job title/i).fill(uniqueTitle)
  await page.getByTestId('job-description-input').fill(JD_TEXT)

  await dialog.getByRole('button', { name: /parse & review/i }).click()
  await expect(
    dialog.getByRole('heading', { name: /review requirements/i }),
  ).toBeVisible({ timeout: 60_000 })

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

  // Deterministic requirements so the edit assertions are stable regardless of
  // whether the parse used AI or the no-key derivation.
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

  await dialog.getByRole('button', { name: /^create job$/i }).click()
  await expect(dialog).not.toBeVisible()

  const jobCard = page.getByRole('listitem').filter({ hasText: uniqueTitle })
  await expect(jobCard).toBeVisible()
  await jobCard.getByTestId('open-job-details').click()

  const detail = page.getByTestId('job-detail')
  await expect(detail).toBeVisible()
  await expect(detail.getByText(uniqueTitle)).toBeVisible()
  await expect(detail.getByText(/2 included/i).first()).toBeVisible()

  await detail.getByTestId('edit-job-requirements').click()
  await expect(detail.getByTestId('save-job-requirements')).toBeVisible()

  // Exclude preferred_2 via checkbox.
  const preferredPanel = detail.getByTestId('job-requirements-preferred')
  const preferredRows = preferredPanel.locator('[data-testid^="requirement-row-"]')
  await expect(preferredRows).toHaveCount(2)
  const excludeId = await preferredRows
    .nth(1)
    .getAttribute('data-testid')
    .then((id) => id!.replace('requirement-row-', ''))
  await detail.getByTestId(`requirement-include-${excludeId}`).click()

  // Remove the second non-negotiable.
  const nonNegPanel = detail.getByTestId('job-requirements-non-negotiables')
  const nonNegRows = nonNegPanel.locator('[data-testid^="requirement-row-"]')
  await expect(nonNegRows).toHaveCount(2)
  const removeId = await nonNegRows
    .nth(1)
    .getAttribute('data-testid')
    .then((id) => id!.replace('requirement-row-', ''))
  await detail.getByTestId(`requirement-remove-${removeId}`).click()
  await expect(nonNegRows).toHaveCount(1)

  // Add a new preferred requirement.
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

  // Included counts: preferred has A + C (B excluded) → 2; non-negotiable → 1.
  await expect(detail.getByText('2 included')).toBeVisible()
  await expect(detail.getByText('1 included')).toBeVisible()
  await expect(detail.getByText('Preferred C — added after create')).toBeVisible()
  await expect(detail.getByText('Preferred B — will exclude')).toBeVisible()
  await expect(
    detail.getByText('Non-negotiable B — will remove'),
  ).toHaveCount(0)

  // Close, reload, reopen and confirm persistence.
  await page.keyboard.press('Escape')
  await expect(detail).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Jobs' })).toBeVisible()
  const reopenedCard = page
    .getByRole('listitem')
    .filter({ hasText: uniqueTitle })
  await reopenedCard.getByTestId('open-job-details').click()
  const reopened = page.getByTestId('job-detail')
  await expect(reopened).toBeVisible()
  await expect(reopened.getByText('2 included')).toBeVisible()
  await expect(reopened.getByText('1 included')).toBeVisible()
  await expect(
    reopened.getByText('Preferred C — added after create'),
  ).toBeVisible()
})
