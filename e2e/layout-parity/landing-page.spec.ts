import { test, expect } from '@playwright/test'

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
]) {
  test(`landing chapters fit below the header at ${viewport.width}×${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute(
      'data-landing-scroll',
      '',
    )
    await page.evaluate(() => document.fonts.ready)

    const intro = await page.locator('.landing-intro').boundingBox()
    expect(intro?.height).toBeLessThanOrEqual(viewport.height + 1)
    const scenes = page.locator('.landing-scene')
    await expect(scenes).toHaveCount(6)
    for (const scene of await scenes.all()) {
      await scene.scrollIntoViewIfNeeded()
      const box = await scene.boundingBox()
      expect(
        box?.height,
        (await scene.getAttribute('data-testid')) ?? 'workflow',
      ).toBeLessThanOrEqual(viewport.height - 72 + 1)
    }

    const workflow = page.getByTestId('landing-how-it-works')
    const frame = page.getByTestId('landing-workflow-frame')
    const labels = [
      'Post a role',
      'Screen resumes',
      'AI interviews',
      'Review shortlist',
    ]
    const top = await workflow.evaluate(
      (el) => window.scrollY + el.getBoundingClientRect().top - 72,
    )
    // Scrolling alone must visit every subsection, including on the way back up.
    for (const index of [0, 1, 2, 3, 2, 1, 0, 3]) {
      await page.evaluate(
        ({ top: sceneTop, height, index: stepIndex }) =>
          window.scrollTo({
            top: sceneTop + height * stepIndex,
            behavior: 'instant',
          }),
        { top, height: viewport.height - 72, index },
      )
      await expect(
        workflow.getByRole('button', { name: labels[index], exact: true }),
      ).toHaveAttribute('aria-current', 'step')
      await expect(workflow.locator('h3')).toBeVisible()
      await expect(workflow.locator('h3')).toHaveCount(1)
      await expect
        .poll(async () => Math.round((await frame.boundingBox())?.y ?? 0))
        .toBe(72)
      const fits = await frame.evaluate((el) => {
        const bounds = el.getBoundingClientRect()
        const content = el.firstElementChild!.getBoundingClientRect()
        return content.top >= bounds.top && content.bottom <= bounds.bottom
      })
      expect(fits).toBe(true)
    }

    await workflow.getByTestId('how-it-works-book-demo').click()
    await expect(page.getByTestId('cal-booking-dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('cal-booking-dialog')).not.toBeVisible()

    await page.goto('/#resume-matching')
    await expect(page.locator('html')).toHaveAttribute(
      'data-landing-scroll',
      '',
    )
    await expect
      .poll(
        async () => (await page.locator('#resume-matching').boundingBox())?.y,
      )
      .toBeGreaterThanOrEqual(72)
    await page.goto('/pricing')
    await expect(page.locator('html')).not.toHaveAttribute(
      'data-landing-scroll',
    )
  })
}

test('landing keeps natural scrolling on mobile and with reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-landing-scroll', '')
  expect(
    await page
      .locator('html')
      .evaluate((el) => getComputedStyle(el).scrollSnapType),
  ).toBe('none')
  const workflow = page.getByTestId('landing-how-it-works')
  for (const label of [
    'Post a role',
    'Screen resumes',
    'AI interviews',
    'Review shortlist',
  ]) {
    await workflow.getByRole('button', { name: label, exact: true }).click()
    await expect(workflow.locator('h3')).toBeVisible()
    expect(await workflow.evaluate((el) => el.scrollWidth)).toBeLessThanOrEqual(
      390,
    )
  }
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect(
    await page
      .locator('html')
      .evaluate((el) => getComputedStyle(el).scrollSnapType),
  ).toBe('none')
})

test('dark landing keeps readable surfaces and theme choice survives reload', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-marketing-theme', '')
  const toggle = page.getByRole('button', {
    name: 'Switch to dark mode',
    exact: true,
  })
  await toggle.click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Switch to light mode', exact: true }),
  ).toBeVisible()
  const cta = page.getByTestId('landing-cta')
  await cta.scrollIntoViewIfNeeded()
  const colors = await cta.locator('h2').evaluate((el) => {
    const card = el.parentElement!
    return {
      background: getComputedStyle(card).backgroundColor,
      color: getComputedStyle(el).color,
    }
  })
  // The final CTA must stay a dark surface, rather than inverting to a bright white card.
  const channels = colors.background.match(/[\d.]+/g)!.map(Number)
  expect(Math.max(...channels.slice(0, 3))).toBeLessThan(70)
  expect(colors.color).not.toBe(colors.background)
  await page.getByTestId('cta-book-demo').click()
  await expect(page.getByTestId('cal-booking-dialog')).toBeVisible()
})
