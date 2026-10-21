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

    // Clicking across the pinned range must not select intermediate panels.
    await workflow.locator('nav').evaluate((nav) => {
      document.documentElement.dataset.stepTrace = '[]'
      new MutationObserver(() => {
        const current = nav
          .querySelector('[aria-current="step"]')
          ?.textContent.trim()
        const trace = JSON.parse(
          document.documentElement.dataset.stepTrace ?? '[]',
        ) as string[]
        if (current) trace.push(current)
        document.documentElement.dataset.stepTrace = JSON.stringify(trace)
      }).observe(nav, {
        attributes: true,
        subtree: true,
        attributeFilter: ['aria-current'],
      })
    })
    await workflow
      .getByRole('button', { name: 'Post a role', exact: true })
      .click()
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeCloseTo(top, 0)
    await expect(
      workflow.getByRole('button', { name: 'Post a role', exact: true }),
    ).toHaveAttribute('aria-current', 'step')
    await workflow
      .getByRole('button', { name: 'Review shortlist', exact: true })
      .click()
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeCloseTo(top + 3 * (viewport.height - 72), 0)
    const trace = await page.locator('html').getAttribute('data-step-trace')
    expect(trace).not.toContain('Screen resumes')
    expect(trace).not.toContain('AI interviews')

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

test('workflow uses the rem-based header and releases pinning for enlarged text', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-landing-scroll', '')
  const workflow = page.getByTestId('landing-how-it-works')
  const frame = page.getByTestId('landing-workflow-frame')
  await page.locator('html').evaluate((el) => {
    el.style.fontSize = '14px'
  })
  await expect(workflow).toHaveAttribute('data-scroll-pinned', 'true')
  await workflow
    .getByRole('button', { name: 'Review shortlist', exact: true })
    .click()
  await expect
    .poll(async () => Math.round((await frame.boundingBox())?.y ?? 0))
    .toBe(63)
  await expect(
    workflow.getByRole('button', { name: 'Review shortlist', exact: true }),
  ).toHaveAttribute('aria-current', 'step')

  await page.locator('html').evaluate((el) => {
    el.style.fontSize = '24px'
  })
  await expect(workflow).toHaveAttribute('data-scroll-pinned', 'false')
  expect(await frame.evaluate((el) => getComputedStyle(el).position)).toBe(
    'static',
  )
  await workflow
    .getByRole('button', { name: 'Post a role', exact: true })
    .click()
  await expect(workflow.locator('h3')).toHaveText('Post a role in 5 minutes')
  const contentFits = await frame.evaluate((el) => {
    const bounds = el.getBoundingClientRect()
    const content = el.firstElementChild!.getBoundingClientRect()
    return content.top >= bounds.top && content.bottom <= bounds.bottom
  })
  expect(contentFits).toBe(true)
})

test('a strong wheel gesture enters the workflow on its first step', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-landing-scroll', '')
  const workflow = page.getByTestId('landing-how-it-works')
  const entry = await workflow.evaluate(
    (el) => window.scrollY + el.getBoundingClientRect().top - 72,
  )
  await page.mouse.move(700, 500)
  await page.mouse.wheel(0, 2500)
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeCloseTo(entry, 0)
  await expect(
    workflow.getByRole('button', { name: 'Post a role', exact: true }),
  ).toHaveAttribute('aria-current', 'step')
  // The remainder of the same momentum gesture must not skip the opening step.
  await page.mouse.wheel(0, 900)
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeCloseTo(entry, 0)
  await page.waitForTimeout(300)
  await page.mouse.wheel(0, 728)
  await expect(
    workflow.getByRole('button', { name: 'Screen resumes', exact: true }),
  ).toHaveAttribute('aria-current', 'step')
})
