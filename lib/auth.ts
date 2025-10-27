// Required env vars:
// FB_SERVICE_ACCOUNT_KEY_JSON
// ADMIN_ALLOWLIST (CSV of emails)
// ADMIN_BOOTSTRAP_KEY (optional but recommended)

import { adminAuth, adminDb } from "./firebaseAdmin";
import type { DecodedIdToken } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";

export interface AuthUser {
  uid: string;
  email?: string;
  role?: "user" | "admin";
  provider?: string;
  token: DecodedIdToken;
}

/**
 * Extract and verify user from Authorization header
 * Returns full auth user with role from custom claims
 */
export async function getUserFromRequest(
  req: Request
): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("No authorization header or invalid format");
      return null;
    }

    const idToken = authHeader.slice(7);

    if (!adminAuth) {
      console.error("Firebase Admin not initialized");
      return null;
    }

    const decodedToken: DecodedIdToken = await adminAuth.verifyIdToken(idToken);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role as "user" | "admin" | undefined,
      provider: decodedToken.firebase.sign_in_provider,
      token: decodedToken,
    };
  } catch (error) {
    console.error("Failed to verify ID token:", error);
    return null;
  }
}

/**
 * Require authenticated user - throws 401 if null
 */
export function requireUser(user: AuthUser | null): asserts user is AuthUser {
  if (!user) {
    throw new Error("401");
  }
}

/**
 * Require admin role - throws 403 if not admin
 */
export function requireAdmin(user: AuthUser | null): asserts user is AuthUser {
  requireUser(user);
  if (user.role !== "admin") {
    throw new Error("403");
  }
}

/**
 * Get UTC day key for streak tracking
 */
export function utcDayKey(date: Date): string {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

/**
 * Ensure user document exists with proper structure
 */
export async function ensureUserDoc(userData: {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  role: "user" | "admin";
}): Promise<void> {
  if (!adminDb) throw new Error("Firestore Admin not initialized");

  const userRef = adminDb.collection("users").doc(userData.uid);

  try {
    const userDoc = await userRef.get();
    const now = FieldValue.serverTimestamp();

    if (!userDoc.exists) {
      // Create new user document
      await userRef.set({
        uid: userData.uid,
        email: userData.email || null,
        displayName: userData.displayName || null,
        photoURL: userData.photoURL || null,
        role: userData.role,
        createdAt: now,
        lastLoginAt: now,
        // Initialize streak fields
        currentStreakDays: 0,
        bestStreakDays: 0,
        streakLastIncrementAt: null,
      });
    } else {
      // Update existing user
      await userRef.update({
        lastLoginAt: now,
        role: userData.role, // Mirror role from custom claims
        ...(userData.email && { email: userData.email }),
        ...(userData.displayName && { displayName: userData.displayName }),
        ...(userData.photoURL && { photoURL: userData.photoURL }),
      });
    }
  } catch (error) {
    console.error("Error ensuring user doc:", error);
    throw error;
  }
}

/**
 * Update streak in a transaction and record login event
 */
export async function updateStreakTransaction(
  uid: string
): Promise<{ currentStreakDays: number; bestStreakDays: number }> {
  if (!adminDb) throw new Error("Firestore Admin not initialized");

  const userRef = adminDb.collection("users").doc(uid);
  const now = new Date();
  const todayKey = utcDayKey(now);

  // Record login event first
  await adminDb.collection("loginEvents").add({
    uid,
    timestamp: FieldValue.serverTimestamp(),
    source: "web",
    utcDate: todayKey,
  });

  // Update streak in transaction
  return await adminDb.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists) {
      throw new Error("User document not found");
    }

    const userData = userDoc.data();
    const lastIncrementAt = userData?.streakLastIncrementAt?.toDate();
    const lastIncrementKey = lastIncrementAt
      ? utcDayKey(lastIncrementAt)
      : null;

    let currentStreakDays = userData?.currentStreakDays || 0;
    let bestStreakDays = userData?.bestStreakDays || 0;

    // If already incremented today, no-op
    if (lastIncrementKey === todayKey) {
      return { currentStreakDays, bestStreakDays };
    }

    // Check if yesterday (consecutive day)
    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayKey = utcDayKey(yesterday);

    if (lastIncrementKey === yesterdayKey) {
      // Consecutive day - increment streak
      currentStreakDays += 1;
    } else {
      // Not consecutive - reset streak
      currentStreakDays = 1;
    }

    // Update best streak
    bestStreakDays = Math.max(bestStreakDays, currentStreakDays);

    // Update user document
    transaction.update(userRef, {
      currentStreakDays,
      bestStreakDays,
      streakLastIncrementAt: FieldValue.serverTimestamp(),
    });

    return { currentStreakDays, bestStreakDays };
  });
}

// ===== Phase 2: Additional Auth Utilities =====

export interface ApiUser {
  uid: string;
  email?: string;
  role?: "user" | "admin";
  provider?: string;
}

export function assertUserProviderGoogle(user: ApiUser) {
  if (user.role !== "admin" && user.provider !== "google.com") {
    const err = new Error("provider_not_allowed") as Error & {
      status?: number;
      code?: string;
    };
    err.status = 403;
    err.code = "provider_not_allowed";
    throw err;
  }
}

export async function withIdempotency<T>(
  db: FirebaseFirestore.Firestore,
  uid: string,
  key: string | undefined,
  work: () => Promise<T>
): Promise<T> {
  // If no key provided, just run
  if (!key) return work();
  const docRef = db.collection("idempotentWrites").doc(`${uid}_${key}`);
  try {
    return await db.runTransaction(async (tx) => {
      const doc = await tx.get(docRef);
      if (doc.exists) {
        const data = doc.data()!;
        throw Object.assign(new Error("idempotent_replay"), {
          status: 200,
          payload: data.payload,
        });
      }
      const result = await work();
      tx.set(docRef, { uid, key, payload: result, ts: new Date() });
      return result;
    });
  } catch (e: unknown) {
    const error = e as Error & { status?: number; payload?: T };
    if (error && error.status === 200 && error.payload) return error.payload; // replay-safe
    throw e;
  }
}

export function jsonError(e: unknown, fallbackStatus = 500) {
  const error = e as Error & { status?: number; code?: string };
  const status = error?.status || fallbackStatus;
  const code = error?.code || "internal";
  const message = error?.message || "Internal error";
  return new Response(JSON.stringify({ ok: false, code, message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
