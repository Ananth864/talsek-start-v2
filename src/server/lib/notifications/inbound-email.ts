/**
 * Inbound candidate email processing (ticket #17).
 * Ports source `email-webhook` (SendGrid Inbound Parse multipart) into a
 * signed API route that inserts a Job Application and awaits the Resume AI
 * pipeline (ADR-0014) — Email Analysis runs when `processing_source=email`
 * and `email_content.email_body` is present.
 */
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#/integrations/supabase/types'
import { processJobApplicationPipeline } from '../ai/process-job-application-pipeline'
import { shouldUseAiPipelineStub } from '../ai/pipeline-stub'

const emailWebhookFieldsSchema = z.object({
  to: z.string().min(1),
  from: z.string().min(1),
  subject: z.string().optional(),
  text: z.string().optional(),
  html: z.string().optional(),
})

export type InboundEmailResult =
  | {
      status: 'success'
      candidateId: string
      applicationId: string
      message: string
    }
  | {
      status: 'duplicate'
      message: string
      existingApplicationId?: string
    }
  | {
      status: 'rejected'
      reason: 'insufficient_credits'
      message: string
    }

type Attachment = {
  filename: string
  content: Uint8Array
}

type EmailContentInfo = {
  emailBody: string | null
  rawHtml: string | null
  rawText: string | null
}

function normalizeWhitespace(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
}

function convertHtmlToPlainText(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')

  const withBreaks = withoutScripts
    .replace(
      /<\s*(br|\/p|\/div|\/li|\/tr|\/table|\/section|\/article|\/header|\/footer|\/h[1-6])\s*>/gi,
      '\n',
    )
    .replace(
      /<\s*(p|div|li|tr|table|section|article|header|footer|h[1-6])[^>]*>/gi,
      '\n',
    )

  return decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, ''))
}

function prepareEmailContent(email: {
  text?: string
  html?: string
}): EmailContentInfo {
  const rawText =
    typeof email.text === 'string' ? normalizeWhitespace(email.text) : null
  const rawHtml =
    typeof email.html === 'string' ? email.html.trim() || null : null

  if (rawText && rawText.length > 0) {
    return { emailBody: rawText, rawHtml, rawText }
  }

  if (rawHtml) {
    const plainText = normalizeWhitespace(convertHtmlToPlainText(rawHtml))
    return {
      emailBody: plainText.length > 0 ? plainText : null,
      rawHtml,
      rawText: null,
    }
  }

  return { emailBody: null, rawHtml, rawText }
}

/** Match `<company>-<code>@jobs.talsek.com` → forwarding_code. */
export function extractJobCode(email: string): string | null {
  const match = email.match(/^([^@]+)-([a-z0-9]+)@jobs\.talsek\.com$/i)
  if (!match) return null
  return match[2]
}

function isResumeFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.pdf')
}

function isUnsupportedResumeFile(filename: string): boolean {
  const lower = filename.toLowerCase()
  return ['.doc', '.docx', '.txt', '.rtf', '.odt', '.pages', '.wps'].some(
    (ext) => lower.endsWith(ext),
  )
}

function extractEmail(from: string): string {
  const match = from.match(/<([^>]+@[^>]+)>/)
  if (!match?.[1]) return from.trim()
  return match[1].trim()
}

function extractName(from: string, body: string): string {
  const nameMatch = from.match(/^([^<]+)/)
  if (nameMatch?.[1]) {
    const name = nameMatch[1].trim()
    if (name && !name.includes('@')) return name
  }

  if (body) {
    const lines = body.split('\n').slice(0, 10)
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.match(/^(dear|hi|hello|hey)/i)) continue
      const words = trimmed.split(/\s+/)
      if (
        words.length >= 2 &&
        words.length <= 4 &&
        !trimmed.includes('@') &&
        !trimmed.includes('http') &&
        /^[A-Za-z\s\-']+$/.test(trimmed)
      ) {
        return trimmed
      }
    }
  }

  return 'Unknown Candidate'
}

export async function parseInboundEmailFormData(formData: FormData): Promise<{
  fields: z.infer<typeof emailWebhookFieldsSchema>
  files: Attachment[]
}> {
  const emailData: Record<string, string> = {}
  const files: Attachment[] = []

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      const buffer = new Uint8Array(await value.arrayBuffer())
      files.push({ filename: value.name, content: buffer })
    } else {
      emailData[key] = String(value)
    }
  }

  const parsed = emailWebhookFieldsSchema.safeParse(emailData)
  if (!parsed.success) {
    throw new Error(
      'Invalid email data format, please check server logs for more details',
    )
  }

  return { fields: parsed.data, files }
}

