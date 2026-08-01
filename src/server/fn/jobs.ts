import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '../middleware/auth'

/** Member's company Jobs, scoped by RLS via the user-scoped client. */
export const fetchJobs = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from('jobs')
      .select('id, title, created_at, company_id')
      .order('created_at', { ascending: false })
    if (error) throw new Error(`Failed to load jobs: ${error.message}`)
    return data
  })
