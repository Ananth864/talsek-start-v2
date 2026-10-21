import { test, expect } from '@playwright/test'

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`marketing hero remains usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const hero = page.getByTestId('landing-hero')
    await expect(hero.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(
      hero.getByRole('button', { name: 'Book a demo' }),
    ).toBeInViewport()
    await expect(
      hero.getByRole('link', { name: 'Explore the workflow' }),
    ).toBeVisible()
    await expect(hero.getByText('Sample data', { exact: true })).toBeVisible()
    await expect(
      hero
        .getByRole('list', { name: 'Example candidates ranked by AI match' })
        .getByRole('listitem'),
    ).toHaveCount(3)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width)

    if (width < 1024) {
      await page.getByRole('button', { name: 'Open menu' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.keyboard.press('Escape')
    } else {
      await expect(
        page
          .getByTestId('marketing-header')
          .getByRole('link', { name: 'Sign In' }),
      ).toBeInViewport()
    }

    await hero.getByRole('link', { name: 'Explore the workflow' }).click()
    await expect(page).toHaveURL(/#how-it-works/)
    await expect(
      page.getByRole('heading', { name: 'Hiring That Runs on Autopilot' }),
    ).toBeInViewport()
  })
}
