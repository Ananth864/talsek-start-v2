/**
 * Member Profile preferences that are not Notification Preferences.
 * Today: candidate board grid/list view (`profiles.candidate_list_view`).
 */
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth'
import type { Database } from '#/integrations/supabase/types'

export type CandidateListView =
  Database['public']['Enums']['candidate_list_view_type']

export const fetchCandidateListView = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<CandidateListView> => {
    const userId = context.session.user.id
    const { data, error } = await context.supabase
      .from('profiles')
      .select('candidate_list_view')
      .eq('id', userId)
      .single()

    if (error) {
      throw new Error(
        `Failed to load candidate list view preference: ${error.message}`,
      )
    }

    return data.candidate_list_view
  })

const updateSchema = z.object({
  view: z.enum(['list', 'grid']),
})

export const updateCandidateListView = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(updateSchema)
  .handler(async ({ context, data }): Promise<CandidateListView> => {
    const userId = context.session.user.id
    const { data: updated, error } = await context.supabase
      .from('profiles')
      .update({ candidate_list_view: data.view })
      .eq('id', userId)
      .select('candidate_list_view')
      .single()

    if (error) {
      throw new Error(
        `Failed to update candidate list view preference: ${error.message}`,
      )
    }

    return updated.candidate_list_view
  })
