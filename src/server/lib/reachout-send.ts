/**
 * Shortlist Reachout send path — ports source `bulk-shortlist-candidates` for
 * one Job Application (also looped by bulk Shortlist #21): personalize,
 * optional Interview Session, Resend (EMAIL_STUB), `sent_reachout_emails`,
 * then advance `current_stage_id`.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  InterviewQuestionJson,
  InterviewSessionContextJson,
  ResumeExtractionJson,
  ScreeningInterviewInformationJson,
} from '#/integrations/supabase/types'
import {
  generatePersonalizedEmail,
  reachoutBodyToHtml,
} from '#/lib/email-template-engine'
import { sendResendEmail } from './email'
import { getRequestOrigin } from './supabase'

export type ShortlistTemplateType = 'interview' | 'final'

export type ShortlistCustomMessage = {
  subject: string
  body: string
}

type ReachoutApplication = {
  id: string
  candidate_id: string
  candidate_name: string | null
  match_score: number | null
  parsed_candidate_data: ResumeExtractionJson | null
  current_stage_id: string | null
  status: string | null
  candidate: { email: string } | null
  job: {
    id: string
    title: string
    location: string | null
    salary_range: string | null
    parsed_job_data: {
      role_readiness_questions?: string[]
    } | null
    screening_interview_information: ScreeningInterviewInformationJson | null
    companies: { id: string; name: string } | null
  } | null
}

function senderLocalPart(companyName: string): string {
  const cleaned = companyName.toLowerCase().replace(/[^a-z0-9]/g, '')
  return cleaned.length > 0 ? cleaned : 'hiring'
}

function buildInterviewQuestions(params: {
  candidateName: string
  roleReadinessQuestions: string[]
  concernQuestions: string[]
  currency: string
  expectedJoiningDate: string
  locationQuestion: string
  shiftStart: string
  shiftEnd: string
}): InterviewQuestionJson[] {
  const questions: InterviewQuestionJson[] = []
  let questionId = 0
  const nextId = () => `q${++questionId}`

  questions.push({
    id: nextId(),
    category: 'question',
    type: 'transcription_only',
    question: `Hi ${params.candidateName}, let's start with a quick introduction from your end. Could you tell me about your academic background, what you're currently working on in your role, and a brief summary of your professional experience?`,
  })

  for (const question of params.roleReadinessQuestions.slice(0, 2)) {
    questions.push({
      id: nextId(),
      category: 'question',
      type: 'ai_conversation',
      question,
      max_follow_ups: 2,
    })
  }

  for (const question of params.concernQuestions.slice(0, 2)) {
    questions.push({
      id: nextId(),
      category: 'question',
      type: 'ai_conversation',
      question,
      max_follow_ups: 2,
    })
  }

  questions.push({
    id: nextId(),
    category: 'question',
    type: 'transcription_only',
    question: 'Why are you looking for a change in employment?',
  })

  questions.push({
    id: nextId(),
    category: 'informative',
    type: 'display_only',
    question:
      'Now we will move on to the manual input section. Please type or select the appropriate answer for each question.',
  })

  questions.push({
    id: nextId(),
    category: 'question',
    type: 'boolean_choice',
    question: 'Do you have any other offers in hand?',
  })

  questions.push({
    id: nextId(),
    category: 'question',
    type: 'manual_input',
    question: `What is your current CTC (in ${params.currency})?`,
    placeholder: params.currency === 'INR' ? 'e.g., 2500000' : 'e.g., 80000',
  })

  questions.push({
    id: nextId(),
    category: 'question',
    type: 'manual_input',
    question: `What are your yearly salary expectations (in ${params.currency})?`,
    placeholder: params.currency === 'INR' ? 'e.g., 2500000' : 'e.g., 80000',
  })

  questions.push({
    id: nextId(),
    category: 'question',
    type: 'boolean_choice',
    question: `The expected joining date is ${params.expectedJoiningDate}. Can you join by this date?`,
  })

  questions.push({
    id: nextId(),
    category: 'question',
    type: 'boolean_choice',
    question: params.locationQuestion,
  })

  questions.push({
    id: nextId(),
    category: 'question',
    type: 'boolean_choice',
    question: `Are you willing to work from ${params.shiftStart} to ${params.shiftEnd}?`,
  })

  questions.push({
    id: nextId(),
    category: 'informative',
    type: 'display_only',
    question:
      'Thank you! The interview is over. We appreciate your time and will get back to you soon with the results.',
  })

  return questions
}

function locationQuestionForMode(
  jobMode: string,
  location: string,
): string {
  if (jobMode === 'Remote (In Country)') {
    return `Are you willing to work remotely at ${location}?`
  }
  if (jobMode === 'Work From Office' || jobMode === 'Work From office') {
    return `Are you willing to work fully from office at ${location}?`
  }
  if (jobMode.includes('Hybrid')) {
    const workArrangement =
      jobMode.replace('Hybrid', '').trim() || 'in a hybrid arrangement'
    return `Are you willing to work ${workArrangement} in a hybrid model at ${location}?`
  }
  return 'Are you willing to work remotely?'
}

async function ensureInterviewSession(params: {
  client: SupabaseClient<Database>
  application: ReachoutApplication
  companyName: string
  siteOrigin: string
}): Promise<string> {
  const { client, application, companyName, siteOrigin } = params
  const job = application.job
  if (!job?.id) {
    throw new Error('Job ID is required for creating interview session')
  }

  const { data: existing } = await client
    .from('interview_sessions')
    .select('token')
    .eq('job_application_id', application.id)
    .maybeSingle()
  if (existing?.token) {
    return `${siteOrigin}/interview/${existing.token}`
  }

  const screeningInfo = job.screening_interview_information ?? null
  const parsedJobData = job.parsed_job_data ?? {}
  const parsedData = application.parsed_candidate_data
  const candidateName =
    application.candidate_name || application.candidate?.email || 'Candidate'

  const roleReadinessQuestions = parsedJobData.role_readiness_questions ?? []
  const concernQuestions = parsedData?.potential_concerns_questions ?? []

  const jobType = screeningInfo?.job_type
  const jobMode = jobType?.mode || 'Remote (Anywhere)'
  const location = jobType?.location || 'our office'
  const shiftTimings = screeningInfo?.shift_timings
  const shiftStart = shiftTimings?.start || '9:00 AM'
  const shiftEnd = shiftTimings?.end || '5:00 PM'
  const expectedJoiningDate =
    screeningInfo?.expected_joining_date || 'to be discussed'

  const salaryRange = job.salary_range || ''
  let currency = 'USD'
  if (salaryRange.startsWith('₹')) currency = 'INR'
  else if (salaryRange.startsWith('$')) currency = 'USD'

  const questions = buildInterviewQuestions({
    candidateName,
    roleReadinessQuestions,
    concernQuestions,
    currency,
    expectedJoiningDate,
    locationQuestion: locationQuestionForMode(jobMode, location),
    shiftStart,
    shiftEnd,
  })

  const interviewContext: InterviewSessionContextJson = {
    candidate_name: candidateName,
    job_title: job.title || 'this position',
    company_name: companyName,
    questions,
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { data: session, error: sessionError } = await client
    .from('interview_sessions')
    .insert({
      job_application_id: application.id,
      candidate_id: application.candidate_id,
      job_id: job.id,
      interview_context: interviewContext,
      current_question_index: 0,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select('token')
    .single()

  if (sessionError) {
    throw new Error(
      `Failed to create interview session: ${sessionError.message}`,
    )
  }

  return `${siteOrigin}/interview/${session.token}`
}

/**
 * Send one Reachout and advance the Job Application. Runs on the user-scoped
 * client (RLS). `sent_reachout_emails` UPDATE is service-role-only, so the row
 * is inserted in its final status after Resend (or stub) succeeds.
 */
