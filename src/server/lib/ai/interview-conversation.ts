import type { SupabaseClient } from '@supabase/supabase-js'
import { generateText, tool } from 'ai'
import { createXai } from '@ai-sdk/xai'
import { z } from 'zod'
import type {
  Database,
  InterviewQuestionJson,
  QuestionCompletedJson,
  QuestionFollowUpJson,
} from '#/integrations/supabase/types'
import { serverEnv } from '../env'
import { getInterviewConversationPrompt } from './interview-conversation-prompt'
import {
  shouldUseAiPipelineStub,
  stubInterviewAiDecision,
} from './interview-stub'
import type { InterviewTokenContext } from '../../middleware/candidate-token'

export type InterviewPublicQuestion = {
  id: string
  text: string
  type: InterviewQuestionJson['type']
  category: InterviewQuestionJson['category']
  max_follow_ups?: number
  placeholder?: string
}

export type InterviewConversationResult =
  | {
      success: true
      action: 'next_question'
      nextQuestion: InterviewPublicQuestion
      currentQuestionIndex: number
      totalQuestions: number
    }
  | {
      success: true
      action: 'follow_up'
      followUpQuestion: string
      updatedFollowUps: QuestionFollowUpJson[]
      currentQuestionIndex: number
      totalQuestions: number
    }
  | {
      success: true
      action: 'completed'
      currentQuestionIndex: number
      totalQuestions: number
      message?: string
    }

function toPublicQuestion(
  question: InterviewQuestionJson,
): InterviewPublicQuestion {
  return {
    id: question.id,
    text: question.question,
    type: question.type,
    category: question.category,
    max_follow_ups:
      typeof question.max_follow_ups === 'number'
        ? question.max_follow_ups
        : undefined,
    placeholder:
      typeof question.placeholder === 'string'
        ? question.placeholder
        : undefined,
  }
}

function createInterviewTools(
  currentFollowUpCount: number,
  maxFollowUps: number,
) {
  return {
    recordFollowUp: tool({
      description: `Ask a concise clarifying follow-up question pertaining to what the candidate did not answer or answer in a way that is not clear with respect to the question. You have ${maxFollowUps - currentFollowUpCount} follow-ups remaining and use it only if necessary.`,
      inputSchema: z.object({
        followUpQuestion: z
          .string()
          .describe('The follow-up question to ask'),
        reasoning: z
          .string()
          .describe('Why this follow-up is needed (concise and clear)'),
      }),
      execute: ({ followUpQuestion, reasoning }) => ({
        followUpQuestion,
        reasoning,
      }),
    }),
    moveToNextQuestion: tool({
      description:
        "Summarize the candidate's answers and finalize your assessment concisely and move to the next question. Use this when the answer is decently sufficient OR when max follow-ups are reached. Also decide if the overall answer (including follow-ups) is satisfactory (good enough, not necessarily perfect).",
      inputSchema: z.object({
        assessment: z
          .string()
          .describe(
            "The summary of the candidate's answers and the final evaluation concisely and clearly",
          ),
        satisfactory: z
          .boolean()
          .describe(
            'true if, considering the full conversation (initial answer + all follow-ups), the candidate has answered the question satisfactorily (good enough, not necessarily perfect); false otherwise',
          ),
      }),
      execute: ({ assessment, satisfactory }) => ({
        assessment,
        satisfactory,
      }),
    }),
  }
}

async function updateSessionAndMoveNext(
  admin: SupabaseClient<Database>,
  session: InterviewTokenContext,
  completedQuestion: QuestionCompletedJson | null,
  questions: InterviewQuestionJson[],
  clearFollowUps = false,
): Promise<InterviewConversationResult> {
  const nextIndex = session.currentQuestionIndex + 1
  const isLastQuestion = nextIndex >= questions.length

  const updateData: Database['public']['Tables']['interview_sessions']['Update'] =
    {
      questions_completed: completedQuestion
        ? [...session.questionsCompleted, completedQuestion]
        : session.questionsCompleted,
      current_question_index: nextIndex,
      updated_at: new Date().toISOString(),
    }

  if (clearFollowUps) {
    updateData.current_question_follow_ups = []
  }

  if (isLastQuestion) {
    updateData.status = 'completed'
    updateData.completed_at = new Date().toISOString()
  }

  const { error } = await admin
    .from('interview_sessions')
    .update(updateData)
    .eq('id', session.id)

  if (error) {
    throw new Error('Failed to update interview session')
  }

  if (isLastQuestion) {
    return {
      success: true,
      action: 'completed',
      currentQuestionIndex: nextIndex - 1,
      totalQuestions: questions.length,
      message: 'Interview completed successfully',
    }
  }

  if (nextIndex >= questions.length) {
    throw new Error('Next interview question not found')
  }
  const nextQuestion = questions[nextIndex]
  return {
    success: true,
    action: 'next_question',
    nextQuestion: toPublicQuestion(nextQuestion),
    currentQuestionIndex: nextIndex,
    totalQuestions: questions.length,
  }
}

