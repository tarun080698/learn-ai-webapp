import { NextRequest } from "next/server";
import { getUserFromRequest, requireAdmin, jsonError } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { zModuleUpsert } from "@/lib/schemas";
import { COL, recomputeCourseModuleCount } from "@/lib/firestore";

/*
DEV TESTING:
curl -X POST http://localhost:3000/api/admin/module.upsert \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "course-123",
    "index": 0,
    "title": "Module 1: Getting Started",
    "summary": "Introduction to the course fundamentals",
    "contentType": "video",
    "contentUrl": "https://youtube.com/watch?v=abc123",
    "estMinutes": 15
  }'

TEXT MODULE:
curl -X POST http://localhost:3000/api/admin/module.upsert \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "course-123",
    "index": 1,
    "title": "Module 2: Theory",
    "summary": "Core concepts and principles",
    "contentType": "text",
    "body": "# Chapter 1\n\nThis is the content...",
    "estMinutes": 20
  }'
*/

export async function POST(req: NextRequest) {
  try {
    // Verify admin authorization
    const user = await getUserFromRequest(req);
    requireAdmin(user);

    // Parse and validate request body
    const body = await req.json();
    const parsed = zModuleUpsert.parse(body);

    if (!adminDb) {
      throw Object.assign(new Error("Firebase Admin not initialized"), {
        status: 500,
      });
    }

    // Validate content based on contentType
    if (parsed.contentType === "text") {
      if (!parsed.body) {
        throw Object.assign(new Error("body required for text content"), {
          status: 400,
          code: "missing_body",
        });
      }
    } else if (["video", "pdf", "link", "image"].includes(parsed.contentType)) {
      if (!parsed.contentUrl) {
        throw Object.assign(
          new Error("contentUrl required for " + parsed.contentType),
          { status: 400, code: "missing_content_url" }
        );
      }
    }

    // Verify parent course exists and admin owns it
    const courseDoc = await adminDb
      .collection(COL.courses)
      .doc(parsed.courseId)
      .get();
    if (!courseDoc.exists) {
      throw Object.assign(new Error("Parent course not found"), {
        status: 404,
        code: "course_not_found",
      });
    }

    // Verify course ownership
    const courseData = courseDoc.data();
    if (courseData?.ownerUid !== user.uid) {
      throw Object.assign(new Error("Access denied: not the course owner"), {
        status: 403,
        code: "course_access_denied",
      });
    }
    const coursePublished = courseData.published || false;

    const now = new Date();
    let moduleId: string;
    let isUpdate = false;

    if (parsed.moduleId) {
      // Update existing module
      moduleId = parsed.moduleId;
      isUpdate = true;

      // Verify module exists
      const moduleDoc = await adminDb
        .collection(COL.modules)
        .doc(moduleId)
        .get();
      if (!moduleDoc.exists) {
        throw Object.assign(new Error("Module not found"), {
          status: 404,
          code: "module_not_found",
        });
      }
    } else {
      // Create new module
      moduleId = adminDb.collection(COL.modules).doc().id;
    }

    // Validate index uniqueness within the course
    const existingModuleQuery = await adminDb
      .collection(COL.modules)
      .where("courseId", "==", parsed.courseId)
      .where("index", "==", parsed.index)
      .get();

    // Check if there's a conflict (another module with same index)
    const conflictingModule = existingModuleQuery.docs.find(
      (doc) => doc.id !== moduleId
    );

    if (conflictingModule) {
      throw Object.assign(
        new Error(
          `Module index ${parsed.index} is already used in this course`
        ),
        { status: 400, code: "duplicate_module_index" }
      );
    }

    // Prepare module data
    const moduleData: Record<string, unknown> = {
      courseId: parsed.courseId,
      index: parsed.index,
      title: parsed.title,
      summary: parsed.summary,
      contentType: parsed.contentType,
      estMinutes: parsed.estMinutes,
      published: coursePublished, // Mirror parent course published status
      ownerUid: user.uid, // Set ownership from parent course
      updatedAt: now,
    };

    // Add content fields based on type
    if (parsed.contentUrl) {
      moduleData.contentUrl = parsed.contentUrl;
    }
    if (parsed.body) {
      moduleData.body = parsed.body;
    }

    // Save module
    await adminDb
      .collection(COL.modules)
      .doc(moduleId)
      .set(moduleData, { merge: isUpdate });

    // Recompute parent course module count
    const moduleCount = await recomputeCourseModuleCount(
      adminDb,
      parsed.courseId
    );

    return Response.json({
      ok: true,
      moduleId,
      moduleCount,
      isUpdate,
    });
  } catch (error) {
    console.error("Module upsert error:", error);
    return jsonError(error);
  }
}
