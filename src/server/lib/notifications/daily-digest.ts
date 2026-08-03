/**
 * Daily application digest cron (ticket #17).
 * Mirrors source `daily-email-notifications` edge fn: query
 * `application_summary_view` (prefs already filtered), group by Member email,
 * send one HTML digest via Resend.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#/integrations/supabase/types'
import { getAdminClient } from '../supabase'
import { sendDailyDigestEmail } from '../email'
import type { DailyDigestEmailParams } from '../email'

export type DailyDigestSummary = {
  success: true
  message: string
  emails_sent: number
  emails_failed: number
  total_users_with_applications: number
  timestamp: string
}

type DigestUser = DailyDigestEmailParams

function groupSummaryByEmail(
  rows: Database['public']['Views']['application_summary_view']['Row'][],
): Map<string, DigestUser> {
  const byEmail = new Map<string, DigestUser>()

  for (const record of rows) {
    const email = record.client_email?.trim()
    if (!email) continue

    let user = byEmail.get(email)
    if (!user) {
      user = {
        to: email,
        firstName: record.client_first_name ?? '',
        lastName: record.client_last_name ?? '',
        jobs: [],
        totalApplications: 0,
      }
      byEmail.set(email, user)
    }

    user.jobs.push({
      title: record.job_title ?? '',
      excellent_count: record.excellent_count ?? 0,
      good_count: record.good_count ?? 0,
      average_count: record.average_count ?? 0,
      below_average_count: record.below_average_count ?? 0,
      total_applications: record.total_applications ?? 0,
    })
    user.totalApplications += record.total_applications ?? 0
  }

  return byEmail
}

export async function runDailyEmailNotifications(
  admin: SupabaseClient<Database> = getAdminClient(),
): Promise<DailyDigestSummary> {
  const timestamp = new Date().toISOString()

  const { data: summaryData, error: queryError } = await admin
    .from('application_summary_view')
    .select('*')

  if (queryError) {
    throw new Error(`Database query failed: ${queryError.message}`)
  }

  // Runtime may still yield null even when the generated types say otherwise.
  const rows = Array.isArray(summaryData) ? summaryData : []

  if (rows.length === 0) {
    return {
      success: true,
      message: 'No users with new applications found',
      emails_sent: 0,
      emails_failed: 0,
      total_users_with_applications: 0,
      timestamp,
    }
  }

  const byEmail = groupSummaryByEmail(rows)
  let emailsSent = 0
  let emailsFailed = 0

  for (const user of byEmail.values()) {
    try {
      await sendDailyDigestEmail(user)
      emailsSent += 1
      // Source rate-limits Resend at ~100ms between sends.
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (error) {
      console.error('[daily-digest] Failed to send to', user.to, error)
      emailsFailed += 1
    }
  }

  return {
    success: true,
    message: 'Daily email notifications processed',
    emails_sent: emailsSent,
    emails_failed: emailsFailed,
    total_users_with_applications: byEmail.size,
    timestamp,
  }
}
