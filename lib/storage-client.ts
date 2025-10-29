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
  heroImage: 5 * 1024 * 1024, // 5MB for images
  image: 5 * 1024 * 1024, // 5MB for images
  pdf: 10 * 1024 * 1024, // 10MB for PDFs
  video: 200 * 1024 * 1024, // 200MB for videos
  moduleAsset: 200 * 1024 * 1024, // 200MB max for any module asset
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
 * Validate file upload with specific size limits by file type
 */
export function validateFileUpload(
  file: File,
  type: "hero" | "asset"
): { valid: boolean; error?: string } {
  // Determine appropriate max size based on file type
  let maxSize: number;

  if (type === "hero") {
    maxSize = MAX_SIZES.heroImage;
  } else {
    // For assets, use specific limits based on file type
    if (ALLOWED_TYPES.images.some((type) => type === file.type)) {
      maxSize = MAX_SIZES.image; // 5MB for images
    } else if (ALLOWED_TYPES.documents.some((type) => type === file.type)) {
      maxSize = MAX_SIZES.pdf; // 10MB for PDFs
    } else if (ALLOWED_TYPES.videos.some((type) => type === file.type)) {
      maxSize = MAX_SIZES.video; // 200MB for videos
    } else {
      maxSize = MAX_SIZES.moduleAsset; // fallback
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Max size for ${file.type}: ${Math.round(
        maxSize / 1024 / 1024
      )}MB`,
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
