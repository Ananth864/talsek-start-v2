import { test, expect } from '@playwright/test'

/**
 * Marketing landing smoke (#31). Playwright suite is paused for the
 * port-completion batch — keep this ready for when E2E is re-enabled.
 */

test('landing renders, nav works, and booking dialog opens', async ({
  page,
}) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  await expect(page.getByTestId('landing-page')).toBeVisible()
  await expect(page.getByTestId('landing-hero')).toBeVisible()
  await expect(page.getByTestId('landing-how-it-works')).toBeVisible()
  await expect(page.getByTestId('landing-differentiators')).toBeVisible()
  await expect(page.getByTestId('landing-testimonials')).toBeVisible()
  await expect(page.getByTestId('landing-faqs')).toBeVisible()
  await expect(page.getByTestId('landing-cta')).toBeVisible()
  await expect(page.getByTestId('marketing-header')).toBeVisible()
  await expect(page.getByTestId('marketing-footer')).toBeVisible()

  const header = page.getByTestId('marketing-header')
  await header.getByRole('link', { name: 'Sign In' }).click()
  await expect(page).toHaveURL(/\/signin/)

  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page
    .getByTestId('marketing-header')
    .getByRole('link', { name: 'Sign Up' })
    .click()
  await expect(page).toHaveURL(/\/signup/)

  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page
    .getByTestId('marketing-header')
    .getByRole('button', { name: 'Products' })
    .click()
  await page.getByRole('link', { name: /Resume Matching/i }).click()
  await expect(page).toHaveURL(/#resume-matching/)

  await page.getByTestId('hero-book-demo').click()
  await expect(page.getByTestId('cal-booking-dialog')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Book a Call' })).toBeVisible()
})
