import type { InterviewQuestionJson } from '#/integrations/supabase/json-types'
import type { InterviewSessionRow } from '#/server/fn/candidate-profile'

export type InterviewScoreResult = {
  totalPoints: number
  earnedPoints: number
  scorePercent: number | null
  isComplete: boolean
}

const createEmptyScore = (): InterviewScoreResult => ({
  totalPoints: 0,
  earnedPoints: 0,
  scorePercent: null,
  isComplete: false,
})

const isSalaryExpectationQuestion = (
  question: InterviewQuestionJson,
): boolean =>
  question.type === 'manual_input' &&
  question.question.toLowerCase().includes('salary expectations')

const isRequirementBooleanQuestion = (
  question: InterviewQuestionJson,
): boolean => {
  if (question.type !== 'boolean_choice') {
    return false
  }

  const text = question.question.toLowerCase()

  if (text.includes('can you join by this date')) {
    return true
  }
  if (text.includes('willing to work')) {
    return true
  }
  if (text.includes('are you willing to work from')) {
    return true
  }
  if (text.includes('salary expectation')) {
    return true
  }
  if (text.includes('other offers in hand')) {
    return false
  }

  return false
}

/** Source `computeInterviewScore` — ports verbatim for header badge parity. */
export const computeInterviewScore = (
  session?: InterviewSessionRow | null,
): InterviewScoreResult => {
  if (!session) {
    return createEmptyScore()
  }

  const questions = session.interview_context.questions
  if (questions.length === 0) {
    return createEmptyScore()
  }

  const scoreableQuestions = questions.filter(
    (question) =>
      question.type === 'ai_conversation' ||
      isSalaryExpectationQuestion(question) ||
      isRequirementBooleanQuestion(question),
  )

  const totalPoints = scoreableQuestions.length
  if (totalPoints === 0) {
    return createEmptyScore()
  }

  const completedMap = new Map(
    session.questions_completed.map((completed) => [
      completed.questionId,
      completed,
    ]),
  )

  let earnedPoints = 0
  let answeredCount = 0

  for (const question of scoreableQuestions) {
    const completed = completedMap.get(question.id)
    if (!completed) {
      continue
    }

    answeredCount += 1

    if (question.type === 'ai_conversation') {
      if (completed.satisfactory === true) {
        earnedPoints += 1
      }
      continue
    }

    const answer = completed.mainAnswer.trim().toLowerCase()

    if (isSalaryExpectationQuestion(question) && answer === 'yes') {
      earnedPoints += 1
      continue
    }

    if (isRequirementBooleanQuestion(question) && answer === 'yes') {
      earnedPoints += 1
      continue
    }
  }

  const isComplete = answeredCount === totalPoints

  if (!isComplete) {
    return {
      totalPoints,
      earnedPoints,
      scorePercent: null,
      isComplete,
    }
  }

  const scorePercent = Math.round((earnedPoints / totalPoints) * 100)

  return {
    totalPoints,
    earnedPoints,
    scorePercent,
    isComplete,
  }
}

export const getEmptyInterviewScore = (): InterviewScoreResult =>
  createEmptyScore()
