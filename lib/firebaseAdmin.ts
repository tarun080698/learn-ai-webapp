// Required env vars:
// FIREBASE_SERVICE_ACCOUNT_KEY (JSON string)

import { initializeApp, getApps, cert, getApp, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;

try {
  // Initialize Admin SDK only once
  if (getApps().length === 0) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required"
      );
    }

    const serviceAccount = JSON.parse(serviceAccountKey);
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

    if (!storageBucket) {
      throw new Error(
        "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable is required"
      );
    }

    adminApp = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: storageBucket,
    });
  } else {
    adminApp = getApp();
  }

  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);
} catch (error) {
  console.error("Failed to initialize Firebase Admin:", error);
  // Set to null so app can still run in development
  adminAuth = null;
  adminDb = null;
}

export { adminApp, adminAuth, adminDb };

// TODO: Harden with key rotation guidance
// Consider implementing key rotation strategy and secret management best practices
