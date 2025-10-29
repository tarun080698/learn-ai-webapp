/**
 * Migration script to convert questionnaires from old string[] options format
 * to new {id, label} options format
 *
 * This script should be run once when upgrading from the old questionnaire format.
 */

import { adminDb } from "../lib/firebaseAdmin";
import { COL } from "../lib/firestore";

interface LegacyQuestionnaireQuestion {
  id: string;
  type: "single-choice" | "multiple-choice" | "text" | "scale";
  prompt: string;
  required: boolean;
  options?: string[]; // Old format: array of strings
  correctAnswers?: string[]; // Old format: array of strings
  scale?: { min: number; max: number };
}

interface ModernQuestionnaireQuestion {
  id: string;
  type: "single-choice" | "multiple-choice" | "text" | "scale";
  prompt: string;
  required: boolean;
  options?: Array<{ id: string; label: string; correct?: boolean }>; // New format
  scale?: { min: number; max: number };
}

interface QuestionnaireDoc {
  questions: LegacyQuestionnaireQuestion[] | ModernQuestionnaireQuestion[];
  title?: string;
  purpose?: string;
  version?: number;
  ownerUid?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

function generateOptionId(label: string, index: number): string {
  // Generate a stable ID from the label
  const cleanLabel = label.toLowerCase().replace(/[^a-z0-9]/g, "_");
  return `opt_${index}_${cleanLabel}`.substring(0, 50);
}

function isLegacyQuestion(
  question: unknown
): question is LegacyQuestionnaireQuestion {
  if (typeof question !== "object" || question === null) {
    return false;
  }

  const q = question as Record<string, unknown>;

  return (
    "options" in q &&
    Array.isArray(q.options) &&
    q.options.length > 0 &&
    typeof q.options[0] === "string"
  );
}

function migrateLegacyQuestion(
  question: LegacyQuestionnaireQuestion
): ModernQuestionnaireQuestion {
  const modernQuestion: ModernQuestionnaireQuestion = {
    id: question.id,
    type: question.type,
    prompt: question.prompt,
    required: question.required,
    scale: question.scale,
  };

  if (question.options) {
    modernQuestion.options = question.options.map((label, index) => ({
      id: generateOptionId(label, index),
      label: label,
      correct: question.correctAnswers?.includes(label) || false,
    }));
  }

  return modernQuestion;
}

async function migrateQuestionnaires(): Promise<void> {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  console.log("🚀 Starting questionnaire migration...");

  try {
    // Get all questionnaires
    const questionnairesSnapshot = await adminDb
      .collection(COL.questionnaires)
      .get();

    let migratedCount = 0;
    let alreadyModernCount = 0;
    const batch = adminDb.batch();

    for (const doc of questionnairesSnapshot.docs) {
      const questionnaire = doc.data() as QuestionnaireDoc;

      let needsMigration = false;
      const migratedQuestions: ModernQuestionnaireQuestion[] = [];

      for (const question of questionnaire.questions) {
        if (isLegacyQuestion(question)) {
          needsMigration = true;
          migratedQuestions.push(migrateLegacyQuestion(question));
          console.log(
            `  Migrating question "${question.prompt}" with ${question.options?.length} options`
          );
        } else {
          migratedQuestions.push(question as ModernQuestionnaireQuestion);
        }
      }

      if (needsMigration) {
        // Update the questionnaire with migrated questions
        batch.update(doc.ref, {
          questions: migratedQuestions,
          updatedAt: new Date(),
        });
        migratedCount++;
        console.log(
          `✅ Queued migration for questionnaire: ${
            questionnaire.title || doc.id
          }`
        );
      } else {
        alreadyModernCount++;
        console.log(`✨ Already modern: ${questionnaire.title || doc.id}`);
      }
    }

    if (migratedCount > 0) {
      await batch.commit();
      console.log(`🎉 Successfully migrated ${migratedCount} questionnaires`);
    }

    console.log(`📊 Migration summary:`);
    console.log(`  - Migrated: ${migratedCount} questionnaires`);
    console.log(`  - Already modern: ${alreadyModernCount} questionnaires`);
    console.log(
      `  - Total processed: ${questionnairesSnapshot.size} questionnaires`
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateQuestionnaires()
    .then(() => {
      console.log("✅ Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    });
}

export { migrateQuestionnaires };
