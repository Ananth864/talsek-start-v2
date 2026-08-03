import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

/**
 * Characterisation for Reachout templates + form customization (#16).
 * Seeds canManageTemplates / canManageForms on the E2E admin, then exercises
 * save paths against real Supabase.
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
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for templates E2E',
    )
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function ensureE2EAdminWithFormPerms(): Promise<{
  companyId: string
  userId: string
}> {
  const admin = adminClient()
  const email = process.env.E2E_EMAIL!
  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, company_id, role, must_change_password, permissions')
    .eq('email', email)
    .maybeSingle()
  if (error || !profile?.company_id) {
    throw new Error(`E2E member profile not found: ${error?.message}`)
  }

  const permissions = {
    canCreateJob: true,
    canSendReachout: true,
    canManageTemplates: true,
    canManageForms: true,
  }

  const { error: updateError } = await admin
    .from('profiles')
    .update({
      role: 'admin',
      must_change_password: false,
      permissions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)
  if (updateError) {
    throw new Error(`Failed to seed E2E permissions: ${updateError.message}`)
  }

  return { companyId: profile.company_id, userId: profile.id }
}

test.describe('reachout templates + form customization', () => {
  test('member can save reachout template and company form template', async ({
    page,
  }) => {
    test.setTimeout(90_000)
    const { companyId } = await ensureE2EAdminWithFormPerms()
    const marker = `E2E-${Date.now()}`

    await signIn(page)

    await page.goto('/reachout-templates')
    await expect(page).toHaveURL(/\/reachout-templates/)
    await expect(
      page.getByRole('heading', { name: 'Reachout Templates' }),
    ).toBeVisible()

    await page.getByRole('tab', { name: /final reachout/i }).click()
    await page.getByTestId('field-subject').fill(`Opportunity ${marker}`)
    await page.getByTestId('field-reply_to_email').fill(process.env.E2E_EMAIL!)
    // Ensure body is non-empty (defaults load from server).
    const body = page.getByTestId('field-body')
    await expect(body).not.toHaveValue('')
    await page.getByTestId('save-template-final').click()
    await expect(page.getByTestId('templates-banner')).toContainText(/saved/i)

    const admin = adminClient()
    const { data: settings } = await admin
      .from('company_settings')
      .select('settings')
      .eq('company_id', companyId)
      .maybeSingle()
    const reachout = (
      settings?.settings as {
        reachout_template?: { subject?: string }
      } | null
    )?.reachout_template
    expect(reachout?.subject).toContain(marker)

    await page.goto('/form-settings')
    await expect(page).toHaveURL(/\/form-settings/)
    await expect(
      page.getByRole('heading', { name: 'Customize Form' }),
    ).toBeVisible()

    const addGithub = page.getByTestId('add-question-github')
    if (await addGithub.isVisible()) {
      await addGithub.click()
    }
    await page.getByTestId('form-settings-save').click()
    await expect(page.getByTestId('form-settings-banner')).toContainText(
      /successfully customized|saved/i,
    )

    const { data: templateId } = await admin.rpc('get_or_create_form_template', {
      target_company_id: companyId,
    })
    const { data: template } = await admin
      .from('form_templates')
      .select('questions')
      .eq('id', templateId)
      .maybeSingle()
    const questions = (template?.questions ?? []) as Array<{
      baseId?: string
      isMandatory?: boolean
    }>
    expect(questions.some((q) => q.baseId === 'name' && q.isMandatory)).toBe(
      true,
    )
  })

  test('member can configure a job form from job detail', async ({ page }) => {
    test.setTimeout(90_000)
    const { companyId } = await ensureE2EAdminWithFormPerms()
    await signIn(page)

    const admin = adminClient()
    const { data: job } = await admin
      .from('jobs')
      .select('id, title')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!job?.id) {
      test.skip(true, 'No job available for form config E2E')
      return
    }

    await page.goto(`/dashboard?jobId=${job.id}`)
    await expect(page.getByTestId('job-detail')).toBeVisible()
    await page.getByTestId('configure-job-form').click()
    await expect(page.getByTestId('job-form-config-dialog')).toBeVisible()

    // Drop any custom questions that lack labels, then ensure a standard
    // additional question is selected.
    const removeCustom = page.getByTestId('remove-question-customQuestion')
    while ((await removeCustom.count()) > 0) {
      await removeCustom.first().click()
    }
    const addSalary = page.getByTestId('add-question-salary')
    if (await addSalary.isVisible()) {
      await addSalary.click()
    }
    await page.getByTestId('job-form-save').click()
    await expect(page.getByTestId('job-form-banner')).toContainText(
      /created|saved/i,
    )

    const { data: config } = await admin
      .from('job_form_configs')
      .select('id, form_url_token, is_enabled, questions')
      .eq('job_id', job.id)
      .maybeSingle()
    expect(config?.id).toBeTruthy()
    expect(config?.form_url_token).toBeTruthy()
    expect(config?.is_enabled).toBe(true)
  })
})
