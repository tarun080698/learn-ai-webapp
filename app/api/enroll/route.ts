import { NextRequest } from "next/server";
import {
  getUserFromRequest,
  assertUserProviderGoogle,
  jsonError,
} from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { zEnroll } from "@/lib/schemas";
import { COL, enrollmentId } from "@/lib/firestore";
import { withIdempotency } from "@/lib/idempotency";

/*
DEV TESTING:
curl -X POST http://localhost:3000/api/enroll \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: enroll-attempt-1" \
  -d '{
    "courseId": "course-123"
  }'

ENROLLMENT WITH GOOGLE USER (required):
- User must have Google provider authentication
- Admin users can also enroll (if they have Google provider)
- Email/password users are rejected with 403
*/

export async function POST(req: NextRequest) {
  try {
    // Verify user authentication and Google provider
    const user = await getUserFromRequest(req);
    if (!user) {
      throw Object.assign(new Error("Authentication required"), {
        status: 401,
        code: "unauthorized",
      });
    }

    // Enforce Google provider for users (admins exempt)
    assertUserProviderGoogle(user);

    // Parse and validate request body
    const body = await req.json();
    const parsed = zEnroll.parse(body);

    if (!adminDb) {
      throw Object.assign(new Error("Firebase Admin not initialized"), {
        status: 500,
      });
    }

    // Get idempotency key from header (optional)
    const idempotencyKey = req.headers.get("x-idempotency-key") || undefined;

    // Wrap enrollment logic with idempotency
    const result = await withIdempotency(
      adminDb,
      idempotencyKey,
      { kind: "enroll", uid: user.uid, courseId: parsed.courseId },
      async () => {
        // Check if course exists and is published
        const courseDoc = await adminDb!
          .collection(COL.courses)
          .doc(parsed.courseId)
          .get();
        if (!courseDoc.exists) {
          throw Object.assign(new Error("Course not found"), {
            status: 404,
            code: "course_not_found",
          });
        }

        const courseData = courseDoc.data()!;
        if (!courseData.published) {
          throw Object.assign(new Error("Course not published"), {
            status: 409,
            code: "course_not_published",
          });
        }

        const enrollId = enrollmentId(user.uid, parsed.courseId);
        const enrollRef = adminDb!.collection(COL.enrollments).doc(enrollId);

        // Get or create enrollment
        const enrollDoc = await enrollRef.get();

        if (enrollDoc.exists) {
          // Return existing enrollment (idempotent - counter NOT incremented again)
          // This ensures multiple enrollment requests don't artificially inflate enrollmentCount
          const existing = enrollDoc.data()!;
          return {
            enrollment: {
              uid: existing.uid,
              courseId: existing.courseId,
              enrolledAt: existing.enrolledAt,
              completed: existing.completed,
              progressPct: existing.progressPct,
            },
            isNew: false,
          };
        } else {
          // Create new enrollment with counter increment
          const now = new Date();
          const enrollmentData = {
            uid: user.uid,
            courseId: parsed.courseId,
            enrolledAt: now,
            completed: false,
            lastModuleIndex: 0,
            completedCount: 0,
            progressPct: 0,
          };

          // Use transaction to atomically create enrollment and increment counter
          await adminDb!.runTransaction(async (transaction) => {
            // Create enrollment
            transaction.set(enrollRef, enrollmentData);

            // Increment course enrollment counter
            const courseRef = adminDb!
              .collection(COL.courses)
              .doc(parsed.courseId);
            const courseDoc = await transaction.get(courseRef);
            const currentCount = courseDoc.data()?.enrollmentCount || 0;

            transaction.update(courseRef, {
              enrollmentCount: currentCount + 1,
              updatedAt: now,
            });
          });

          return {
            enrollment: {
              uid: enrollmentData.uid,
              courseId: enrollmentData.courseId,
              enrolledAt: enrollmentData.enrolledAt,
              completed: enrollmentData.completed,
              progressPct: enrollmentData.progressPct,
            },
            isNew: true,
          };
        }
      }
    );

    return Response.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("Enrollment error:", error);
    return jsonError(error);
  }
}