export async function processInboundEmail(
  admin: SupabaseClient<Database>,
  formData: FormData,
): Promise<InboundEmailResult> {
  const { fields, files } = await parseInboundEmailFormData(formData)
  const emailContentInfo = prepareEmailContent(fields)

  const jobCode = extractJobCode(fields.to)
  if (!jobCode) {
    throw new Error(`Invalid recipient email format: ${fields.to}`)
  }

  const { data: job, error: jobError } = await admin
    .from('jobs')
    .select('*')
    .eq('forwarding_code', jobCode)
    .eq('status', 'active')
    .maybeSingle()

  if (jobError || !job) {
    throw new Error(`Job not found or inactive for code: ${jobCode}`)
  }

  const stub = shouldUseAiPipelineStub()
  if (!stub) {
    const { data: serviceCost, error: costError } = await admin.rpc(
      'get_company_service_cost',
      {
        p_company_id: job.company_id,
        p_service_code: 'resume_screening',
      },
    )
    if (costError) {
      console.warn('[email-webhook] Failed to fetch service cost:', costError)
    }
    const effectiveCost = serviceCost ?? 5

    const { data: creditBalance, error: creditError } = await admin.rpc(
      'get_company_credit_balance',
      { p_company_id: job.company_id },
    )

    if (creditError) {
      console.warn(
        '[email-webhook] Credit balance check failed:',
        creditError.message,
      )
    } else if (
      typeof creditBalance === 'number' &&
      creditBalance < effectiveCost
    ) {
      return {
        status: 'rejected',
        reason: 'insufficient_credits',
        message:
          'Application not processed - company has insufficient credits',
      }
    }
  }

  let resumeFile: Attachment | null = null
  const unsupportedResumeFiles: string[] = []

  for (const file of files) {
    if (isResumeFile(file.filename)) {
      resumeFile = file
      break
    }
    if (isUnsupportedResumeFile(file.filename)) {
      unsupportedResumeFiles.push(file.filename)
    }
  }

  if (!resumeFile) {
    if (unsupportedResumeFiles.length > 0) {
      throw new Error(
        `No PDF resume found. Received unsupported file(s): ${unsupportedResumeFiles.join(', ')}. Only PDF format is supported.`,
      )
    }
    throw new Error(
      `No resume attachment found. Received ${files.length} files: ${files.map((f) => f.filename).join(', ')}. Please attach a PDF resume.`,
    )
  }

  const candidateEmail = extractEmail(fields.from)
  const candidateName = extractName(
    fields.from,
    emailContentInfo.emailBody ?? fields.text ?? '',
  )

  const { data: candidateId, error: candidateError } = await admin.rpc(
    'find_or_create_candidate',
    { candidate_email: candidateEmail },
  )
  if (candidateError || !candidateId) {
    throw new Error(
      `Failed to find/create candidate: ${candidateError?.message ?? 'unknown'}`,
    )
  }

  const storagePath = `${job.company_id}/${job.id}/${candidateId}_${Date.now()}.pdf`
  const { data: uploadData, error: uploadError } = await admin.storage
    .from('resumes')
    .upload(storagePath, resumeFile.content, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Failed to upload resume: ${uploadError.message}`)
  }

  const { data: initialStage, error: stageError } = await admin
    .from('job_stages')
    .select('id')
    .eq('job_id', job.id)
    .order('stage_order', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (stageError || !initialStage) {
    throw new Error(`Failed to find initial stage for job: ${job.id}`)
  }

  const emailContentPayload = emailContentInfo.emailBody
    ? { email_body: emailContentInfo.emailBody }
    : null

  const { data: jobApplication, error: applicationError } = await admin
    .from('job_applications')
    .insert({
      job_id: job.id,
      candidate_id: candidateId,
      candidate_name: candidateName,
      current_stage_id: initialStage.id,
      status: 'pending',
      processing_source: 'email',
      resume_url: uploadData.path,
      ...(emailContentPayload ? { email_content: emailContentPayload } : {}),
    })
    .select('id')
    .single()

  if (applicationError) {
    if (applicationError.code === '23505') {
      const { data: existingApp } = await admin
        .from('job_applications')
        .select('id')
        .eq('candidate_id', candidateId)
        .eq('job_id', job.id)
        .maybeSingle()

      return {
        status: 'duplicate',
        message: 'Application already received',
        existingApplicationId: existingApp?.id,
      }
    }
    throw new Error(
      `Failed to create job application: ${applicationError.message}`,
    )
  }

  await processJobApplicationPipeline(admin, {
    applicationId: jobApplication.id,
  })

  return {
    status: 'success',
    candidateId,
    applicationId: jobApplication.id,
    message: 'Resume received and processed',
  }
}
