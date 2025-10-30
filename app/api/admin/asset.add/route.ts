import { NextRequest } from "next/server";
import { getUserFromRequest, requireAdmin, jsonError } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { zAssetAdd } from "@/lib/schemas";
import { addAssetToModule, COL } from "@/lib/firestore";

/*
DEV TESTING:
curl -X POST http://localhost:3000/api/admin/asset.add \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "moduleId": "module-123",
    "asset": {
      "kind": "pdf",
      "url": "https://example.com/document.pdf",
      "title": "Course Materials",
      "meta": {"pages": 10, "size": "2MB"}
    }
  }'
*/

export async function POST(req: NextRequest) {
  try {
    // Verify admin authorization
    const user = await getUserFromRequest(req);
    requireAdmin(user);

    // Parse and validate request body
    const body = await req.json();
    const parsed = zAssetAdd.parse(body);

    if (!adminDb) {
      throw Object.assign(new Error("Firebase Admin not initialized"), {
        status: 500,
      });
    }

    // Verify module exists and check ownership through parent course
    const moduleDoc = await adminDb
      .collection(COL.modules)
      .doc(parsed.moduleId)
      .get();
    if (!moduleDoc.exists) {
      throw Object.assign(new Error("Module not found"), {
        status: 404,
        code: "module_not_found",
      });
    }

    const moduleData = moduleDoc.data();
    if (!moduleData?.courseId) {
      throw Object.assign(new Error("Module has no associated course"), {
        status: 400,
        code: "module_no_course",
      });
    }

    // Check course ownership (modules inherit ownership from course)
    const courseDoc = await adminDb
      .collection(COL.courses)
      .doc(moduleData.courseId)
      .get();
    if (!courseDoc.exists) {
      throw Object.assign(new Error("Parent course not found"), {
        status: 404,
        code: "course_not_found",
      });
    }

    const courseData = courseDoc.data();
    if (courseData?.ownerUid !== user.uid) {
      throw Object.assign(
        new Error("Access denied: You don't own the parent course"),
        {
          status: 403,
          code: "course_access_denied",
        }
      );
    }

    // Add asset to module
    const assetId = await addAssetToModule(adminDb, parsed.moduleId, {
      kind: parsed.type,
      url: parsed.url,
      title: parsed.title,
      meta: parsed.description ? { description: parsed.description } : {},
    });

    return Response.json({
      ok: true,
      moduleId: parsed.moduleId,
      assetId,
      courseId: moduleData.courseId,
      message: "Asset added successfully",
    });
  } catch (error) {
    console.error("Asset add error:", error);
    return jsonError(error);
  }
}
