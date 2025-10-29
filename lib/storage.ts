/**
 * Firebase Admin Storage utilities - SERVER SIDE ONLY
 * Handles hero images for courses and assets for modules
 */

import { getStorage } from "firebase-admin/storage";
import { adminApp } from "./firebaseAdmin";

/**
 * Get Storage instance
 */
export function getAdminStorage() {
  if (!adminApp) {
    throw new Error("Firebase Admin not initialized");
  }
  return getStorage(adminApp);
}

// Re-export client-safe functions
export {
  generateStoragePath,
  validateFileUpload,
  extractStoragePathFromUrl,
} from "./storage-client";

/**
 * Delete file from storage
 */
export async function deleteStorageFile(filePath: string): Promise<void> {
  try {
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const file = bucket.file(filePath);

    await file.delete();
    console.log(`🗑️ Deleted storage file: ${filePath}`);
  } catch (error) {
    console.error(`Failed to delete storage file: ${filePath}`, error);
    // Don't throw - this is cleanup, main operation should succeed
  }
}