async function handleTranscriptionOnly(
  admin: SupabaseClient<Database>,
  session: InterviewTokenContext,
  currentQuestion: InterviewQuestionJson,
  response: string,
  questions: InterviewQuestionJson[],
): Promise<InterviewConversationResult> {
  const completedQuestion: QuestionCompletedJson = {
    questionId: currentQuestion.id,
    category: currentQuestion.category,
    mainQuestion: currentQuestion.question,
    mainAnswer: response,
    followUps: [],
    ai_assessment: null,
    timestamp: new Date().toISOString(),
  }
  return updateSessionAndMoveNext(
    admin,
    session,
    completedQuestion,
    questions,
  )
}

async function handleManualInput(
  admin: SupabaseClient<Database>,
  session: InterviewTokenContext,
  currentQuestion: InterviewQuestionJson,
  response: string,
  questions: InterviewQuestionJson[],
): Promise<InterviewConversationResult> {
  const numericValue = response.trim()
  if (!numericValue || Number.isNaN(Number(numericValue))) {
    throw new Error('Invalid numeric input')
  }

  const isSalaryExpectations = currentQuestion.question
    .toLowerCase()
    .includes('salary expectations')

  let finalAnswer = numericValue
  let assessment: string | null = null

  if (isSalaryExpectations && session.salaryRange) {
    const offeredSalaryStr = session.salaryRange.replace(/[₹$,]/g, '')
    const offeredSalary = parseFloat(offeredSalaryStr)
    const expectation = parseFloat(numericValue)

    if (!Number.isNaN(offeredSalary) && !Number.isNaN(expectation)) {
      const isAcceptable = expectation <= offeredSalary
      finalAnswer = isAcceptable ? 'Yes' : 'No'
      const comparisonSummary = `Candidate expects ${numericValue}, yearly CTC is ${offeredSalaryStr}.`
      assessment = isAcceptable
        ? `Salary expectation is acceptable. ${comparisonSummary} Expectation meets or is below offer.`
        : `Salary expectation exceeds the yearly CTC entered for this job. ${comparisonSummary} Expectation exceeds offer.`
    }
  }

  const completedQuestion: QuestionCompletedJson = {
    questionId: currentQuestion.id,
    category: currentQuestion.category,
    mainQuestion: currentQuestion.question,
    mainAnswer: finalAnswer,
    followUps: [],
    ai_assessment: assessment,
    timestamp: new Date().toISOString(),
  }

  return updateSessionAndMoveNext(
    admin,
    session,
    completedQuestion,
    questions,
  )
}

async function handleBooleanChoice(
  admin: SupabaseClient<Database>,
  session: InterviewTokenContext,
  currentQuestion: InterviewQuestionJson,
  response: string,
  questions: InterviewQuestionJson[],
): Promise<InterviewConversationResult> {
  const normalizedResponse = response.trim()
  if (normalizedResponse !== 'Yes' && normalizedResponse !== 'No') {
    throw new Error('Invalid boolean response. Expected "Yes" or "No".')
  }

  const completedQuestion: QuestionCompletedJson = {
    questionId: currentQuestion.id,
    category: currentQuestion.category,
    mainQuestion: currentQuestion.question,
    mainAnswer: normalizedResponse,
    followUps: [],
    ai_assessment: null,
    timestamp: new Date().toISOString(),
  }

  return updateSessionAndMoveNext(
    admin,
    session,
    completedQuestion,
    questions,
  )
}

