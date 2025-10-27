import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";

// Validation schema
const CreateAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const { email, password, displayName } = CreateAdminSchema.parse(body);

    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { ok: false, code: "firebase_not_initialized" },
        { status: 500 }
      );
    }

    // Two bootstrap paths:
    // 1. Bootstrap secret header
    const bootstrapKey = req.headers.get("x-admin-bootstrap-key");
    const isBootstrapValid =
      bootstrapKey && bootstrapKey === process.env.ADMIN_BOOTSTRAP_KEY;

    // 2. Existing admin + allowlist check
    let isAuthorized = false;
    if (isBootstrapValid) {
      // Check if this is the first admin (no existing admins)
      const existingAdmins = await adminDb
        .collection("users")
        .where("role", "==", "admin")
        .limit(1)
        .get();

      isAuthorized = existingAdmins.empty || !!process.env.ADMIN_BOOTSTRAP_KEY;
    } else {
      // Must be existing admin calling this endpoint
      const user = await getUserFromRequest(req);
      if (user?.role === "admin") {
        // Check if target email is in allowlist
        const adminAllowlist =
          process.env.ADMIN_ALLOWLIST?.split(",").map((e) => e.trim()) || [];
        isAuthorized = adminAllowlist.includes(email);
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          ok: false,
          code: "unauthorized",
          message: "Admin creation not authorized",
        },
        { status: 401 }
      );
    }

    // Check if user already exists
    try {
      await adminAuth.getUserByEmail(email);
      return NextResponse.json(
        {
          ok: false,
          code: "user_exists",
          message: "User with this email already exists",
        },
        { status: 409 }
      );
    } catch (error: unknown) {
      // User doesn't exist - this is what we want
      const firebaseError = error as { code?: string };
      if (firebaseError.code !== "auth/user-not-found") {
        throw error;
      }
    }

    // Create the user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
      emailVerified: true, // Auto-verify admin emails
    });

    // Set custom claims
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: "admin" });

    // Create user document
    await adminDb
      .collection("users")
      .doc(userRecord.uid)
      .set({
        uid: userRecord.uid,
        email,
        displayName: displayName || null,
        photoURL: null,
        role: "admin",
        createdAt: FieldValue.serverTimestamp(),
        lastLoginAt: null,
        // Initialize streak fields
        currentStreakDays: 0,
        bestStreakDays: 0,
        streakLastIncrementAt: null,
      });

    return NextResponse.json({
      ok: true,
      uid: userRecord.uid,
      email: userRecord.email,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, code: "validation_error", issues: error.issues },
        { status: 400 }
      );
    }

    console.error("Admin creation error:", error);
    return NextResponse.json(
      { ok: false, code: "internal_error" },
      { status: 500 }
    );
  }
}
