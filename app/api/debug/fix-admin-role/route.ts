import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    // Check bootstrap secret
    const bootstrapSecret = req.headers.get("X-Bootstrap-Secret");
    if (bootstrapSecret !== process.env.BOOTSTRAP_ADMIN_SECRET) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    if (!adminAuth) {
      return NextResponse.json(
        { error: "Firebase Admin not initialized" },
        { status: 500 }
      );
    }

    // Get user by email
    const userRecord = await adminAuth.getUserByEmail(email);

    // Set admin custom claims
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: "admin" });

    console.log(`Updated user ${email} (${userRecord.uid}) to admin role`);

    return NextResponse.json({
      success: true,
      message: `User ${email} has been updated to admin role`,
      uid: userRecord.uid,
    });
  } catch (error) {
    console.error("Fix admin role error:", error);
    return NextResponse.json(
      {
        error: "Failed to fix admin role",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
