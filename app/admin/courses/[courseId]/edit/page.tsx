"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { updateCourse, archiveCourse } from "@/lib/courses/api";
import {
  formatDurationHrs,
  formatDate,
  getAssetIcon,
  getAssetTypeLabel,
} from "@/lib/courses/formatters";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { useAuth } from "@/app/(auth)/AuthProvider";
import type {
  Course,
  Module,
  Asset,
  Assignment,
  Questionnaire,
} from "@/lib/courses/api";

interface CourseBundle {
  course: Course;
  modules: Module[];
  assets: Asset[];
  assignments: Assignment[];
  questionnaires: Questionnaire[];
}

interface SortableModuleProps {
  module: Module;
  assets: Asset[];
  onUpdateModule: (moduleId: string, updates: Partial<Module>) => void;
  onDeleteModule: (moduleId: string) => void;
  onReorderAssets: (moduleId: string, assetIds: string[]) => void;
}

const SortableModule: React.FC<SortableModuleProps> = ({
  module,
  assets,
  onUpdateModule,
  onDeleteModule,
  onReorderAssets,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: module.id });
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: module.title,
    description: module.description || "",
    estimatedDurationHrs: module.estimatedDurationHrs || 0,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const moduleAssets = assets.filter((asset) => asset.moduleId === module.id);

  const handleSave = () => {
    onUpdateModule(module.id, editData);
    setIsEditing(false);
  };

  const handleAssetReorder = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = moduleAssets.findIndex((asset) => asset.id === active.id);
    const newIndex = moduleAssets.findIndex((asset) => asset.id === over.id);

    const reorderedAssets = arrayMove(moduleAssets, oldIndex, newIndex);
    onReorderAssets(
      module.id,
      reorderedAssets.map((asset) => asset.id)
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card rounded-xl border border-border/50 p-6 mb-4"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab p-2 hover:bg-muted rounded-lg"
          >
            <svg
              className="w-4 h-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={editData.title}
              onChange={(e) =>
                setEditData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="text-lg font-semibold bg-background border border-border rounded px-3 py-1"
            />
          ) : (
            <h3 className="text-lg font-semibold text-foreground">
              {module.title}
            </h3>
          )}
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-primary text-primary-foreground rounded "
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 bg-muted text-muted-foreground rounded "
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 bg-muted text-muted-foreground rounded  hover:bg-muted/80"
              >
                Edit
              </button>
              <button
                onClick={() => onDeleteModule(module.id)}
                className="px-3 py-1 bg-destructive text-destructive-foreground rounded  hover:bg-destructive/80"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <textarea
            value={editData.description}
            onChange={(e) =>
              setEditData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Module description..."
            className="w-full p-3 bg-background border border-border rounded-lg resize-none"
            rows={3}
          />
          <input
            type="number"
            value={editData.estimatedDurationHrs}
            onChange={(e) =>
              setEditData((prev) => ({
                ...prev,
                estimatedDurationHrs: Number(e.target.value),
              }))
            }
            placeholder="Duration (hours)"
            className="w-32 p-2 bg-background border border-border rounded"
            min="0"
            step="0.5"
          />
        </div>
      ) : (
        <>
          {module.description && (
            <p className="text-muted-foreground mb-4">{module.description}</p>
          )}
          <div className=" text-muted-foreground mb-4">
            Duration: {formatDurationHrs(module.estimatedDurationHrs || 0)}
          </div>
        </>
      )}

      {/* Assets */}
      <div className="mt-6">
        <h4 className="font-medium text-foreground mb-3">
          Assets ({moduleAssets.length})
        </h4>
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleAssetReorder}
        >
          <SortableContext
            items={moduleAssets.map((asset) => asset.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {moduleAssets.map((asset) => (
                <SortableAsset key={asset.id} asset={asset} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

interface SortableAssetProps {
  asset: Asset;
}

const SortableAsset: React.FC<SortableAssetProps> = ({ asset }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: asset.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg"
    >
      <div {...attributes} {...listeners} className="cursor-grab p-1">
        <svg
          className="w-3 h-3 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
      </div>
      <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded">
        {getAssetIcon(asset.type)}
      </div>
      <div className="flex-1">
        <div className="font-medium ">{asset.title}</div>
        <div className="text-xs text-muted-foreground">
          {getAssetTypeLabel(asset.type)}
        </div>
      </div>
      {asset.estimatedDurationHrs && (
        <div className="text-xs text-muted-foreground">
          {formatDurationHrs(asset.estimatedDurationHrs)}
        </div>
      )}
    </div>
  );
};

export default function CourseEditPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const authenticatedFetch = useAuthenticatedFetch();
  const { firebaseUser, loading: authLoading } = useAuth();

  const [courseBundle, setCourseBundle] = useState<CourseBundle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setSaving] = useState(false);
  const [isArchiving, setArchiving] = useState(false);

  // Course form state
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    category: "",
    level: "beginner" as "beginner" | "intermediate" | "advanced",
    tags: [] as string[],
    heroImageUrl: "",
    estimatedDurationHrs: 0,
    maxEnrollments: 0,
    isPublished: false,
  });

  const [newTag, setNewTag] = useState("");

  const loadCourseData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load all course data using authenticated API calls
      const [
        coursesResponse,
        modulesResponse,
        assignmentsResponse,
        questionnairesResponse,
      ] = await Promise.all([
        authenticatedFetch(`/api/admin/courses.mine`),
        authenticatedFetch(`/api/admin/modules.mine?courseId=${courseId}`),
        authenticatedFetch(`/api/admin/assignments.mine?courseId=${courseId}`),
        authenticatedFetch(`/api/admin/questionnaires.mine`),
      ]);

      if (
        !coursesResponse.ok ||
        !modulesResponse.ok ||
        !assignmentsResponse.ok ||
        !questionnairesResponse.ok
      ) {
        throw new Error("Failed to load course data");
      }

      const [coursesRes, modulesRes, assignmentsRes, questionnairesRes] =
        await Promise.all([
          coursesResponse.json(),
          modulesResponse.json(),
          assignmentsResponse.json(),
          questionnairesResponse.json(),
        ]);

      // Find the specific course from the courses list
      // Handle both wrapped ({ courses: [...] }) and direct array responses
      const coursesData =
        (coursesRes as { courses?: unknown[] })?.courses || coursesRes;
      const coursesArray = Array.isArray(coursesData) ? coursesData : [];
      const course = coursesArray.find(
        (c: unknown) => (c as { id: string }).id === courseId
      );

      if (!course) {
        throw new Error(`Course with id ${courseId} not found`);
      }

      // Extract modules from the response
      const modulesData =
        (modulesRes as { modules?: unknown[] })?.modules || [];
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
            const mappedAsset = {
              id: asset.id,
              moduleId: moduleItem.id,
              type: asset.kind as "pdf" | "video" | "image" | "link",
              title: asset.title || "",
              url: asset.url,
              order: asset.order,
            };
            assets.push(mappedAsset);
          });
        }
      });

      // Extract other data from wrapped responses
      const assignmentsData =
        (assignmentsRes as { assignments?: unknown[] })?.assignments || [];
      const questionnairesData =
        (questionnairesRes as { questionnaires?: unknown[] })?.questionnaires ||
        [];

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

      const data: CourseBundle = {
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

      setCourseBundle(data);

      // Set form data
      setCourseData({
        title: data.course.title,
        description: data.course.description || "",
        category: data.course.category || "",
        level: data.course.level || "beginner",
        tags: data.course.tags || [],
        heroImageUrl: data.course.heroImageUrl || "",
        estimatedDurationHrs: data.course.estimatedDurationHrs || 0,
        maxEnrollments: data.course.maxEnrollments || 0,
        isPublished: data.course.isPublished || false,
      });
    } catch (err) {
      console.error("Failed to load course:", err);
      setError("Failed to load course data");
    } finally {
      setIsLoading(false);
    }
  }, [courseId, authenticatedFetch]);

  useEffect(() => {
    // Wait for authentication to be ready before loading course data
    if (!authLoading && firebaseUser) {
      loadCourseData();
    } else if (!authLoading && !firebaseUser) {
      setError("User not authenticated");
      setIsLoading(false);
    }
  }, [loadCourseData, authLoading, firebaseUser]);

  const handleSaveCourse = async () => {
    try {
      setSaving(true);

      await updateCourse(courseId, courseData);

      // Reload data to get fresh state
      await loadCourseData();

      // TODO: Show success toast
      console.log("Course updated successfully");
    } catch (err) {
      console.error("Failed to update course:", err);
      // TODO: Show error toast
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveCourse = async () => {
    if (
      !confirm(
        "Are you sure you want to archive this course? This will hide it from students."
      )
    ) {
      return;
    }

    try {
      setArchiving(true);

      await archiveCourse(courseId);

      // Navigate back to courses list
      router.push("/admin");
    } catch (err) {
      console.error("Failed to archive course:", err);
      // TODO: Show error toast
    } finally {
      setArchiving(false);
    }
  };

  const handleUpdateModule = (moduleId: string, updates: Partial<Module>) => {
    if (!courseBundle) return;

    setCourseBundle((prev) => ({
      ...prev!,
      modules: prev!.modules.map((module) =>
        module.id === moduleId ? { ...module, ...updates } : module
      ),
    }));
  };

  const handleDeleteModule = (moduleId: string) => {
    if (!confirm("Are you sure you want to delete this module?")) return;

    if (!courseBundle) return;

    setCourseBundle((prev) => ({
      ...prev!,
      modules: prev!.modules.filter((module) => module.id !== moduleId),
      assets: prev!.assets.filter((asset) => asset.moduleId !== moduleId),
    }));
  };

  const handleModuleReorder = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !courseBundle) return;

    const oldIndex = courseBundle.modules.findIndex(
      (module) => module.id === active.id
    );
    const newIndex = courseBundle.modules.findIndex(
      (module) => module.id === over.id
    );

    setCourseBundle((prev) => ({
      ...prev!,
      modules: arrayMove(prev!.modules, oldIndex, newIndex),
    }));
  };

  const handleAssetReorder = (moduleId: string, assetIds: string[]) => {
    if (!courseBundle) return;

    setCourseBundle((prev) => ({
      ...prev!,
      assets: prev!.assets
        .map((asset) => {
          if (asset.moduleId === moduleId) {
            const newOrder = assetIds.indexOf(asset.id);
            return { ...asset, order: newOrder };
          }
          return asset;
        })
        .sort((a, b) => (a.order || 0) - (b.order || 0)),
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !courseData.tags.includes(newTag.trim())) {
      setCourseData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setCourseData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {authLoading ? "Authenticating..." : "Loading course..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !courseBundle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || "Course not found"}</p>
          <button
            onClick={() => router.push("/admin")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const { course, modules, assets } = courseBundle;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.push("/admin")}
              className="flex items-center text-muted-foreground hover:text-foreground mb-2"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Courses
            </button>
            <h1 className="text-3xl font-bold text-foreground">Edit Course</h1>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleArchiveCourse}
              disabled={isArchiving}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 disabled:opacity-50"
            >
              {isArchiving ? "Archiving..." : "Archive Course"}
            </button>
            <button
              onClick={handleSaveCourse}
              disabled={isSaving}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Details Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <section className="bg-card rounded-xl border border-border/50 p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Course Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block  font-medium text-foreground mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={courseData.title}
                    onChange={(e) =>
                      setCourseData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full p-3 bg-background border border-border rounded-lg"
                    placeholder="Course title..."
                  />
                </div>

                <div>
                  <label className="block  font-medium text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    value={courseData.description}
                    onChange={(e) =>
                      setCourseData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full p-3 bg-background border border-border rounded-lg resize-none"
                    rows={4}
                    placeholder="Course description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block  font-medium text-foreground mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      value={courseData.category}
                      onChange={(e) =>
                        setCourseData((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="w-full p-3 bg-background border border-border rounded-lg"
                      placeholder="e.g. Technology, Business..."
                    />
                  </div>

                  <div>
                    <label className="block  font-medium text-foreground mb-2">
                      Level
                    </label>
                    <select
                      value={courseData.level}
                      onChange={(e) =>
                        setCourseData((prev) => ({
                          ...prev,
                          level: e.target.value as
                            | "beginner"
                            | "intermediate"
                            | "advanced",
                        }))
                      }
                      className="w-full p-3 bg-background border border-border rounded-lg"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block  font-medium text-foreground mb-2">
                      Duration (hours)
                    </label>
                    <input
                      type="number"
                      value={courseData.estimatedDurationHrs}
                      onChange={(e) =>
                        setCourseData((prev) => ({
                          ...prev,
                          estimatedDurationHrs: Number(e.target.value),
                        }))
                      }
                      className="w-full p-3 bg-background border border-border rounded-lg"
                      min="0"
                      step="0.5"
                    />
                  </div>

                  <div>
                    <label className="block  font-medium text-foreground mb-2">
                      Max Enrollments
                    </label>
                    <input
                      type="number"
                      value={courseData.maxEnrollments}
                      onChange={(e) =>
                        setCourseData((prev) => ({
                          ...prev,
                          maxEnrollments: Number(e.target.value),
                        }))
                      }
                      className="w-full p-3 bg-background border border-border rounded-lg"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block  font-medium text-foreground mb-2">
                    Thumbnail URL
                  </label>
                  <input
                    type="url"
                    value={courseData.heroImageUrl}
                    onChange={(e) =>
                      setCourseData((prev) => ({
                        ...prev,
                        heroImageUrl: e.target.value,
                      }))
                    }
                    className="w-full p-3 bg-background border border-border rounded-lg"
                    placeholder="https://..."
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block  font-medium text-foreground mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {courseData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-primary/10 text-primary px-3 py-1 rounded-full  flex items-center"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-primary/60 hover:text-primary"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addTag()}
                      className="flex-1 p-3 bg-background border border-border rounded-lg"
                      placeholder="Add a tag..."
                    />
                    <button
                      onClick={addTag}
                      className="px-4 py-3 bg-primary text-primary-foreground rounded-lg"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={courseData.isPublished}
                    onChange={(e) =>
                      setCourseData((prev) => ({
                        ...prev,
                        isPublished: e.target.checked,
                      }))
                    }
                    className="mr-3"
                  />
                  <label
                    htmlFor="isPublished"
                    className=" font-medium text-foreground"
                  >
                    Published
                  </label>
                </div>
              </div>
            </section>

            {/* Modules */}
            <section className="bg-card rounded-xl border border-border/50 p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Modules ({modules.length})
              </h2>

              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleModuleReorder}
              >
                <SortableContext
                  items={modules.map((module) => module.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {modules.map((module) => (
                      <SortableModule
                        key={module.id}
                        module={module}
                        assets={assets}
                        onUpdateModule={handleUpdateModule}
                        onDeleteModule={handleDeleteModule}
                        onReorderAssets={handleAssetReorder}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Thumbnail Preview */}
            <section className="bg-card rounded-xl border border-border/50 p-6">
              <h3 className="font-semibold text-foreground mb-3">
                Thumbnail Preview
              </h3>
              {courseData.heroImageUrl ? (
                <div className="relative h-32 rounded-lg overflow-hidden">
                  <Image
                    src={courseData.heroImageUrl}
                    alt="Course thumbnail"
                    fill
                    sizes="300px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground ">No thumbnail</span>
                </div>
              )}
            </section>

            {/* Stats */}
            <section className="bg-card rounded-xl border border-border/50 p-6">
              <h3 className="font-semibold text-foreground mb-3">
                Course Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modules</span>
                  <span className="font-medium">{modules.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assets</span>
                  <span className="font-medium">{assets.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Duration</span>
                  <span className="font-medium">
                    {formatDurationHrs(
                      modules.reduce(
                        (acc, mod) => acc + (mod.estimatedDurationHrs || 0),
                        0
                      )
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span
                    className={`font-medium ${
                      course.isPublished ? "text-green-600" : "text-yellow-600"
                    }`}
                  >
                    {course.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">
                    {formatDate(course.createdAt)}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
