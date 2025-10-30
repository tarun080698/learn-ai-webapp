export type Course = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  level?: "beginner" | "intermediate" | "advanced";
  estimatedDurationHrs?: number;
  maxEnrollments?: number;
  heroImageUrl?: string; // Fixed: use consistent field name
  isPublished?: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type Module = {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  estimatedDurationHrs?: number;
};

export type AssetType = "pdf" | "video" | "image" | "link";

export type Asset = {
  id: string;
  moduleId: string;
  type: AssetType;
  title: string;
  description?: string;
  url: string;
  order?: number;
  estimatedDurationHrs?: number;
};

export type AssignmentScope = "course" | "module";
export type AssignmentTiming = "pre" | "post";

export type Assignment = {
  id: string;
  courseId: string;
  scope: AssignmentScope;
  timing: AssignmentTiming;
  moduleId?: string;
  questionnaireId: string;
  active: boolean;
};

export type Questionnaire = {
  id: string;
  name: string;
  questionCount?: number;
  durationMinutes?: number;
  passScorePercent?: number;
};

async function fetchJSON(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return await response.json();
}

export async function getCourseBundle(courseId: string): Promise<{
  course: Course;
  modules: Module[];
  assets: Asset[];
  assignments: Assignment[];
  questionnaires: Questionnaire[];
}> {
  try {
    // Fetch course data using existing endpoints
    const [
      coursesResponse,
      modulesResponse,
      assignmentsResponse,
      questionnairesResponse,
    ] = await Promise.all([
      fetchJSON(`/api/admin/courses.mine`),
      fetchJSON(`/api/admin/modules.mine?courseId=${courseId}`),
      fetchJSON(`/api/admin/assignments.mine?courseId=${courseId}`),
      fetchJSON(`/api/admin/questionnaires.mine`),
    ]);

    // Find the specific course from the courses list (courses.mine returns wrapped response)
    const coursesData =
      (coursesResponse as { courses?: unknown[] })?.courses || [];
    const coursesArray = Array.isArray(coursesData) ? coursesData : [];
    const course = coursesArray.find(
      (c: unknown) => (c as { id: string }).id === courseId
    );
    if (!course) {
      throw new Error(`Course with id ${courseId} not found`);
    }

    // Extract modules from the response (modules response is wrapped)
    const modulesData =
      (modulesResponse as { modules?: unknown[] })?.modules || [];
    const modulesArray = Array.isArray(modulesData) ? modulesData : [];
    const assets: Asset[] = [];

    // Extract assets from modules
    modulesArray.forEach((moduleData: unknown) => {
      const moduleItem = moduleData as {
        id: string;
        assets?: {
          id: string;
          kind: string;
          url: string;
          title?: string;
          order: number;
        }[];
      };
      if (moduleItem.assets && Array.isArray(moduleItem.assets)) {
        moduleItem.assets.forEach((asset) => {
          assets.push({
            id: asset.id,
            moduleId: moduleItem.id,
            type: asset.kind as AssetType,
            title: asset.title || "",
            url: asset.url,
            order: asset.order,
          });
        });
      }
    });

    // Normalize tags string → array for course
    const typedCourse = course as Course & { tags?: string | string[] };
    typedCourse.tags = Array.isArray(typedCourse.tags)
      ? typedCourse.tags
      : typedCourse.tags
      ? String(typedCourse.tags)
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];

    // Extract other data from wrapped responses
    const assignmentsData =
      (assignmentsResponse as { assignments?: unknown[] })?.assignments || [];
    const questionnairesData =
      (questionnairesResponse as { questionnaires?: unknown[] })
        ?.questionnaires || [];

    // Transform the API response to match our expected interface
    return {
      course: typedCourse as Course,
      modules: modulesArray as Module[],
      assets: assets,
      assignments: (Array.isArray(assignmentsData)
        ? assignmentsData
        : []) as Assignment[],
      questionnaires: (Array.isArray(questionnairesData)
        ? questionnairesData
        : []) as Questionnaire[],
    };
  } catch (error) {
    console.error("Error fetching course bundle:", error);
    throw error;
  }
}

export async function publishCourse(
  courseId: string
): Promise<{ success: boolean; message?: string }> {
  const response = await fetch("/api/admin/course.publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: courseId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to publish course");
  }

  return await response.json();
}

export async function updateCourse(
  courseId: string,
  updates: Partial<Course>
): Promise<Course> {
  const response = await fetch("/api/admin/course.update", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: courseId, ...updates }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update course");
  }

  return await response.json();
}

export async function updateModule(
  moduleId: string,
  updates: Partial<Module>
): Promise<Module> {
  const response = await fetch("/api/admin/module.update", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: moduleId, ...updates }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update module");
  }

  return await response.json();
}

export async function reorderModules(
  courseId: string,
  moduleOrder: string[]
): Promise<{ success: boolean }> {
  const response = await fetch("/api/admin/modules.reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ courseId, moduleOrder }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to reorder modules");
  }

  return await response.json();
}

export async function reorderAssets(
  moduleId: string,
  assetOrder: string[]
): Promise<{ success: boolean }> {
  const response = await fetch("/api/admin/assets.reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ moduleId, assetOrder }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to reorder assets");
  }

  return await response.json();
}

export async function createAsset(
  moduleId: string,
  assetData: Omit<Asset, "id" | "moduleId" | "order">
): Promise<Asset> {
  const response = await fetch("/api/admin/asset.create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ moduleId, ...assetData }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create asset");
  }

  return await response.json();
}

export async function archiveCourse(courseId: string): Promise<void> {
  const response = await fetch("/api/admin/course.archive", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ courseId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to archive course");
  }
}
