/**
 * POST /api/admin/questionnaire.upsert
 *
 * Admin creates or updates questionnaire templates with versioned question sets.
 *
 * curl -X POST http://localhost:3000/api/admin/questionnaire.upsert \
 *   -H "Authorization: Bearer $ADMIN_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "title": "Course Prerequisites Survey",
 *     "purpose": "survey",
 *     "version": 1,
 *     "questions": [
 *       {
 *         "id": "q1",
 *         "type": "single",
 *         "prompt": "What is your experience level with AI?",
 *         "options": [
 *           {"id": "beginner", "label": "Beginner"},
 *           {"id": "intermediate", "label": "Intermediate"},
 *           {"id": "advanced", "label": "Advanced"}
 *         ],
 *         "required": true
 *       }
 *     ]
 *   }'
 */
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, requireAdmin, jsonError } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { COL } from "@/lib/firestore";
import { zQuestionnaireUpsert } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const validated = zQuestionnaireUpsert.parse(body);

    // Require admin authentication
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    try {
      requireAdmin(user);
    } catch {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (!adminDb) {
      throw new Error("Firebase Admin not initialized");
    }

    // Validate option IDs for uniqueness within each question
    for (const question of validated.questions) {
      if (question.options && question.options.length > 0) {
        const optionIds = question.options.map((opt) => opt.id);
        const uniqueIds = new Set(optionIds);

        if (optionIds.length !== uniqueIds.size) {
          throw Object.assign(
            new Error(`Duplicate option IDs found in question ${question.id}`),
            { status: 400, code: "duplicate_option_ids" }
          );
        }
      }
    }

    const now = new Date();
    const questionnaireId =
      validated.questionnaireId ||
      adminDb.collection(COL.questionnaires).doc().id;

    // If updating, check version constraints and ownership
    if (validated.questionnaireId) {
      const existingDoc = await adminDb
        .collection(COL.questionnaires)
        .doc(validated.questionnaireId)
        .get();
      if (existingDoc.exists) {
        const existing = existingDoc.data();
        if (existing) {
          // Check ownership
          if (existing.ownerUid !== user.uid) {
            throw Object.assign(
              new Error("Access denied: not the questionnaire owner"),
              {
                status: 403,
                code: "questionnaire_access_denied",
              }
            );
          }
        }
      }
    }

    const questionnaireData = {
      title: validated.title,
      purpose: validated.purpose,
      questions: validated.questions,
      ownerUid: user.uid, // Set ownership
      updatedAt: now,
      ...(validated.questionnaireId ? {} : { createdAt: now }),
    };

    await adminDb
      .collection(COL.questionnaires)
      .doc(questionnaireId)
      .set(questionnaireData, { merge: !!validated.questionnaireId });

    console.log(
      `✅ ${
        validated.questionnaireId ? "Updated" : "Created"
      } questionnaire: ${questionnaireId}`
    );

    return NextResponse.json({
      ok: true,
      questionnaireId,
    });
  } catch (error) {
    return jsonError(error);
  }
}
