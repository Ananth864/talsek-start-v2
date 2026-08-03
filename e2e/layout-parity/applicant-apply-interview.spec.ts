import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import {
  LAYOUT_PARITY_VIEWPORT,
  ensureApplyFormToken,
  resolveFirstJobId,
  seedPendingInterviewSession,
} from './helpers'

/**
 * Layout-parity: Applicant apply + interview token flows (#42 / ADR-0030).
 * Structure/interaction only — no screenshots, no paint asserts.
 * Source: ../talsek Apply, InterviewPage (+ Welcome/Interview/Completion stages).
 * Behavioural journeys stay in e2e/apply-by-token.spec.ts and
 * e2e/interview-by-token.spec.ts.
 */
test.use({
  viewport: LAYOUT_PARITY_VIEWPORT,
  permissions: ['microphone'],
  launchOptions: {
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
    ],
  },
})

test.describe('Apply-by-token layout parity', () => {
  test('invalid token shows apply-invalid chrome', async ({ page }) => {
    await page.goto(`/apply/${randomUUID()}`)
    await expect(page.getByTestId('apply-invalid')).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByTestId('apply-invalid')).toContainText(
      /Invalid or expired apply link/i,
    )
  })

  test('header, JD expand, form fields, submit, and footer branding', async ({
    page,
  }) => {
    test.setTimeout(90_000)

    const jobId = await resolveFirstJobId(page)
    const { token } = await ensureApplyFormToken(jobId)

    await page.context().clearCookies()
    await page.goto(`/apply/${token}`)
    await expect(page.getByTestId('apply-page')).toBeVisible({
      timeout: 15_000,
    })

    const surface = page.getByTestId('apply-page')
    await expect(surface.locator('h1')).toBeVisible()
    await expect(surface.locator('h2')).toBeVisible()
    await expect(surface.getByText('Open', { exact: true })).toBeVisible()

    const jdToggle = page.getByTestId('apply-job-description-toggle')
    await expect(jdToggle).toBeVisible()
    await expect(jdToggle).toContainText(/Job Description/i)
    await expect(jdToggle).toContainText(/Click to expand/i)
    await expect(page.getByTestId('apply-job-description')).toHaveCount(0)

    await jdToggle.click()
    await expect(page.getByTestId('apply-job-description')).toBeVisible()
    await expect(jdToggle).toContainText(/Click to collapse/i)
    await jdToggle.click()
    await expect(page.getByTestId('apply-job-description')).toHaveCount(0)

    const form = page.getByTestId('apply-form')
    await expect(form).toBeVisible()
    await expect(page.getByTestId('apply-name')).toBeVisible()
    await expect(page.getByTestId('apply-email')).toBeVisible()
    await expect(page.getByTestId('apply-phone')).toBeVisible()
    await expect(page.getByTestId('apply-resume')).toBeVisible()
    await expect(form).toContainText(/PDF only\. Max size: 1024 KB/i)

    const submit = page.getByTestId('apply-submit')
    await expect(submit).toHaveText(/Submit Application/i)
    await expect(submit).toBeDisabled()
    await expect(page.getByTestId('apply-incomplete-hint')).toBeVisible()
    await expect(page.getByTestId('apply-incomplete-hint')).toHaveText(
      /Some fields are entered correctly/i,
    )

    const footer = page.getByTestId('apply-footer-branding')
    await expect(footer).toBeVisible()
    await expect(footer).toContainText(/Made with/i)
    await expect(footer).toContainText(/Talsek/i)
    await expect(footer.locator('img[alt="Talsek Logo"]')).toBeVisible()
  })
})

