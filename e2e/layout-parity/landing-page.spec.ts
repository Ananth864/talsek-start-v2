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
    comparison.getByText('Keyword matching', { exact: false }),
  ).toBeVisible()
  for (const width of [640, 700, 768]) {
    await page.setViewportSize({ width, height: 900 })
    const fits = await comparison
      .getByRole('definition')
      .evaluateAll((elements) =>
        elements.every((el) => {
          const box = el.getBoundingClientRect()
          const parent = el.parentElement!.getBoundingClientRect()
          return (
            el.scrollWidth <= el.clientWidth + 1 &&
            box.right <= parent.right + 1
          )
        }),
      )
    expect(fits, `comparison metrics fit at ${width}px`).toBe(true)
    expect(
      await page.locator('body').evaluate((el) => el.scrollWidth),
    ).toBeLessThanOrEqual(width)
  }
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

test('workflow preserves native wheel input and continuous scrolling', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  const workflow = page.getByTestId('landing-how-it-works')
  await expect(workflow).toHaveAttribute('data-scroll-pinned', 'true')
  await page
    .locator('#workflow-step-0')
    .evaluate((el) =>
      el.scrollIntoView({ behavior: 'instant', block: 'start' }),
    )
  // Every input must remain available to the browser, including small deltas,
  // momentum and reversals. The page must not consume it or force a chapter.
  const canceled = await page.evaluate(() =>
    [8, 80, 1500, -80, -1500].map((deltaY) => {
      const event = new WheelEvent('wheel', {
        deltaY,
        bubbles: true,
        cancelable: true,
      })
      window.dispatchEvent(event)
      return event.defaultPrevented
    }),
  )
  expect(canceled).toEqual([false, false, false, false, false])
  // Disable CSS snapping only for this motion probe, to measure native distance.
  await page.addStyleTag({
    content: 'html[data-landing-scroll] { scroll-snap-type: none; }',
  })
  const start = await page.evaluate(() => window.scrollY)
  await page.mouse.move(700, 500)
  await page.mouse.wheel(0, 240)
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeCloseTo(start + 240, 0)
  await page.mouse.wheel(0, -120)
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeCloseTo(start + 120, 0)
  await page.mouse.wheel(0, 900)
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeCloseTo(start + 1020, 0)
  await expect(
    workflow.getByRole('button', { name: labels[1], exact: true }),
  ).toHaveAttribute('aria-current', 'step')
})

test('product text overflow keeps a stable natural-flow fallback', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 800 })
  await page.goto('/')
  const workflow = page.getByTestId('landing-how-it-works')
  await expect(workflow).toHaveAttribute('data-scroll-pinned', 'true')
  await page.addStyleTag({
    content:
      '.workflow-product p, .workflow-product span { font-size: 32px !important; line-height: 1.5 !important; }',
  })
  await expect(workflow).toHaveAttribute('data-scroll-pinned', 'false')
  const changes = await workflow.evaluate(async (el) => {
    let count = 0
    const observer = new MutationObserver(() => {
      count += 1
    })
    observer.observe(el, {
      attributes: true,
      attributeFilter: ['data-scroll-pinned'],
    })
    await new Promise((resolve) => setTimeout(resolve, 500))
    observer.disconnect()
    return count
  })
  expect(changes).toBe(0)
  await expect(
    workflow.locator('.workflow-inline-visual').first(),
  ).toBeVisible()
})
