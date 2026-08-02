import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth'
import {
  InsufficientCreditsError,
  processJobApplicationPipeline,
} from '../lib/ai/process-job-application-pipeline'

/**
 * Resume AI pipeline entry (ticket #9). Ports the source's
 * `resume-extraction` → `job-match-analysis` → optional `email-analysis`
 * chain as a single awaited server function (ADR-0003 / ADR-0014): no
 * fire-and-forget. Auth-gated for Members; ownership is proven by an RLS
 * SELECT before the pipeline runs on the same user-scoped client (admin
 * UPDATE RLS — E2E Member is company admin; session-less callers in #10/#11
 * import `processJobApplicationPipeline` with `getAdminClient()` directly).
 */

const processPipelineInputSchema = z.object({
  applicationId: z.string().uuid(),
  skipExtraction: z.boolean().optional(),
})

export type ProcessJobApplicationPipelineFnInput = z.infer<
  typeof processPipelineInputSchema
>

export const processJobApplicationPipelineFn = createServerFn({
  method: 'POST',
})
  .middleware([authMiddleware])
  .validator(processPipelineInputSchema)
  .handler(async ({ data, context }) => {
    // Prove the Member can see this Job Application under RLS before writing.
    const { data: accessible, error: accessError } = await context.supabase
      .from('job_applications')
      .select('id')
      .eq('id', data.applicationId)
      .maybeSingle()

    if (accessError) {
      throw new Error(
        `Failed to authorize Job Application access: ${accessError.message}`,
      )
    }
    if (!accessible) {
      throw new Error('Job Application not found')
    }

    try {
      return await processJobApplicationPipeline(context.supabase, data)
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        throw new Error(
          `${error.message} (required ${error.required}, available ${error.available})`,
        )
      }
      throw error
    }
  })
