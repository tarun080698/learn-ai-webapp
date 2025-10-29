/**
 * Client-safe storage constants and utilities
 * These can be imported in client components
 */

// Storage bucket paths
export const STORAGE_PATHS = {
  courses: {
    heroes: "courses/heroes", // Course hero images
  },
  modules: {
    assets: "modules/assets", // Module content assets
  },
} as const;

// Allowed file types
export const ALLOWED_TYPES = {
  images: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  documents: ["application/pdf"],
  videos: ["video/mp4", "video/webm"],
} as const;

// Max file sizes in bytes
export const MAX_SIZES = {
  heroImage: 5 * 1024 * 1024, // 5MB
  moduleAsset: 50 * 1024 * 1024, // 50MB
} as const;

/**
 * Generate a unique file path for storage
 */
export function generateStoragePath(
  type: "hero" | "asset",
  ownerUid: string,
  fileName: string
): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

  if (type === "hero") {
    return `${STORAGE_PATHS.courses.heroes}/${ownerUid}/${timestamp}_${sanitizedFileName}`;
  } else {
    return `${STORAGE_PATHS.modules.assets}/${ownerUid}/${timestamp}_${sanitizedFileName}`;
  }
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  type: "hero" | "asset"
): { valid: boolean; error?: string } {
  const maxSize = type === "hero" ? MAX_SIZES.heroImage : MAX_SIZES.moduleAsset;

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Max size: ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  const allowedTypes =
    type === "hero"
      ? ALLOWED_TYPES.images
      : [
          ...ALLOWED_TYPES.images,
          ...ALLOWED_TYPES.documents,
          ...ALLOWED_TYPES.videos,
        ];

  if (!allowedTypes.some((allowedType) => allowedType === file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Extract storage path from public URL
 */
export function extractStoragePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // Handle Firebase Storage URLs
    if (urlObj.hostname.includes("firebasestorage.googleapis.com")) {
      const pathMatch = url.match(/\/o\/(.+?)\?/);
      if (pathMatch) {
        return decodeURIComponent(pathMatch[1]);
      }
    }

    return null;
  } catch {
    return null;
  }
}