export async function sendReachoutAndAdvance(params: {
  client: SupabaseClient<Database>
  userId: string
  userEmail: string | null | undefined
  applicationId: string
  jobId: string
  targetStageId: string
  templateType: ShortlistTemplateType
  customMessage: ShortlistCustomMessage
  origin?: string | null
}): Promise<{ applicationId: string; emailRecordId: string }> {
  const {
    client,
    userId,
    userEmail,
    applicationId,
    jobId,
    targetStageId,
    templateType,
    customMessage,
  } = params

  if (!customMessage.subject.trim() || !customMessage.body.trim()) {
    throw new Error('Reachout subject and body are required')
  }
  if (
    templateType === 'interview' &&
    !customMessage.body.includes('{{interview_link}}')
  ) {
    throw new Error(
      'Interview template must include {{interview_link}} variable',
    )
  }

  const { data: stage, error: stageError } = await client
    .from('job_stages')
    .select('id, job_id')
    .eq('id', targetStageId)
    .maybeSingle()
  if (stageError) {
    throw new Error(`Failed to resolve target stage: ${stageError.message}`)
  }
  if (!stage || stage.job_id !== jobId) {
    throw new Error('Target stage does not belong to this job')
  }

  const { data: application, error: fetchError } = await client
    .from('job_applications')
    .select(
      `id, candidate_id, candidate_name, match_score, parsed_candidate_data,
       current_stage_id, status,
       candidate:candidates(email),
       job:jobs(
         id, title, location, salary_range, parsed_job_data,
         screening_interview_information,
         companies(id, name)
       )`,
    )
    .eq('id', applicationId)
    .eq('job_id', jobId)
    .maybeSingle()

  if (fetchError || !application) {
    throw new Error(
      `Failed to load application: ${fetchError?.message ?? 'not found'}`,
    )
  }

  const app = application as unknown as ReachoutApplication
  if (app.status === 'rejected') {
    throw new Error('Rejected candidates cannot be shortlisted')
  }

  const candidateEmail = app.candidate?.email
  if (!candidateEmail) {
    throw new Error('No candidate email found')
  }

  const companyName = app.job?.companies?.name || 'Company'
  const companyId = app.job?.companies?.id
  const senderEmail = `${senderLocalPart(companyName)}@talsek.com`
  const siteOrigin = params.origin?.trim() || getRequestOrigin()

  let replyToEmail = ''
  if (companyId) {
    const { data: settings } = await client
      .from('company_settings')
      .select('settings')
      .eq('company_id', companyId)
      .maybeSingle()
    const templateKey =
      templateType === 'interview' ? 'interview_template' : 'reachout_template'
    const stored = settings?.settings[templateKey]?.reply_to_email
    replyToEmail = typeof stored === 'string' ? stored : ''
  }
  if (!replyToEmail) {
    replyToEmail = userEmail || ''
  }
  if (!replyToEmail) {
    throw new Error(
      'No reply-to email configured. Save a Reachout Template before shortlisting.',
    )
  }

  let interviewLinkHtml = ''
  if (templateType === 'interview') {
    const interviewUrl = await ensureInterviewSession({
      client,
      application: app,
      companyName,
      siteOrigin,
    })
    interviewLinkHtml = `<a href="${interviewUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4366B0; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">Start Interview</a>`
  }

  const personalized = generatePersonalizedEmail(
    customMessage,
    {
      candidate_name: app.candidate_name,
      candidate_email: candidateEmail,
      match_score: app.match_score,
      parsed_candidate_data: app.parsed_candidate_data,
    },
    {
      title: app.job?.title || 'Position',
      location: app.job?.location ?? null,
      company_name: companyName,
    },
    {
      '{{interview_link}}': interviewLinkHtml,
    },
  )

  const htmlBody = reachoutBodyToHtml(personalized.body)

  let sendResult: { id: string }
  try {
    // Send (or stub) before recording so we never insert a "sent" row that
    // did not leave. Stub mode still writes `sent_reachout_emails` — the
    // Playwright-observable effect under EMAIL_STUB.
    sendResult = await sendResendEmail({
      kind: 'reachout',
      to: candidateEmail,
      from: `${companyName} <${senderEmail}>`,
      replyTo: replyToEmail,
      subject: personalized.subject,
      html: htmlBody,
      headers: {
        'X-Application-ID': applicationId,
      },
    })
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Failed to send Reachout: ${error.message}`
        : 'Failed to send Reachout',
    )
  }

  // Insert final status — UPDATE on this table is service-role-only.
  const { data: emailRecord, error: dbError } = await client
    .from('sent_reachout_emails')
    .insert({
      job_application_id: applicationId,
      sent_by: userId,
      recipient_email: candidateEmail,
      sender_email: senderEmail,
      reply_to_email: replyToEmail,
      subject: personalized.subject,
      target_stage_id: targetStageId,
      status: 'sent',
      sendgrid_message_id: sendResult.id,
      sent_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (dbError) {
    throw new Error(`Failed to record Reachout: ${dbError.message}`)
  }

  const { error: stageUpdateError } = await client
    .from('job_applications')
    .update({ current_stage_id: targetStageId })
    .eq('id', applicationId)
    .eq('job_id', jobId)

  if (stageUpdateError) {
    throw new Error(`Failed to advance stage: ${stageUpdateError.message}`)
  }

  return { applicationId, emailRecordId: emailRecord.id }
}
