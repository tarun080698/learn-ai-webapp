#!/usr/bin/env node

/**
 * Firestore Index Management Script
 *
 * This script helps create and manage Firestore composite indexes
 * required for the Learn AI Questionnaire System.
 */

console.log("🔥 Firestore Index Management for Learn AI System");
console.log("=".repeat(55));

console.log("\n📋 Required Composite Indexes:");

const indexes = [
  {
    collection: "courses",
    fields: ["published (ASC)", "createdAt (DESC)"],
    purpose: "Course catalog listing",
    query: "Published courses ordered by creation date",
  },
  {
    collection: "enrollments",
    fields: ["uid (ASC)", "enrolledAt (DESC)"],
    purpose: "User enrollment history",
    query: "User enrollments ordered by enrollment date",
  },
  {
    collection: "questionnaire_assignments",
    fields: ["active (ASC)", "scope.courseId (ASC)"],
    purpose: "Course questionnaire assignments",
    query: "Active assignments for specific courses",
  },
  {
    collection: "questionnaire_assignments",
    fields: ["active (ASC)", "timing (ASC)", "scope.courseId (ASC)"],
    purpose: "Gating questionnaire lookup",
    query: "Pre/post assignments for course access control",
  },
  {
    collection: "questionnaire_assignments",
    fields: ["active (ASC)", "scope.moduleId (ASC)"],
    purpose: "Module questionnaire assignments",
    query: "Active assignments for specific modules",
  },
  {
    collection: "questionnaire_responses",
    fields: ["userId (ASC)", "assignmentId (ASC)", "status (ASC)"],
    purpose: "User response tracking",
    query: "Completed responses for gating checks",
  },
];

indexes.forEach((index, i) => {
  console.log(`\n${i + 1}. ${index.collection}`);
  console.log(`   Fields: ${index.fields.join(", ")}`);
  console.log(`   Purpose: ${index.purpose}`);
  console.log(`   Query: ${index.query}`);
});

console.log("\n🛠️  How to Create Indexes:");
console.log("\n📁 Option 1: Use firestore.indexes.json");
console.log("   1. Copy firestore.indexes.json to your Firebase project");
console.log("   2. Run: firebase deploy --only firestore:indexes");

console.log("\n🌐 Option 2: Use Firebase Console");
console.log("   1. Go to Firebase Console > Firestore Database > Indexes");
console.log('   2. Click "Create Index" for each composite index above');
console.log("   3. Enter the collection name and field configurations");

console.log("\n⚡ Option 3: Auto-create from errors");
console.log("   1. Run your app and trigger the queries");
console.log("   2. Copy the index creation URLs from error messages");
console.log("   3. Open URLs in browser to auto-create indexes");

console.log("\n🚨 Development vs Production:");
console.log("   • Development: Indexes automatically created from errors");
console.log("   • Production: Must pre-create indexes for performance");
console.log("   • Current queries modified to work without indexes in dev");

console.log("\n✅ Status Check:");
console.log('   • Run "npm run test" to verify all queries work');
console.log("   • Check console for any remaining index warnings");
console.log("   • Monitor query performance in Firebase Console");

console.log("\n📖 Documentation:");
console.log(
  "   • Firebase Indexes: https://firebase.google.com/docs/firestore/query-data/indexing"
);
console.log("   • firestore.indexes.json reference included in project");

console.log("\n" + "=".repeat(55));
console.log("🎯 After creating indexes, all queries will be optimized!");

// Check if Firebase CLI is available
const { execSync } = require("child_process");

try {
  execSync("firebase --version", { stdio: "ignore" });
  console.log("\n💡 Firebase CLI detected! You can run:");
  console.log("   firebase deploy --only firestore:indexes");
} catch {
  console.log("\n💡 To install Firebase CLI:");
  console.log("   npm install -g firebase-tools");
  console.log("   firebase login");
  console.log("   firebase use your-project-id");
}

console.log("");
