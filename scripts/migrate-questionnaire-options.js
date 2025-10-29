#!/usr/bin/env node

/**
 * Migration Helper: Questionnaire Options Format
 *
 * Migrates questionnaires from old format (string array options)
 * to new format (object array with {id, label, correct} structure).
 *
 * Usage:
 *   node scripts/migrate-questionnaire-options.js [--dry-run]
 *
 * Options:
 *   --dry-run    Show changes without applying them
 */

const admin = require("firebase-admin");

// Initialize Firebase Admin
function initializeFirebase() {
  if (admin.apps.length === 0) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required"
      );
    }

    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY: " + error.message);
    }
  }
  return admin.firestore();
}

// Generate option ID from label
function generateOptionId(label, index) {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .substring(0, 50) || `option_${index}`
  );
}

// Convert old options format to new format
function migrateOptions(question, questionIndex) {
  if (!question.options || !Array.isArray(question.options)) {
    return question; // No options to migrate
  }

  const hasNewFormat = question.options.some(
    (opt) => typeof opt === "object" && opt !== null && "id" in opt
  );

  if (hasNewFormat) {
    console.log(`Question ${question.id}: Already using new format`);
    return question; // Already migrated
  }

  // Migrate from string array to object array
  const migratedOptions = question.options.map((option, index) => {
    if (typeof option === "string") {
      const optionObj = {
        id: generateOptionId(option, index),
        label: option,
      };

      // Check if this option was marked as correct (for quiz questions)
      if (question.correctAnswer === option) {
        optionObj.correct = true;
      }

      return optionObj;
    }
    return option; // Already an object
  });

  const migratedQuestion = {
    ...question,
    options: migratedOptions,
  };

  // Remove old correctAnswer field if it exists
  if ("correctAnswer" in migratedQuestion) {
    delete migratedQuestion.correctAnswer;
  }

  console.log(
    `Question ${question.id}: Migrated ${question.options.length} options`
  );
  return migratedQuestion;
}

// Migrate a single questionnaire
function migrateQuestionnaire(questionnaire) {
  const migratedQuestions = questionnaire.questions.map((question, index) =>
    migrateOptions(question, index)
  );

  return {
    ...questionnaire,
    questions: migratedQuestions,
  };
}

// Main migration function
async function runMigration(dryRun = false) {
  console.log("🔄 Starting questionnaire options migration...");
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE UPDATE"}`);

  try {
    const db = initializeFirebase();
    const questionnaires = await db.collection("questionnaires").get();

    if (questionnaires.empty) {
      console.log("📝 No questionnaires found");
      return;
    }

    let migratedCount = 0;
    let skippedCount = 0;

    for (const doc of questionnaires.docs) {
      const questionnaire = doc.data();
      console.log(
        `\n📋 Processing questionnaire: ${questionnaire.title || doc.id}`
      );

      const migratedQuestionnaire = migrateQuestionnaire(questionnaire);

      // Check if any changes were made
      const hasChanges =
        JSON.stringify(questionnaire.questions) !==
        JSON.stringify(migratedQuestionnaire.questions);

      if (!hasChanges) {
        console.log("✅ No migration needed");
        skippedCount++;
        continue;
      }

      console.log("🔄 Migration needed:");
      migratedQuestionnaire.questions.forEach((question, index) => {
        if (question.options) {
          console.log(
            `  - Question ${question.id}: ${question.options.length} options`
          );
        }
      });

      if (!dryRun) {
        // Update the document
        await doc.ref.update({
          questions: migratedQuestionnaire.questions,
          migratedAt: admin.firestore.FieldValue.serverTimestamp(),
          migratedBy: "questionnaire-options-migration-script",
        });
        console.log("💾 Updated in database");
      } else {
        console.log("📋 Would update in live mode");
      }

      migratedCount++;
    }

    console.log("\n📊 Migration Summary:");
    console.log(`✅ Migrated: ${migratedCount} questionnaires`);
    console.log(`⏭️  Skipped: ${skippedCount} questionnaires`);
    console.log(`📝 Total: ${questionnaires.size} questionnaires`);

    if (dryRun) {
      console.log(
        "\n🔍 This was a dry run. Use without --dry-run to apply changes."
      );
    } else {
      console.log("\n✅ Migration completed successfully!");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  runMigration(dryRun).catch((error) => {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  });
}

module.exports = {
  runMigration,
  migrateQuestionnaire,
  generateOptionId,
};
