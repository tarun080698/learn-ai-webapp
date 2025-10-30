import { createAuthHeaders } from "@/lib/clientAuth";
import type {
  CourseUpsertResponse,
  ModuleUpsertResponse,
  AssetAddResponse,
  QuestionnairesResponse,
  UploadResponse,
  GenericResponse,
  AssignmentUpsertInput,
} from "@/lib/types";

// Course API calls
export async function createCourse(data: {
  title: string;
  description?: string;
  durationMinutes: number;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  heroImageUrl?: string;
}): Promise<CourseUpsertResponse> {
  const headers = await createAuthHeaders();

  const response = await fetch("/api/admin/course.upsert", {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...data,
      published: false, // Always create as draft
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create course");
  }

  return response.json();
}

export async function updateCourse(
  courseId: string,
  data: {
    title?: string;
    description?: string;
    durationMinutes?: number;
    level?: "beginner" | "intermediate" | "advanced" | "expert";
    heroImageUrl?: string;
  }
): Promise<CourseUpsertResponse> {
  const headers = await createAuthHeaders();

  const response = await fetch("/api/admin/course.upsert", {
    method: "POST",
    headers,
    body: JSON.stringify({
      courseId,
      ...data,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update course");
  }

  return response.json();
}

// Module API calls
export async function createModule(data: {
  courseId: string;
  index: number;
  title: string;
  summary: string;
  estMinutes: number;
  contentType?: "video" | "text" | "pdf" | "image" | "link";
  contentUrl?: string;
  body?: string;
}): Promise<ModuleUpsertResponse> {
  const headers = await createAuthHeaders();

  const response = await fetch("/api/admin/module.upsert", {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create module");
  }

  return response.json();
}

export async function updateModule(
  moduleId: string,
  data: {
    title?: string;
    description?: string;
    estMinutes?: number;
    contentType?: "video" | "text" | "pdf" | "image" | "link";
    contentUrl?: string;
    body?: string;
  }
): Promise<ModuleUpsertResponse> {
  const headers = await createAuthHeaders();

  const response = await fetch("/api/admin/module.upsert", {
    method: "POST",
    headers,
    body: JSON.stringify({
      moduleId,
      ...data,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update module");
  }

  return response.json();
}

export async function reorderModules(
  courseId: string,
  orderedIds: string[]
): Promise<GenericResponse> {
  const headers = await createAuthHeaders();

  const response = await fetch("/api/admin/modules.reorder", {
    method: "POST",
    headers,
    body: JSON.stringify({
      courseId,
      orderedIds,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to reorder modules");
  }

  return response.json();
}

// Asset API calls
export async function addAsset(data: {
  moduleId: string;
  type: "pdf" | "video" | "image" | "link";
  title: string;
  description?: string;
  url: string;
}): Promise<AssetAddResponse> {
  const headers = await createAuthHeaders();

  const response = await fetch("/api/admin/asset.add", {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to add asset");
  }

  return response.json();
}

export async function removeAsset(assetId: string): Promise<GenericResponse> {
  const headers = await createAuthHeaders();

  const response = await fetch("/api/admin/asset.remove", {
    method: "POST",
    headers,
    body: JSON.stringify({ id: assetId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to remove asset");
  }

  return response.json();
}

export async function reorderAssets(
  moduleId: string,
  orderedIds: string[]
): Promise<GenericResponse> {
  const headers = await createAuthHeaders();

  const response = await fetch("/api/admin/asset.reorder", {
    method: "POST",
    headers,
    body: JSON.stringify({
      moduleId,
      orderedIds,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to reorder assets");
  }

  return response.json();
}

// Assignment API calls
export async function upsertAssignment(
  data: AssignmentUpsertInput
): Promise<{ id: string }> {
  const headers = await createAuthHeaders();

  const response = await fetch("/api/admin/assignment.upsert", {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to upsert assignment");
  }

  return response.json();
}

// Questionnaire API calls
export async function getQuestionnaires(): Promise<QuestionnairesResponse> {
  const headers = await createAuthHeaders();

  const response = await fetch("/api/admin/questionnaires", {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch questionnaires");
  }

  return response.json();
}

// Upload API calls
export async function uploadFile(
  file: File,
  type: "hero" | "asset"
): Promise<UploadResponse> {
  const token = await (await import("@/lib/clientAuth")).getIdToken();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  const response = await fetch("/api/admin/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to upload file");
  }

  return response.json();
}

// Admin audit logging helper for client-side
export async function logAdminActionClient(action: {
  action: string;
  resourceType: "course" | "module" | "asset" | "questionnaire" | "assignment";
  resourceId: string;
  meta?: Record<string, unknown>;
}) {
  try {
    // This would be called after successful mutations
    // We'll implement this if we need client-side audit logging
    console.log("Admin action:", action);
  } catch (error) {
    console.error("Failed to log admin action:", error);
    // Don't throw - audit logging failure shouldn't break the operation
  }
}
