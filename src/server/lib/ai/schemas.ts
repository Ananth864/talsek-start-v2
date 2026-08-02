import { z } from 'zod'

/**
 * AI response schemas ported from the source
 * (`supabase/functions/_shared/schemas/ai-response-schemas.ts`). Only the
 * Jobs-domain schema is ported here; the resume/email/interview schemas land
 * with their owning domains. The Zod schema is the contract passed to the AI
 * SDK's `generateObject`; the stored `ParsedJobDataJson` column type
 * (`src/integrations/supabase/json-types.ts`) is hand-written to the same shape
 * so the types module stays free of a dependency on this server library.
 */

// Job description parsing schema — passed to the AI SDK's `generateObject`. The
// `.describe()` strings are part of the schema sent to the model as guidance.
export const jobParsingSchema = z.object({
  preferred_requirements: z
    .array(z.string())
    .describe(
      'List of preferred requirements extracted from the job description',
    ),
  non_negotiables: z
    .array(z.string())
    .describe(
      'List of non-negotiable requirements extracted from the job description',
    ),
  role_readiness_summary: z
    .string()
    .describe(
      'Detailed summary capturing level-aware responsibility analysis with experience depth framework',
    ),
  role_readiness_questions: z
    .array(z.string())
    .describe(
      'Targeted interview questions to assess candidate readiness for core responsibilities',
    ),
})

export type JobParsingResult = z.infer<typeof jobParsingSchema>
