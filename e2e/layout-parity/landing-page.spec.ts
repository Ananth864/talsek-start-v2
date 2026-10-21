import { test, expect } from '@playwright/test'

const labels = [
  'Post a role',
  'Screen resumes',
  'AI interviews',
  'Review shortlist',
]
for (const viewport of [
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
]) {
  test(`workflow chapters and navigation at ${viewport.width}×${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute(
      'data-landing-scroll',
      '',
    )
    const workflow = page.getByTestId('landing-how-it-works')
    await expect(workflow).toHaveAttribute('data-scroll-pinned', 'true')
    for (const index of [0, 1, 2, 3, 2, 1, 0]) {
      await page
        .locator(`#workflow-step-${index}`)
        .evaluate((el) =>
          el.scrollIntoView({ behavior: 'instant', block: 'start' }),
        )
      await expect(
        workflow.getByRole('button', { name: labels[index], exact: true }),
      ).toHaveAttribute('aria-current', 'step')
      const frame = await page
        .getByTestId('landing-workflow-frame')
        .boundingBox()
      expect(frame!.y).toBeGreaterThanOrEqual(135)
      expect(frame!.y + frame!.height).toBeLessThanOrEqual(viewport.height + 1)
    }
    await workflow.getByRole('button', { name: labels[3], exact: true }).click()
    await expect
      .poll(async () =>
        Math.round((await page.locator('#workflow-step-3').boundingBox())!.y),
      )
      .toBe(136)
    await workflow.getByTestId('how-it-works-book-demo').click()
    await expect(page.getByTestId('cal-booking-dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await page.goto('/#resume-matching')
    await expect
      .poll(
        async () => (await page.locator('#resume-matching').boundingBox())!.y,
      )
      .toBeGreaterThanOrEqual(72)
    await page
      .locator('html')
      .evaluate((el) => el.setAttribute('data-navigation-probe', 'retained'))
    await page
      .getByTestId('landing-hero')
      .getByRole('link', { name: 'View pricing' })
      .click()
    await expect(page).toHaveURL(/\/pricing/)
    await expect(page.locator('html')).toHaveAttribute(
      'data-navigation-probe',
      'retained',
    )
    await expect(page.locator('html')).not.toHaveAttribute(
      'data-landing-scroll',
    )
  })
}

test('all workflow content stays in natural flow on mobile, reduced motion and large text', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const workflow = page.getByTestId('landing-how-it-works')
  await expect(workflow).toHaveAttribute('data-scroll-pinned', 'false')
  await expect(workflow.locator('.workflow-inline-visual')).toHaveCount(4)
  for (const visual of await workflow.locator('.workflow-inline-visual').all())
    await expect(visual).toBeVisible()
  expect(
    await page.locator('body').evaluate((el) => el.scrollWidth),
  ).toBeLessThanOrEqual(390)
  const comparison = page.getByTestId('landing-benchmark')
  await expect(
    comparison.locator('td').filter({ hasText: 'Keyword matching' }),
  ).toBeVisible()
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(workflow).toHaveAttribute('data-scroll-pinned', 'false')
  expect(
    await page
      .locator('html')
      .evaluate((el) => getComputedStyle(el).scrollSnapType),
  ).toBe('none')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.locator('html').evaluate((el) => {
    el.style.fontSize = '24px'
  })
  await expect(workflow).toHaveAttribute('data-scroll-pinned', 'false')
  await expect(
    workflow.locator('.workflow-inline-visual').first(),
  ).toBeVisible()
})

test('dark theme persists, merged FAQ expands and booking stays available', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-marketing-theme', '')
  await page
    .getByRole('button', { name: 'Switch to dark mode', exact: true })
    .click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Switch to light mode', exact: true }),
  ).toBeVisible()
  const faq = page.getByTestId('landing-faqs')
  await expect(
    faq.getByRole('button', { name: 'How quickly can we get started?' }),
  ).toHaveAttribute('aria-expanded', 'true')
  await faq
    .getByRole('button', { name: 'Does Talsek work with all job boards?' })
    .click()
  await expect(faq.getByText(/Any Apply button/)).toBeVisible()
  await page.getByTestId('cta-book-demo').click()
  await expect(page.getByTestId('cal-booking-dialog')).toBeVisible()
})

test('strong wheel input stops at the first real workflow chapter', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  const workflow = page.getByTestId('landing-how-it-works')
  await expect(workflow).toHaveAttribute('data-scroll-pinned', 'true')
  await page.mouse.move(700, 500)
  await page.mouse.wheel(0, 2500)
  await expect
    .poll(async () =>
      Math.round((await page.locator('#workflow-step-0').boundingBox())!.y),
    )
    .toBe(136)
  await expect(
    workflow.getByRole('button', { name: labels[0], exact: true }),
  ).toHaveAttribute('aria-current', 'step')
  await page.mouse.wheel(0, 1500)
  await expect(
    workflow.getByRole('button', { name: labels[1], exact: true }),
  ).toHaveAttribute('aria-current', 'step')
  await expect
    .poll(async () =>
      Math.round((await page.locator('#workflow-step-1').boundingBox())!.y),
    )
    .toBe(136)
  await page.waitForTimeout(200)
  await page.mouse.wheel(0, -1500)
  await expect(
    workflow.getByRole('button', { name: labels[0], exact: true }),
  ).toHaveAttribute('aria-current', 'step')
})
