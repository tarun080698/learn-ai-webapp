/**
 * POST /api/questionnaires/submit
 *
 * User submits questionnaire responses. Validates answers, scores quizzes, and updates gating flags.
 *
 * curl -X POST http://localhost:3000/api/questionnaires/submit \
 *   -H "Authorization: Bearer $USER_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "assignmentId": "assignment_id_here",
 *     "answers": [
 *       {"questionId": "q1", "value": "option1"},
 *       {"questionId": "q2", "values": ["option1", "option2"]}
 *     ]
 *   }'
 */
import { NextRequest, NextResponse } from "next/server";
import {
  getUserFromRequest,
  assertUserProviderGoogle,
  jsonError,
} from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { COL, getAssignmentWithTemplate, responseId } from "@/lib/firestore";
import { gradeQuestionnaire, validateAnswerOptions } from "@/lib/grading";
import { zSubmit } from "@/lib/schemas";
import { withIdempotency } from "@/lib/idempotency";
import type {
  QuestionnaireDoc,
  QuestionnaireAssignmentDoc,
  QuestionnaireQuestion,
} from "@/types/models";

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const validated = zSubmit.parse(body);

    // Require user authentication (Google provider)
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    try {
      assertUserProviderGoogle(user);
    } catch {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (!adminDb) {
      throw new Error("Firebase Admin not initialized");
    }

    // Get idempotency key from header
    const idempotencyKey = req.headers.get("x-idempotency-key") || undefined;

    // Wrap submission logic with idempotency
    const result = await withIdempotency(
      adminDb,
      idempotencyKey,
      { kind: "response", uid: user.uid, assignmentId: validated.assignmentId },
      async () => {
        // Load assignment and template (by assignment.questionnaireVersion)
        const { assignment, questionnaire } = await getAssignmentWithTemplate(
          adminDb!,
          validated.assignmentId
        );

        // Type cast the data since firestore returns generic object
        const assignmentData = assignment as QuestionnaireAssignmentDoc & {
          id: string;
        };
        const questionnaireData = questionnaire as QuestionnaireDoc & {
          id: string;
        };

        // Validate required answers
        const questionMap = new Map<string, QuestionnaireQuestion>();
        questionnaireData.questions.forEach((q) => {
          questionMap.set(q.id, q);
        });

        const answerMap = new Map<
          string,
          string | number | string[] | number[]
        >();
        validated.answers.forEach((answer) => {
          const finalValue = answer.value;
          if (finalValue !== undefined) {
            // Type cast since zod validation ensures correct types
            answerMap.set(
              answer.questionId,
              finalValue as string | number | string[] | number[]
            );
          }
        });

        // Convert answerMap to format for validation
        const answersForValidation: Record<string, string | string[]> = {};
        answerMap.forEach((value, key) => {
          if (Array.isArray(value)) {
            answersForValidation[key] = value.map(String);
          } else {
            answersForValidation[key] = String(value);
          }
        });

        // Validate answer options using grading utility
        for (const question of questionnaireData.questions) {
          const answer = answersForValidation[question.id];
          if (answer !== undefined) {
            const validation = validateAnswerOptions(question, answer);
            if (!validation.valid) {
              return NextResponse.json(
                {
                  error:
                    validation.error ||
                    `Invalid answer for question ${question.id}`,
                },
                { status: 422 }
              );
            }
          }
        }

        // Check required questions
        for (const question of questionnaireData.questions) {
          if (question.required && !answerMap.has(question.id)) {
            return NextResponse.json(
              { error: `Required question ${question.id} not answered` },
              { status: 422 }
            );
          }

          const userAnswer = answerMap.get(question.id);

          // Validate answer format
          if (userAnswer !== undefined) {
            if (question.type === "single" && question.options) {
              if (
                typeof userAnswer !== "string" ||
                !question.options.find((opt) => opt.id === userAnswer)
              ) {
                return NextResponse.json(
                  {
                    error: `Invalid answer for single choice question ${question.id}`,
                  },
                  { status: 422 }
                );
              }
            } else if (question.type === "multi" && question.options) {
              if (
                !Array.isArray(userAnswer) ||
                !userAnswer.every((val) =>
                  question.options?.find((opt) => opt.id === val)
                )
              ) {
                return NextResponse.json(
                  {
                    error: `Invalid answer for multiple choice question ${question.id}`,
                  },
                  { status: 422 }
                );
              }
            } else if (question.type === "scale" && question.scale) {
              if (
                typeof userAnswer !== "number" ||
                userAnswer < question.scale.min ||
                userAnswer > question.scale.max
              ) {
                return NextResponse.json(
                  { error: `Invalid answer for scale question ${question.id}` },
                  { status: 422 }
                );
              }
            } else if (question.type === "text") {
              if (
                question.required &&
                (typeof userAnswer !== "string" || userAnswer.trim() === "")
              ) {
                return NextResponse.json(
                  { error: `Text answer required for question ${question.id}` },
                  { status: 422 }
                );
              }
            }
          }
        }

        // Convert answers to grading format
        const answers = validated.answers
          .filter((a) => a.value !== undefined)
          .map((a) => ({
            questionId: a.questionId,
            value: a.value as string | number | string[],
          }));

        const score = gradeQuestionnaire(questionnaireData.questions, answers);

        const now = new Date();
        const resId = responseId(user.uid, validated.assignmentId);

        // Upsert response document
        const responseData = {
          uid: user.uid,
          assignmentId: validated.assignmentId,
          questionnaireId: assignmentData.questionnaireId,
          scope: assignmentData.scope,
          answers,
          isComplete: true,
          submittedAt: now,
          updatedAt: now,
          ...(score.total > 0 ? { score } : {}),
        };

        await adminDb
          .collection(COL.responses)
          .doc(resId)
          .set(
            {
              ...responseData,
              createdAt: now,
            },
            { merge: true }
          );

        // Update gating flags based on scope and timing
        if (
          assignmentData.scope.type === "course" &&
          assignmentData.timing === "pre"
        ) {
          // Set preCourseComplete=true
          const enrollmentId = `${user.uid}_${assignmentData.scope.courseId}`;
          await adminDb.collection(COL.enrollments).doc(enrollmentId).set(
            {
              preCourseComplete: true,
            },
            { merge: true }
          );
        } else if (
          assignmentData.scope.type === "course" &&
          assignmentData.timing === "post"
        ) {
          // Set postCourseComplete=true, check if all modules completed
          const enrollmentId = `${user.uid}_${assignmentData.scope.courseId}`;
          const enrollmentDoc = await adminDb
            .collection(COL.enrollments)
            .doc(enrollmentId)
            .get();
          const enrollment = enrollmentDoc.data();

          const updateData: {
            postCourseComplete: boolean;
            completed?: boolean;
          } = {
            postCourseComplete: true,
          };

          if (
            enrollment &&
            enrollment.completedCount === enrollment.lastModuleIndex + 1
          ) {
            // All modules completed, can mark course as completed
            updateData.completed = true;
          }

          await adminDb
            .collection(COL.enrollments)
            .doc(enrollmentId)
            .set(updateData, { merge: true });
        } else if (
          assignmentData.scope.type === "module" &&
          assignmentData.timing === "pre"
        ) {
          // Set preModuleComplete=true
          const progressId = `${user.uid}_${assignmentData.scope.courseId}_${assignmentData.scope.moduleId}`;
          await adminDb.collection(COL.progress).doc(progressId).set(
            {
              preModuleComplete: true,
            },
            { merge: true }
          );
        } else if (
          assignmentData.scope.type === "module" &&
          assignmentData.timing === "post"
        ) {
          // Set postModuleComplete=true
          const progressId = `${user.uid}_${assignmentData.scope.courseId}_${assignmentData.scope.moduleId}`;
          await adminDb.collection(COL.progress).doc(progressId).set(
            {
              postModuleComplete: true,
            },
            { merge: true }
          );
        }

        console.log(`✅ Submitted questionnaire response: ${resId}`);

        return {
          ok: true,
          responseId: resId,
          ...(score.total > 0 ? { score } : {}),
        };
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
