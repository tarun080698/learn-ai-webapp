// Temporary debug script to check courses directly
import { adminDb } from "./lib/firebaseAdmin.js";

async function debugCourses() {
  try {
    console.log("🔍 Debugging courses collection...");

    // First, let's see ALL courses
    const allCoursesSnapshot = await adminDb
      .collection("courses")
      .limit(10)
      .get();
    console.log(`📊 Total courses found: ${allCoursesSnapshot.size}`);

    allCoursesSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\nCourse ${index + 1}:`);
      console.log(`  ID: ${doc.id}`);
      console.log(`  Title: ${data.title}`);
      console.log(`  Published: ${data.published}`);
      console.log(`  Archived: ${data.archived}`);
      console.log(`  PublishedAt: ${data.publishedAt}`);
      console.log(`  CreatedAt: ${data.createdAt}`);
    });

    // Now let's try the published filter only
    console.log("\n🔍 Checking published courses...");
    const publishedSnapshot = await adminDb
      .collection("courses")
      .where("published", "==", true)
      .get();
    console.log(`📊 Published courses: ${publishedSnapshot.size}`);

    // Check non-archived courses
    console.log("\n🔍 Checking non-archived courses...");
    const nonArchivedSnapshot = await adminDb
      .collection("courses")
      .where("archived", "==", false)
      .get();
    console.log(`📊 Non-archived courses: ${nonArchivedSnapshot.size}`);

    // Try the compound query without orderBy
    console.log("\n🔍 Checking published + non-archived courses...");
    const compoundSnapshot = await adminDb
      .collection("courses")
      .where("published", "==", true)
      .where("archived", "==", false)
      .get();
    console.log(
      `📊 Published + Non-archived courses: ${compoundSnapshot.size}`
    );

    compoundSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\nMatching Course ${index + 1}:`);
      console.log(`  ID: ${doc.id}`);
      console.log(`  Title: ${data.title}`);
      console.log(`  Published: ${data.published}`);
      console.log(`  Archived: ${data.archived}`);
      console.log(`  PublishedAt: ${data.publishedAt}`);
    });
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

debugCourses();
