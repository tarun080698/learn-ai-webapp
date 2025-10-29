/**
 * Grading utilities for questionnaire responses
 * Handles scoring based on correct option IDs
 */

import { QuestionnaireQuestion } from "@/types/models";

export interface GradingResult {
  earned: number;
  total: number;
  percentage: number;
}

export interface QuestionScore {
  questionId: string;
  earned: number;
  total: number;
  correct: boolean;
}

/**
 * Grade a questionnaire response
 */
export function gradeQuestionnaire(
  questions: QuestionnaireQuestion[],
  answers: Array<{ questionId: string; value: string | number | string[] }>,
  isQuiz: boolean = false
): GradingResult & { questionScores: QuestionScore[] } {
  let totalEarned = 0;
  let totalPossible = 0;
  const questionScores: QuestionScore[] = [];

  for (const question of questions) {
    const answer = answers.find((a) => a.questionId === question.id);
    const questionScore = gradeQuestion(question, answer?.value, isQuiz);

    questionScores.push(questionScore);
    totalEarned += questionScore.earned;
    totalPossible += questionScore.total;
  }

  return {
    earned: totalEarned,
    total: totalPossible,
    percentage:
      totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0,
    questionScores,
  };
}

/**
 * Grade a single question
 */
export function gradeQuestion(
  question: QuestionnaireQuestion,
  answer?: string | number | string[],
  isQuiz: boolean = false
): QuestionScore {
  const questionId = question.id;
  const points = question.points || 1;

  // Non-quiz questions always get full points if answered
  if (!isQuiz && !question.correct) {
    return {
      questionId,
      earned: answer !== undefined ? points : 0,
      total: points,
      correct: answer !== undefined,
    };
  }

  // Quiz questions need correct answers
  if (!question.correct || question.correct.length === 0) {
    // No correct answer defined, give full points if answered
    return {
      questionId,
      earned: answer !== undefined ? points : 0,
      total: points,
      correct: answer !== undefined,
    };
  }

  // Grade based on question type
  switch (question.type) {
    case "single": {
      const isCorrect =
        typeof answer === "string" && question.correct.includes(answer);
      return {
        questionId,
        earned: isCorrect ? points : 0,
        total: points,
        correct: isCorrect,
      };
    }

    case "multi": {
      if (!Array.isArray(answer)) {
        return {
          questionId,
          earned: 0,
          total: points,
          correct: false,
        };
      }

      // Check if answer array matches correct array exactly
      const correctSet = new Set(question.correct);
      const answerSet = new Set(answer.map(String));

      const isCorrect =
        correctSet.size === answerSet.size &&
        [...correctSet].every((id) => answerSet.has(id));

      return {
        questionId,
        earned: isCorrect ? points : 0,
        total: points,
        correct: isCorrect,
      };
    }

    case "scale":
    case "text": {
      // For scale and text, check if the answer matches any correct answer
      const answerStr = String(answer);
      const isCorrect = question.correct.some(
        (correct) => correct.toLowerCase() === answerStr.toLowerCase()
      );

      return {
        questionId,
        earned: isCorrect ? points : 0,
        total: points,
        correct: isCorrect,
      };
    }

    default:
      return {
        questionId,
        earned: 0,
        total: points,
        correct: false,
      };
  }
}

/**
 * Validate that answer option IDs exist in the question template
 */
export function validateAnswerOptions(
  question: QuestionnaireQuestion,
  answer: string | number | string[]
): { valid: boolean; error?: string } {
  if (question.type === "text" || question.type === "scale") {
    // Text and scale questions don't use option IDs
    return { valid: true };
  }

  if (!question.options || question.options.length === 0) {
    return { valid: false, error: "Question has no options defined" };
  }

  const validOptionIds = new Set(question.options.map((opt) => opt.id));

  if (question.type === "single") {
    if (typeof answer !== "string") {
      return { valid: false, error: "Single choice answer must be a string" };
    }

    if (!validOptionIds.has(answer)) {
      return { valid: false, error: `Invalid option ID: ${answer}` };
    }

    return { valid: true };
  }

  if (question.type === "multi") {
    if (!Array.isArray(answer)) {
      return { valid: false, error: "Multiple choice answer must be an array" };
    }

    for (const optionId of answer) {
      if (typeof optionId !== "string" || !validOptionIds.has(optionId)) {
        return { valid: false, error: `Invalid option ID: ${optionId}` };
      }
    }

    return { valid: true };
  }

  return { valid: true };
}