test.describe('Interview-by-token layout parity', () => {
  test('invalid token shows Interview Link Invalid chrome', async ({ page }) => {
    await page.goto(`/interview/${randomUUID()}`)
    await expect(page.getByTestId('interview-invalid')).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByTestId('interview-invalid')).toContainText(
      /Interview Link Invalid/i,
    )
  })

  test('welcome structure, mic check, begin gate, stage chrome, and completion', async ({
    page,
  }) => {
    test.setTimeout(120_000)

    const jobId = await resolveFirstJobId(page)
    const { token } = await seedPendingInterviewSession(jobId)

    await page.context().clearCookies()
    await page.goto(`/interview/${token}`)
    await expect(page.getByTestId('interview-page')).toBeVisible({
      timeout: 15_000,
    })

    const welcome = page.getByTestId('interview-welcome')
    await expect(welcome).toBeVisible()
    await expect(
      welcome.getByRole('heading', { name: 'Talsek Interview', exact: true }),
    ).toBeVisible()
    await expect(welcome).toContainText(/You've been invited to interview/i)

    const how = page.getByTestId('interview-how-this-works')
    await expect(how).toBeVisible()
    await expect(how).toContainText(/How this works:/i)
    await expect(how).toContainText(/15 minutes/i)

    const mic = page.getByTestId('interview-mic-check')
    await expect(mic).toBeVisible()
    await expect(mic).toContainText(/Microphone Check/i)

    const begin = page.getByTestId('interview-begin')
    await expect(begin).toBeEnabled({ timeout: 15_000 })
    await expect(begin).toHaveText(/Begin Interview/i)

    await begin.click()
    await expect(page.getByTestId('interview-stage')).toBeVisible({
      timeout: 20_000,
    })
    await expect(page.getByTestId('interview-start-error')).toHaveCount(0)

    const stage = page.getByTestId('interview-stage')
    await expect(stage.getByRole('heading', { name: 'Talsek Interview' })).toBeVisible()
    await expect(page.getByTestId('interview-progress-bar')).toBeVisible()
    await expect(page.getByTestId('interview-progress')).toContainText(/^1\/\d+/)
    await expect(page.getByTestId('interview-progress')).toContainText(
      /Question 1 of/i,
    )
    await expect(page.getByTestId('interview-voice')).toBeVisible()
    await expect(page.getByTestId('interview-record')).toBeVisible()
    await expect(page.getByTestId('interview-voice-timer')).toBeVisible()
    await expect(page.getByTestId('interview-typed-answer')).toBeVisible()
    await expect(page.getByTestId('interview-typed-submit')).toHaveText(
      /^Send$/i,
    )

    // Advance through stubbed voice → marker display → boolean → manual → complete
    await page.getByTestId('interview-typed-answer').fill(
      'I am a software engineer with ATS product experience.',
    )
    await page.getByTestId('interview-typed-submit').click()

    await expect(page.getByTestId('interview-history-turn')).toBeVisible({
      timeout: 20_000,
    })
    await expect(page.getByTestId('interview-history-turn')).toContainText(
      /Please introduce yourself briefly/i,
    )
    await expect(page.getByTestId('interview-history-turn')).toContainText(
      /software engineer/i,
    )

    await expect(page.getByTestId('interview-display')).toBeVisible({
      timeout: 20_000,
    })
    await expect(page.getByTestId('interview-display-continue')).toHaveText(
      /^Continue$/i,
    )
    await page.getByTestId('interview-display-continue').click()

    await expect(page.getByTestId('interview-boolean')).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByTestId('interview-boolean-yes')).toHaveText(/Yes/i)
    await expect(page.getByTestId('interview-boolean-no')).toHaveText(/No/i)
    await page.getByTestId('interview-boolean-yes').click()

    await expect(page.getByTestId('interview-manual')).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByTestId('interview-manual-submit')).toHaveText(
      /Submit Answer/i,
    )
    await page.getByTestId('interview-manual-input').fill('30')
    await page.getByTestId('interview-manual-submit').click()

    await expect(page.getByTestId('interview-display')).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByTestId('interview-display-continue')).toHaveText(
      /Complete Interview/i,
    )
    await page.getByTestId('interview-display-continue').click()

    const complete = page.getByTestId('interview-complete')
    await expect(complete).toBeVisible({ timeout: 15_000 })
    await expect(
      complete.getByRole('heading', { name: 'Interview Complete!' }),
    ).toBeVisible()
    await expect(page.getByTestId('interview-next-steps')).toContainText(
      /What happens next\?/i,
    )
    await expect(page.getByTestId('interview-close')).toHaveText(
      /Close Interview/i,
    )
  })
})
