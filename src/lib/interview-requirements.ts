import type { QuestionCompletedJson } from '#/integrations/supabase/json-types'

/**
 * Checks if candidate meets all interview requirements based on
 * boolean_choice / salary answers (source `checkMeetsRequirements`).
 *
 * Requirements (all must be "Yes"):
 * 1. Work location willing
 * 2. Shift timing willing
 * 3. Salary acceptable
 * 4. Joining date acceptable
 */
export function checkMeetsRequirements(
  questionsCompleted: QuestionCompletedJson[],
): boolean {
  if (questionsCompleted.length === 0) {
    return false
  }

  const requirementQuestions = questionsCompleted.filter((q) => {
    const questionText = q.mainQuestion.toLowerCase()

    return (
      questionText.includes('willing to work') ||
      questionText.includes('can you join by this date') ||
      questionText.includes('salary expectations') ||
      questionText.includes('okay with this salary')
    )
  })

  if (requirementQuestions.length < 4) {
    return false
  }

  return requirementQuestions.every((q) => {
    const answer = q.mainAnswer.trim().toLowerCase()
    return answer === 'yes'
  })
}

export function getRequirementsCount(
  questionsCompleted: QuestionCompletedJson[],
): { met: number; total: number } {
  if (questionsCompleted.length === 0) {
    return { met: 0, total: 0 }
  }

  const requirementQuestions = questionsCompleted.filter((q) => {
    const questionText = q.mainQuestion.toLowerCase()

    return (
      questionText.includes('willing to work') ||
      questionText.includes('can you join by this date') ||
      questionText.includes('salary expectations') ||
      questionText.includes('okay with this salary')
    )
  })

  const metCount = requirementQuestions.filter((q) => {
    const answer = q.mainAnswer.trim().toLowerCase()
    return answer === 'yes'
  }).length

  return { met: metCount, total: requirementQuestions.length }
}
