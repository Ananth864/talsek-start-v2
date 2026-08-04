import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

/**
 * Company collection + dashboard guard (#19).
 * Exercises the company-less Profile path at the existing adminClient + signIn
 * seam (temporarily nulls company_id; does not drive live Google OAuth).
 */

async function signIn(page: Page) {
  await page.goto('/signin')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Email').fill(process.env.E2E_EMAIL!)
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

function adminClient() {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for company-guard E2E',
    )
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

test.describe('dashboard company guard', () => {
  test('company-less member is prompted and can complete company setup', async ({
    page,
  }) => {
    test.setTimeout(90_000)
    const admin = adminClient()
    const email = process.env.E2E_EMAIL!

    const { data: profile, error } = await admin
      .from('profiles')
      .select('id, company_id, role')
      .eq('email', email)
      .maybeSingle()
    if (error || !profile?.company_id) {
      throw new Error(`E2E member profile not found: ${error?.message}`)
    }

    const originalCompanyId = profile.company_id
    const originalRole = profile.role
    let createdCompanyId: string | null = null

    try {
      const { error: clearError } = await admin
        .from('profiles')
        .update({ company_id: null })
        .eq('id', profile.id)
      if (clearError) {
        throw new Error(`Failed to clear company_id: ${clearError.message}`)
      }

      await signIn(page)

      // Guard: company-collection dialog blocks the Jobs dashboard.
      await expect(
        page.getByTestId('company-collection-dialog'),
      ).toBeVisible()
      await expect(
        page.getByRole('heading', { name: /complete your setup/i }),
      ).toBeVisible()
      // Visible Jobs chrome is gated; the page may still mount an sr-only H1.
      await expect(page.getByTestId('jobs-list')).toHaveCount(0)

      const marker = `E2E Guard Co ${Date.now()}`
      await page.getByLabel(/company name/i).fill(marker)
      await page.getByRole('combobox').click()
      await page.getByRole('option', { name: /1-10 employees/i }).click()
      await page
        .getByRole('button', { name: /continue to dashboard/i })
        .click()

      await expect(page.getByTestId('jobs-list')).toBeVisible({
        timeout: 30_000,
      })
      await expect(page.getByRole('heading', { name: 'Your Jobs' })).toBeVisible()
      await expect(
        page.getByTestId('company-collection-dialog'),
      ).not.toBeVisible()

      const { data: updated, error: updatedError } = await admin
        .from('profiles')
        .select('company_id')
        .eq('id', profile.id)
        .maybeSingle()
      if (updatedError || !updated?.company_id) {
        throw new Error(
          `Profile was not attached to a company: ${updatedError?.message}`,
        )
      }
      expect(updated.company_id).not.toBe(originalCompanyId)
      createdCompanyId = updated.company_id

      const { data: company } = await admin
        .from('companies')
        .select('id, name')
        .eq('id', createdCompanyId)
        .maybeSingle()
      expect(company?.name).toBe(marker)

      const { data: settings } = await admin
        .from('company_settings')
        .select('company_id, company_size')
        .eq('company_id', createdCompanyId)
        .maybeSingle()
      expect(settings?.company_size).toBe('1-10')
    } finally {
      await admin
        .from('profiles')
        .update({ company_id: originalCompanyId, role: originalRole })
        .eq('id', profile.id)

      if (createdCompanyId) {
        await admin
          .from('company_settings')
          .delete()
          .eq('company_id', createdCompanyId)
        await admin.from('companies').delete().eq('id', createdCompanyId)
      }
    }
  })
})