async function handleDisplayOnly(
  admin: SupabaseClient<Database>,
  session: InterviewTokenContext,
  currentQuestion: InterviewQuestionJson,
  questions: InterviewQuestionJson[],
): Promise<InterviewConversationResult> {
  const isTransitionMessage = currentQuestion.question
    .toLowerCase()
    .includes('manual input section')

  const completedQuestion: QuestionCompletedJson | null = isTransitionMessage
    ? null
    : {
        questionId: currentQuestion.id,
        category: currentQuestion.category,
        mainQuestion: currentQuestion.question,
        mainAnswer: '',
        followUps: [],
        ai_assessment: null,
        timestamp: new Date().toISOString(),
      }

  const isLastQuestion =
    session.currentQuestionIndex === questions.length - 1

  if (isLastQuestion) {
    const { error } = await admin
      .from('interview_sessions')
      .update({
        questions_completed: completedQuestion
          ? [...session.questionsCompleted, completedQuestion]
          : session.questionsCompleted,
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.id)

    if (error) {
      throw new Error('Failed to complete interview')
    }

    return {
      success: true,
      action: 'completed',
      currentQuestionIndex: session.currentQuestionIndex,
      totalQuestions: questions.length,
      message: 'Interview completed successfully',
    }
  }

  return updateSessionAndMoveNext(
    admin,
    session,
    completedQuestion,
    questions,
  )
}

async function handleAiConversation(
  admin: SupabaseClient<Database>,
  session: InterviewTokenContext,
  currentQuestion: InterviewQuestionJson,
  response: string,
  questions: InterviewQuestionJson[],
): Promise<InterviewConversationResult> {
  const currentFollowUps = session.currentQuestionFollowUps
  const maxFollowUps = currentQuestion.max_follow_ups ?? 2

  let conversationHistory = `Question: ${currentQuestion.question}\n\n`
  if (currentFollowUps.length === 0) {
    conversationHistory += `Candidate's initial answer: ${response}\n`
  } else {
    conversationHistory += `Candidate's initial answer: ${currentFollowUps[0]?.initialAnswer || response}\n\n`
    currentFollowUps.forEach((followUp, index) => {
      conversationHistory += `Follow-up ${index + 1}: ${followUp.question}\n`
      conversationHistory += `Candidate's answer: ${followUp.answer}\n\n`
    })
    conversationHistory += `Latest follow-up answer: ${response}\n`
  }

  type ToolDecision =
    | { toolName: 'recordFollowUp'; followUpQuestion: string; reasoning: string }
    | {
        toolName: 'moveToNextQuestion'
        assessment: string
        satisfactory: boolean
      }

  let decision: ToolDecision

  if (shouldUseAiPipelineStub()) {
    const stub = stubInterviewAiDecision({
      currentFollowUpCount: currentFollowUps.length,
      maxFollowUps,
      response,
    })
    decision =
      stub.tool === 'recordFollowUp'
        ? {
            toolName: 'recordFollowUp',
            followUpQuestion: stub.followUpQuestion,
            reasoning: stub.reasoning,
          }
        : {
            toolName: 'moveToNextQuestion',
            assessment: stub.assessment,
            satisfactory: stub.satisfactory,
          }
  } else {
    if (!serverEnv.GROK_API_KEY) {
      throw new Error('GROK_API_KEY is not configured')
    }

    const systemPrompt = getInterviewConversationPrompt(
      conversationHistory,
      currentFollowUps.length,
      maxFollowUps,
    )
    const xai = createXai({ apiKey: serverEnv.GROK_API_KEY })

    try {
      const aiResult = await generateText({
        model: xai('grok-4-fast-non-reasoning'),
        system: systemPrompt,
        prompt:
          'Based on the conversation history above, decide your next action.',
        tools: createInterviewTools(currentFollowUps.length, maxFollowUps),
        temperature: 0.1,
        maxRetries: 2,
      })

      if (aiResult.toolCalls.length === 0) {
        throw new Error('AI did not make any tool calls')
      }
      const toolCall = aiResult.toolCalls[0]

      if (toolCall.toolName === 'recordFollowUp') {
        const input = toolCall.input as {
          followUpQuestion: string
          reasoning: string
        }
        decision = {
          toolName: 'recordFollowUp',
          followUpQuestion: input.followUpQuestion,
          reasoning: input.reasoning,
        }
      } else if (toolCall.toolName === 'moveToNextQuestion') {
        const input = toolCall.input as {
          assessment: string
          satisfactory: boolean
        }
        decision = {
          toolName: 'moveToNextQuestion',
          assessment: input.assessment,
          satisfactory: input.satisfactory,
        }
      } else {
        throw new Error(`Unknown tool call: ${toolCall.toolName}`)
      }
    } catch (aiError) {
      console.error(
        '[interview-conversation] AI failed; advancing with error assessment',
        aiError,
      )
      const completedQuestion: QuestionCompletedJson = {
        questionId: currentQuestion.id,
        category: currentQuestion.category,
        mainQuestion: currentQuestion.question,
        mainAnswer: response,
        followUps: currentFollowUps,
        ai_assessment:
          'AI assessment unavailable due to processing error. System error - transcription saved.',
        timestamp: new Date().toISOString(),
      }
      return updateSessionAndMoveNext(
        admin,
        session,
        completedQuestion,
        questions,
        true,
      )
    }
  }

  if (decision.toolName === 'recordFollowUp') {
    let updatedFollowUps = [...currentFollowUps]
    if (updatedFollowUps.length > 0) {
      updatedFollowUps[updatedFollowUps.length - 1] = {
        ...updatedFollowUps[updatedFollowUps.length - 1],
        answer: response,
      }
    }

    const newFollowUp: QuestionFollowUpJson = {
      question: decision.followUpQuestion,
      answer: '',
      reasoning: decision.reasoning,
      timestamp: new Date().toISOString(),
      initialAnswer: currentFollowUps.length === 0 ? response : undefined,
    }
    updatedFollowUps = [...updatedFollowUps, newFollowUp]

    const { error } = await admin
      .from('interview_sessions')
      .update({
        current_question_follow_ups: updatedFollowUps,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.id)

    if (error) {
      throw new Error('Failed to store follow-up question')
    }

    return {
      success: true,
      action: 'follow_up',
      followUpQuestion: decision.followUpQuestion,
      updatedFollowUps,
      currentQuestionIndex: session.currentQuestionIndex,
      totalQuestions: questions.length,
    }
  }

  const finalFollowUps: QuestionFollowUpJson[] = [...currentFollowUps]
  if (finalFollowUps.length > 0) {
    finalFollowUps[finalFollowUps.length - 1] = {
      ...finalFollowUps[finalFollowUps.length - 1],
      answer: response,
    }
  }

  const completedQuestion: QuestionCompletedJson = {
    questionId: currentQuestion.id,
    category: currentQuestion.category,
    mainQuestion: currentQuestion.question,
    mainAnswer:
      finalFollowUps.length === 0
        ? response
        : finalFollowUps[0]?.initialAnswer || response,
    followUps: finalFollowUps,
    ai_assessment: decision.assessment,
    satisfactory: decision.satisfactory,
    timestamp: new Date().toISOString(),
  }

  return updateSessionAndMoveNext(
    admin,
    session,
    completedQuestion,
    questions,
    true,
  )
}

export async function processInterviewResponse(
  admin: SupabaseClient<Database>,
  session: InterviewTokenContext,
  questionId: string,
  response: string,
): Promise<InterviewConversationResult> {
  const questions = session.interviewContext.questions
  if (
    session.currentQuestionIndex < 0 ||
    session.currentQuestionIndex >= questions.length
  ) {
    throw new Error('Interview question not found')
  }
  const currentQuestion = questions[session.currentQuestionIndex]

  if (currentQuestion.id !== questionId) {
    throw new Error('Question ID does not match current question')
  }

  switch (currentQuestion.type) {
    case 'transcription_only':
      return handleTranscriptionOnly(
        admin,
        session,
        currentQuestion,
        response,
        questions,
      )
    case 'manual_input':
      return handleManualInput(
        admin,
        session,
        currentQuestion,
        response,
        questions,
      )
    case 'boolean_choice':
      return handleBooleanChoice(
        admin,
        session,
        currentQuestion,
        response,
        questions,
      )
    case 'display_only':
      return handleDisplayOnly(admin, session, currentQuestion, questions)
    case 'ai_conversation':
      return handleAiConversation(
        admin,
        session,
        currentQuestion,
        response,
        questions,
      )
    default:
      throw new Error(
        `Unsupported question type: ${(currentQuestion).type}`,
      )
  }
}

export { toPublicQuestion }
