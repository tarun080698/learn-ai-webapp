/**
 * POST /api/questionnaires
 *
 * Create a new questionnaire template (Admin only)
 *
 * Body: {
 *   title: string;
 *   purpose: "survey" | "quiz" | "mixed";
 *   questions: Array<{
 *     type: "single" | "multi" | "scale" | "text";
 *     prompt: string;
 *     required: boolean;
 *     options?: string[];
 *     scaleMin?: number;
 *     scaleMax?: number;
 *   }>;
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  console.log("📝 Creating new questionnaire template");

  try {
    // Verify admin role
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (authUser.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { title, purpose, questions } = body;

    // Validate required fields
    if (!title || !purpose || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: "Missing required fields: title, purpose, questions" },
        { status: 400 }
      );
    }

    // Validate purpose
    if (!["survey", "quiz", "mixed"].includes(purpose)) {
      return NextResponse.json(
        { error: "Purpose must be 'survey', 'quiz', or 'mixed'" },
        { status: 400 }
      );
    }

    // Validate questions
    for (const question of questions) {
      if (
        !question.type ||
        !question.prompt ||
        typeof question.required !== "boolean"
      ) {
        return NextResponse.json(
          {
            error: "Each question must have type, prompt, and required fields",
          },
          { status: 400 }
        );
      }

      if (!["single", "multi", "scale", "text"].includes(question.type)) {
        return NextResponse.json(
          {
            error:
              "Question type must be 'single', 'multi', 'scale', or 'text'",
          },
          { status: 400 }
        );
      }
    }

    // Create questionnaire document
    const questionnaireId = uuidv4();
    const questionnaire = {
      id: questionnaireId,
      title,
      purpose,
      questions: questions.map((q, index) => ({
        id: `q${index + 1}`,
        ...q,
      })),
      version: 1,
      active: true,
      createdAt: new Date().toISOString(),
      createdBy: authUser.uid,
    };

    // Save to Firestore
    await adminDb
      .collection("questionnaires")
      .doc(questionnaireId)
      .set(questionnaire);

    console.log(`✅ Questionnaire created: ${questionnaireId}`);

    return NextResponse.json({
      success: true,
      questionnaireId,
      questionnaire,
    });
  } catch (error) {
    console.error("❌ Error creating questionnaire:", error);
    return NextResponse.json(
      { error: "Failed to create questionnaire" },
      { status: 500 }
    );
  }
}
