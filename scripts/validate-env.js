#!/usr/bin/env node

/**
 * Environment Validation Script
 * Run with: node scripts/validate-env.js
 */

// Load environment variables from .env.local
const fs = require("fs");
const path = require("path");

// Load .env.local if it exists
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        let value = valueParts.join("=");
        // Remove quotes if wrapped
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  });
}

console.log("🔍 Validating Environment Configuration...\n");

// Check required environment variables
const requiredVars = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "FIREBASE_SERVICE_ACCOUNT_KEY",
  "ADMIN_BOOTSTRAP_KEY",
];

let hasErrors = false;

console.log("📋 Checking required environment variables:");
requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: Missing`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName}: Set (${value.length} characters)`);
  }
});

console.log("\n🔐 Validating Firebase Service Account Key:");
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  console.log("❌ FIREBASE_SERVICE_ACCOUNT_KEY is not set");
  hasErrors = true;
} else {
  try {
    const parsed = JSON.parse(serviceAccountKey);

    // Check required fields
    const requiredFields = [
      "type",
      "project_id",
      "private_key",
      "client_email",
    ];
    const missingFields = requiredFields.filter((field) => !parsed[field]);

    if (missingFields.length > 0) {
      console.log(`❌ Missing required fields: ${missingFields.join(", ")}`);
      hasErrors = true;
    } else {
      console.log("✅ Service account key is valid JSON with required fields");
      console.log(`   Project ID: ${parsed.project_id}`);
      console.log(`   Client Email: ${parsed.client_email}`);
    }
  } catch (error) {
    console.log(`❌ Invalid JSON: ${error.message}`);
    console.log(
      "   Make sure the service account key is properly formatted JSON"
    );
    hasErrors = true;
  }
}

console.log("\n🔒 Checking Bootstrap Secret:");
const bootstrapSecret = process.env.ADMIN_BOOTSTRAP_KEY;
if (!bootstrapSecret) {
  console.log("❌ ADMIN_BOOTSTRAP_KEY is not set");
  hasErrors = true;
} else if (bootstrapSecret.length < 16) {
  console.log(
    "⚠️  ADMIN_BOOTSTRAP_KEY is less than 16 characters (consider using a stronger secret)"
  );
} else {
  console.log("✅ ADMIN_BOOTSTRAP_KEY is set and sufficiently long");
}

console.log("\n" + "=".repeat(50));
if (hasErrors) {
  console.log("❌ Environment validation failed!");
  console.log("\n💡 Tips:");
  console.log("1. Create .env.local in the project root");
  console.log(
    "2. Download service account key from Firebase Console > Project Settings > Service Accounts"
  );
  console.log(
    "3. Copy the JSON content as a single line wrapped in single quotes"
  );
  console.log("4. Restart your development server after making changes");
  process.exit(1);
} else {
  console.log("✅ All environment variables are properly configured!");
  console.log(
    "\n🚀 You can now start your development server with: npm run dev"
  );
}
