import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, requireAdmin } from "@/lib/auth";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    // Require admin authentication
    const currentUser = await getUserFromRequest(req);
    if (!currentUser) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    try {
      requireAdmin(currentUser);
    } catch {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { userId, role } = await req.json();

    if (!userId || !role || !["user", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid userId or role" },
        { status: 400 }
      );
    }

    if (!adminDb || !adminAuth) {
      throw new Error("Firebase Admin not initialized");
    }

    // Update user document in Firestore
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update role in user document
    await userRef.update({
      role,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Update custom claims
    await adminAuth.setCustomUserClaims(userId, { role });

    console.log(
      `Admin ${currentUser.email} updated role for user ${userId} to ${role}`
    );

    return NextResponse.json({
      ok: true,
      message: `User role updated to ${role}`,
      userId,
      newRole: role,
    });
  } catch (error: unknown) {
    console.error("Update user role error:", error);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

// Get all users with their roles (admin only)
export async function GET(req: NextRequest) {
  try {
    // Require admin authentication
    const currentUser = await getUserFromRequest(req);
    if (!currentUser) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    try {
      requireAdmin(currentUser);
    } catch {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    if (!adminDb) {
      throw new Error("Firebase Admin not initialized");
    }

    // Get all users
    const usersSnapshot = await adminDb.collection("users").get();
    const users = usersSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        createdAt: data.createdAt,
        lastLoginAt: data.lastLoginAt,
      };
    });

    return NextResponse.json({
      ok: true,
      users,
    });
  } catch (error: unknown) {
    console.error("Get users error:", error);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
