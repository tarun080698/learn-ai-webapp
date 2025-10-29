import { NextRequest } from "next/server";
import {
  getUserFromRequest,
  assertUserProviderGoogle,
  jsonError,
} from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { zProgressComplete } from "@/lib/schemas";
import {
  COL,
  enrollmentId,
  progressId,
  canCompleteModule,
} from "@/lib/firestore";
import { withIdempotency } from "@/lib/idempotency";

/*
DEV TESTING:
COMPLETE MODULE 0:
curl -X POST http://localhost:3000/api/progress \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: complete-module-0-attempt-1" \
  -d '{
    "courseId": "course-123",
    "moduleId": "module-abc",
    "moduleIndex": 0
  }'

COMPLETE MODULE 1:
curl -X POST http://localhost:3000/api/progress \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: complete-module-1-attempt-1" \
  -d '{
    "courseId": "course-123",
    "moduleId": "module-def",
    "moduleIndex": 1
  }'

TRANSACTION RULES:
1. Read progress doc - if already completed, return existing (no double increment)
2. Set progress.completed=true, completedAt=now (if not already)
3. Read/create enrollment doc defensively
4. Read course.moduleCount
5. Compute: completedCount, progressPct, lastModuleIndex, completed flag
6. Update enrollment with new denormalized values

RESUME POINTER LOGIC:
- lastModuleIndex = highest continuous module index from 0
- Allows out-of-order completions but resume pointer stays linear
- Example: completed [0,1,3,4] → resume at index 2 (next uncompleted in sequence)
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
    const parsed = zProgressComplete.parse(body);

    if (!adminDb) {
      throw Object.assign(new Error("Firebase Admin not initialized"), {
        status: 500,
      });
    }

    // Get idempotency key from header (optional)
    const idempotencyKey = req.headers.get("x-idempotency-key") || undefined;

    // Wrap progress logic with idempotency
    const result = await withIdempotency(
      adminDb,
      idempotencyKey,
      {
        kind: "progress",
        uid: user.uid,
        courseId: parsed.courseId,
        moduleId: parsed.moduleId,
      },
      async () => {
        // Check gating requirements before allowing module completion
        const canComplete = await canCompleteModule(
          adminDb!,
          user.uid,
          parsed.courseId,
          parsed.moduleId
        );

        if (!canComplete.allowed) {
          throw Object.assign(new Error(canComplete.reason), {
            status: 403,
            code: "gating_requirement_not_met",
          });
        }

        return await adminDb!.runTransaction(async (transaction) => {
          // 1. Read progress document
          const progId = progressId(user.uid, parsed.courseId, parsed.moduleId);
          const progressRef = adminDb!.collection(COL.progress).doc(progId);
          const progressDoc = await transaction.get(progressRef);

          let wasAlreadyCompleted = false;

          if (progressDoc.exists) {
            const progressData = progressDoc.data()!;
            wasAlreadyCompleted = progressData.completed || false;
          }

          // 2. Set/merge progress completion (idempotent)
          if (!wasAlreadyCompleted) {
            transaction.set(
              progressRef,
              {
                uid: user.uid,
                courseId: parsed.courseId,
                moduleId: parsed.moduleId,
                completed: true,
                completedAt: new Date(),
              },
              { merge: true }
            );
          }

          // 3. Read enrollment document (create defensively if missing)
          const enrollId = enrollmentId(user.uid, parsed.courseId);
          const enrollRef = adminDb!.collection(COL.enrollments).doc(enrollId);
          const enrollDoc = await transaction.get(enrollRef);

          let enrollData;
          if (!enrollDoc.exists) {
            // Defensive: create enrollment if missing
            enrollData = {
              uid: user.uid,
              courseId: parsed.courseId,
              enrolledAt: new Date(),
              completed: false,
              lastModuleIndex: 0,
              completedCount: 0,
              progressPct: 0,
            };
          } else {
            enrollData = enrollDoc.data()!;
          }

          // 4. Read course to get moduleCount
          const courseRef = adminDb!
            .collection(COL.courses)
            .doc(parsed.courseId);
          const courseDoc = await transaction.get(courseRef);
          if (!courseDoc.exists) {
            throw Object.assign(new Error("Course not found"), {
              status: 404,
              code: "course_not_found",
            });
          }
          const courseData = courseDoc.data()!;
          const totalModules = courseData.moduleCount || 0;

          // 5. Compute new enrollment values
          let newCompletedCount = enrollData.completedCount || 0;

          // Only increment if this progress was not already completed
          if (!wasAlreadyCompleted) {
            newCompletedCount += 1;
          }

          // Calculate progress percentage (0-100)
          const newProgressPct =
            totalModules > 0
              ? Math.min(
                  100,
                  Math.floor((newCompletedCount / totalModules) * 100)
                )
              : 0;

          // Update last module index (resume pointer)
          const newLastModuleIndex = Math.max(
            enrollData.lastModuleIndex || 0,
            parsed.moduleIndex + 1
          );
          // Clamp to total module count
          const clampedLastModuleIndex = Math.min(
            newLastModuleIndex,
            totalModules
          );

          // Course completed when all modules done
          const newCompleted =
            newCompletedCount >= totalModules && totalModules > 0;

          // Check if this is the first time the enrollment is being completed
          const wasEnrollmentCompleted = enrollData.completed || false;
          const isFirstTimeCompleted = newCompleted && !wasEnrollmentCompleted;

          // 6. Update enrollment
          const updatedEnrollData = {
            ...enrollData,
            completedCount: newCompletedCount,
            progressPct: newProgressPct,
            lastModuleIndex: clampedLastModuleIndex,
            completed: newCompleted,
          };

          transaction.set(enrollRef, updatedEnrollData, { merge: true });

          // 7. Increment course completion counter if enrollment completed for first time
          // Idempotency: only increment when enrollment.completed flips from false to true
          // Multiple progress completions won't inflate the counter
          if (isFirstTimeCompleted) {
            const currentCompletionCount = courseData.completionCount || 0;
            transaction.update(courseRef, {
              completionCount: currentCompletionCount + 1,
              updatedAt: new Date(),
            });
          }

          return {
            progressPct: newProgressPct,
            lastModuleIndex: clampedLastModuleIndex,
            completed: newCompleted,
            completedCount: newCompletedCount,
            totalModules,
            wasAlreadyCompleted,
            courseCompletedFirstTime: isFirstTimeCompleted, // For debugging/logging
          };
        });
      }
    );

    return Response.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("Progress completion error:", error);
    return jsonError(error);
  }
}
