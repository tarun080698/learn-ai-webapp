/**
 * POST /api/admin/upload
 *
 * Admin uploads files to Firebase Storage with progress tracking.
 * Supports hero images for courses and assets for modules.
 *
 * Form data:
 * - file: File to upload
 * - type: "hero" | "asset" - determines storage path and validation
 * - description?: string - optional description for the file
 *
 * Returns signed URL for the uploaded file.
 *
 * curl -X POST http://localhost:3000/api/admin/upload \
 *   -H "Authorization: Bearer $ADMIN_TOKEN" \
 *   -F "file=@hero-image.jpg" \
 *   -F "type=hero"
 */
import { NextRequest } from "next/server";
import { getUserFromRequest, requireAdmin, jsonError } from "@/lib/auth";
import {
  getAdminStorage,
  generateStoragePath,
  validateFileUpload,
} from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    // Verify admin authorization
    const user = await getUserFromRequest(req);
    requireAdmin(user);

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as "hero" | "asset";
    const description = formData.get("description") as string | null;

    if (!file) {
      throw Object.assign(new Error("No file provided"), {
        status: 400,
        code: "no_file",
      });
    }

    if (!type || !["hero", "asset"].includes(type)) {
      throw Object.assign(
        new Error("Invalid type. Must be 'hero' or 'asset'"),
        {
          status: 400,
          code: "invalid_type",
        }
      );
    }

    // Validate file
    const validation = validateFileUpload(file, type);
    if (!validation.valid) {
      throw Object.assign(new Error(validation.error!), {
        status: 400,
        code: "invalid_file",
      });
    }

    // Get storage and generate path
    const storage = getAdminStorage();
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const bucket = bucketName ? storage.bucket(bucketName) : storage.bucket();
    const storagePath = generateStoragePath(type, user.uid, file.name);
    const storageFile = bucket.file(storagePath);

    // Upload file
    const buffer = Buffer.from(await file.arrayBuffer());

    await storageFile.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          uploadedBy: user.uid,
          originalName: file.name,
          type: type,
          description: description || "",
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Make file publicly accessible
    await storageFile.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    console.log(`📁 Uploaded ${type} file: ${storagePath}`);

    return Response.json({
      ok: true,
      url: publicUrl,
      storagePath,
      metadata: {
        originalName: file.name,
        size: file.size,
        type: file.type,
        uploadType: type,
        description: description || null,
      },
    });
  } catch (error) {
    console.error("File upload error:", error);
    return jsonError(error);
  }
}
