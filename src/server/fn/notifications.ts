/**
 * Member notification preferences (ticket #17).
 * Single boolean on `profiles.email_notifications_enabled` — respected by
 * `application_summary_view` for the daily digest.
 */
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth'

export type NotificationPreferences = {
  email_notifications_enabled: boolean
}

export const fetchNotificationPreferences = createServerFn({
  method: 'GET',
})
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<NotificationPreferences> => {
    const userId = context.session.user.id
    const { data, error } = await context.supabase
      .from('profiles')
      .select('email_notifications_enabled')
      .eq('id', userId)
      .single()

    if (error) {
      throw new Error(
        `Failed to load notification preferences: ${error.message}`,
      )
    }

    return {
      email_notifications_enabled: Boolean(data.email_notifications_enabled),
    }
  })

const updateSchema = z.object({
  email_notifications_enabled: z.boolean(),
})

export const updateNotificationPreferences = createServerFn({
  method: 'POST',
})
  .middleware([authMiddleware])
  .validator(updateSchema)
  .handler(async ({ context, data }): Promise<NotificationPreferences> => {
    const userId = context.session.user.id
    const { data: updated, error } = await context.supabase
      .from('profiles')
      .update({ email_notifications_enabled: data.email_notifications_enabled })
      .eq('id', userId)
      .select('email_notifications_enabled')
      .single()

    if (error) {
      throw new Error(
        `Failed to update notification preferences: ${error.message}`,
      )
    }

    return {
      email_notifications_enabled: Boolean(
        updated.email_notifications_enabled,
      ),
    }
  })
