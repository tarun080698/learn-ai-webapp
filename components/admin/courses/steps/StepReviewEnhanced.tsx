"use client";

import React, { useState } from "react";
import Image from "next/image";

import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  PlayIcon,
  PhotoIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import MDEditor from "@uiw/react-md-editor";

import type { WizardStepProps } from "../../../../lib/types";
import {
  updateCourse,
  createModule,
  upsertAssignment,
} from "../../../../lib/api/admin";

export function StepReview({
  wizardState,
  onPrevious,
  onComplete,
}: WizardStepProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [creationStatus, setCreationStatus] = useState<{
    course?: "pending" | "success" | "error";
    modules?: "pending" | "success" | "error";
    assets?: "pending" | "success" | "error";
    assignments?: "pending" | "success" | "error";
  }>({});
  const [expandedSections, setExpandedSections] = useState<{
    course: boolean;
    modules: boolean;
    assignments: boolean;
  }>({
    course: true,
    modules: true,
    assignments: true,
  });

  // Fallback toast function if useToast is not available
  const addToast = ({
    message,
    type,
  }: {
    message: string;
    type: "success" | "error" | "info";
  }) => {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // You can replace this with your preferred notification system
    if (type === "error") {
      alert(`Error: ${message}`);
    }
  };

  const courseData = wizardState.courseData;
  const modules = wizardState.modules;
  const assignments = wizardState.assignments;

  // Direct API call functions (replacing useMutation)
  const updateCourseAsync = async (
    courseId: string,
    data: {
      title?: string;
      description?: string;
      durationMinutes?: number;
      level?: "beginner" | "intermediate" | "advanced";
      heroImageUrl?: string;
    }
  ) => {
    try {
      const result = await updateCourse(courseId, data);
      setCreationStatus((prev) => ({ ...prev, course: "success" }));
      return result;
    } catch (error) {
      setCreationStatus((prev) => ({ ...prev, course: "error" }));
      throw error;
    }
  };

  const createModuleAsync = async (
    data: Parameters<typeof createModule>[0]
  ) => {
    try {
      const result = await createModule(data);
      setCreationStatus((prev) => ({ ...prev, modules: "success" }));
      return result;
    } catch (error) {
      setCreationStatus((prev) => ({ ...prev, modules: "error" }));
      throw error;
    }
  };

  const upsertAssignmentAsync = async (
    data: Parameters<typeof upsertAssignment>[0]
  ) => {
    try {
      const result = await upsertAssignment(data);
      setCreationStatus((prev) => ({ ...prev, assignments: "success" }));
      return result;
    } catch (error) {
      setCreationStatus((prev) => ({ ...prev, assignments: "error" }));
      throw error;
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <DocumentTextIcon className="h-4 w-4" />;
      case "video":
        return <PlayIcon className="h-4 w-4" />;
      case "image":
        return <PhotoIcon className="h-4 w-4" />;
      case "link":
        return <LinkIcon className="h-4 w-4" />;
      default:
        return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status?: "pending" | "success" | "error") => {
    switch (status) {
      case "pending":
        return <ArrowPathIcon className="h-5 w-5 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "error":
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const handleCreateCourse = async () => {
    console.log("=== COURSE CREATION DEBUG ===");
    console.log("Wizard State:", wizardState);
    console.log("Course Data:", courseData);
    console.log("Modules:", modules);
    console.log("Assignments:", assignments);

    // If no courseId exists, create the course first
    if (!wizardState.courseId) {
      if (!wizardState.courseData.title) {
        addToast({
          message: "Please provide a course title to create the course.",
          type: "error",
        });
        return;
      }

      try {
        setIsCreating(true);
        setCreationStatus({ course: "pending" });

        const { createCourse } = await import("../../../../lib/api/admin");
        const result = await createCourse({
          title: wizardState.courseData.title,
          description: wizardState.courseData.description || "",
          durationMinutes: Math.round(
            (wizardState.courseData.durationHours || 1) * 60
          ),
          level: wizardState.courseData.level || "beginner",
          heroImageUrl: wizardState.courseData.heroImageUrl,
        });

        if (!result.id) {
          throw new Error("Course ID not returned from server");
        }

        wizardState.courseId = result.id;
        setCreationStatus({ course: "success" });

        addToast({
          message:
            "Course created successfully! Continuing with modules and assignments...",
          type: "success",
        });
      } catch (error) {
        console.error("Failed to create course:", error);
        setCreationStatus({ course: "error" });
        addToast({
          message:
            error instanceof Error ? error.message : "Failed to create course",
          type: "error",
        });
        setIsCreating(false);
        return;
      }
    }

    setIsCreating(true);
    setCreationStatus({});

    try {
      // Step 1: Update course with final data
      setCreationStatus((prev) => ({ ...prev, course: "pending" }));
      await updateCourseAsync(wizardState.courseId, {
        title: courseData.title,
        description: courseData.description,
        durationMinutes: Math.round((courseData.durationHours || 1) * 60),
        level: courseData.level as "beginner" | "intermediate" | "advanced",
        heroImageUrl: courseData.heroImageUrl,
      });

      // Step 2: Create/update modules with assets
      if (modules.length > 0) {
        setCreationStatus((prev) => ({ ...prev, modules: "pending" }));

        for (let i = 0; i < modules.length; i++) {
          const moduleData = modules[i];
          if (moduleData.title && moduleData.title.trim()) {
            // Create module
            const modulePayload = {
              courseId: wizardState.courseId,
              index: i,
              title: moduleData.title,
              summary: moduleData.description || moduleData.title,
              estMinutes: moduleData.estMinutes || 15,
              contentType: "text" as const,
              body: moduleData.body || "Content to be added.",
            };

            console.log("Creating module with payload:", modulePayload);
            console.log("Module data body:", moduleData.body);

            const moduleResult = await createModuleAsync(modulePayload);

            // Create assets for this module
            if (moduleData.assets && moduleData.assets.length > 0) {
              setCreationStatus((prev) => ({ ...prev, assets: "pending" }));

              const { addAsset } = await import("../../../../lib/api/admin");
              for (const asset of moduleData.assets) {
                if (asset.title && asset.url) {
                  console.log("Adding asset:", {
                    moduleId: moduleResult.moduleId,
                    type: asset.type,
                    title: asset.title,
                    description: asset.body || asset.title,
                    url: asset.url,
                  });

                  await addAsset({
                    moduleId: moduleResult.moduleId,
                    type: asset.type,
                    title: asset.title,
                    description: asset.body || asset.title,
                    url: asset.url,
                  });
                }
              }
              setCreationStatus((prev) => ({ ...prev, assets: "success" }));
            }
          }
        }
        setCreationStatus((prev) => ({ ...prev, modules: "success" }));
      }

      // Step 3: Create assignments
      const hasAssignments =
        assignments.course.pre ||
        assignments.course.post ||
        Object.keys(assignments.modules).length > 0;

      if (hasAssignments) {
        setCreationStatus((prev) => ({ ...prev, assignments: "pending" }));

        // Course-level assignments
        if (assignments.course.pre) {
          await upsertAssignmentAsync({
            scope: { type: "course", courseId: wizardState.courseId },
            timing: "pre",
            questionnaireId: assignments.course.pre.questionnaireId,
            active: assignments.course.pre.active,
          });
        }

        if (assignments.course.post) {
          await upsertAssignmentAsync({
            scope: { type: "course", courseId: wizardState.courseId },
            timing: "post",
            questionnaireId: assignments.course.post.questionnaireId,
            active: assignments.course.post.active,
          });
        }

        // Module-level assignments
        for (const [moduleId, moduleAssignments] of Object.entries(
          assignments.modules
        )) {
          if (moduleAssignments.pre) {
            await upsertAssignmentAsync({
              scope: {
                type: "module",
                courseId: wizardState.courseId,
                moduleId,
              },
              timing: "pre",
              questionnaireId: moduleAssignments.pre.questionnaireId,
              active: moduleAssignments.pre.active,
            });
          }

          if (moduleAssignments.post) {
            await upsertAssignmentAsync({
              scope: {
                type: "module",
                courseId: wizardState.courseId,
                moduleId,
              },
              timing: "post",
              questionnaireId: moduleAssignments.post.questionnaireId,
              active: moduleAssignments.post.active,
            });
          }
        }
        setCreationStatus((prev) => ({ ...prev, assignments: "success" }));
      }

      // Success!
      addToast({
        message:
          "Course created successfully with all modules and assessments!",
        type: "success",
      });

      // Call completion callback to trigger navigation
      if (onComplete && wizardState.courseId) {
        const courseId = wizardState.courseId;
        setTimeout(() => {
          onComplete({
            courseId,
            isUpdate: Boolean(courseId),
          });
        }, 1000); // Small delay to show success message
      }
    } catch (error) {
      console.error("Failed to create course:", error);
      addToast({
        message:
          error instanceof Error ? error.message : "Failed to create course",
        type: "error",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const totalAssets = modules.reduce(
    (total, module) => total + (module.assets?.length || 0),
    0
  );
  const totalAssignments =
    (assignments.course.pre ? 1 : 0) +
    (assignments.course.post ? 1 : 0) +
    Object.values(assignments.modules).reduce(
      (total, moduleAssignments) =>
        total +
        (moduleAssignments.pre ? 1 : 0) +
        (moduleAssignments.post ? 1 : 0),
      0
    );

  return (
    <div className="bg-white rounded-2xl p-8 shadow-[0_1px_2px_rgba(38,70,83,0.06),0_8px_24px_rgba(38,70,83,0.08)]">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Review & Create Course
        </h2>
        <p className="text-gray-600 text-lg">
          Review your course details, modules, and assessments before creating
          your course.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-900">
            {modules.length}
          </div>
          <div className=" text-blue-700">Modules</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-900">{totalAssets}</div>
          <div className=" text-green-700">Assets</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-900">
            {totalAssignments}
          </div>
          <div className=" text-purple-700">Assessments</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-amber-900">
            {Math.round((courseData.durationHours || 1) * 60)}
          </div>
          <div className=" text-amber-700">Minutes</div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Course Details */}
        <div className="border border-gray-200 rounded-lg">
          <div
            className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 rounded-t-lg"
            onClick={() => toggleSection("course")}
          >
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Course Details
              </h3>
              {getStatusIcon(creationStatus.course)}
            </div>
            <button className="text-gray-500 hover:text-gray-700">
              {expandedSections.course ? "−" : "+"}
            </button>
          </div>

          {expandedSections.course && (
            <div className="p-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Basic Information
                  </h4>
                  <dl className="space-y-2 ">
                    <div>
                      <dt className="font-medium text-gray-700">Title:</dt>
                      <dd className="text-gray-900">
                        {courseData.title || "Untitled Course"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-700">
                        Description:
                      </dt>
                      <dd className="text-gray-900">
                        {courseData.description || "No description provided"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-700">Level:</dt>
                      <dd className="text-gray-900 capitalize">
                        {courseData.level || "beginner"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-700">Duration:</dt>
                      <dd className="text-gray-900">
                        {courseData.durationHours || 1} hours
                      </dd>
                    </div>
                  </dl>
                </div>

                {courseData.heroImageUrl && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Hero Image
                    </h4>
                    <div className="relative w-32 h-20 rounded-md overflow-hidden bg-gray-100">
                      <Image
                        src={courseData.heroImageUrl}
                        alt="Course hero image"
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modules */}
        <div className="border border-gray-200 rounded-lg">
          <div
            className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 rounded-t-lg"
            onClick={() => toggleSection("modules")}
          >
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Modules ({modules.length})
              </h3>
              {getStatusIcon(creationStatus.modules)}
            </div>
            <button className="text-gray-500 hover:text-gray-700">
              {expandedSections.modules ? "−" : "+"}
            </button>
          </div>

          {expandedSections.modules && (
            <div className="p-4 border-t border-gray-200">
              {modules.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No modules created
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Debug info */}
                  {process.env.NODE_ENV === "development" && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                      <div className="text-xs font-mono text-gray-600">
                        <strong>Debug - Modules Data:</strong>
                        <pre className="mt-1 max-h-32 overflow-auto text-xs">
                          {JSON.stringify(modules, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                  {modules.map((module, index) => (
                    <div
                      key={index}
                      className="border border-gray-100 rounded-lg p-4"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center  font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {module.title || `Module ${index + 1}`}
                          </h4>
                          {module.description && (
                            <p className=" text-gray-600 mb-2">
                              {module.description}
                            </p>
                          )}

                          {/* Show estimated minutes */}
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                            <span>📚 {module.estMinutes || 15} minutes</span>
                            <span>📄 {module.contentType || "text"}</span>
                            {module.assets && module.assets.length > 0 && (
                              <span>📎 {module.assets.length} assets</span>
                            )}
                          </div>

                          {module.body && (
                            <div className="mb-3">
                              <div className="text-xs font-medium text-gray-700 mb-1">
                                Content Preview:
                              </div>
                              <div className="bg-gray-50 rounded-md p-2  max-h-20 overflow-hidden">
                                <MDEditor.Markdown
                                  source={
                                    module.body.slice(0, 200) +
                                    (module.body.length > 200 ? "..." : "")
                                  }
                                  style={{ fontSize: "0.875rem" }}
                                />
                              </div>
                            </div>
                          )}

                          {module.assets && module.assets.length > 0 && (
                            <div>
                              <div className="text-xs font-medium text-gray-700 mb-2">
                                Assets ({module.assets.length}):
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {module.assets.map((asset, assetIndex) => (
                                  <div
                                    key={assetIndex}
                                    className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded text-xs"
                                  >
                                    {getAssetIcon(asset.type)}
                                    <span className="text-gray-700">
                                      {asset.title || "Untitled"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Assignments */}
        <div className="border border-gray-200 rounded-lg">
          <div
            className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 rounded-t-lg"
            onClick={() => toggleSection("assignments")}
          >
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Assessments ({totalAssignments})
              </h3>
              {getStatusIcon(creationStatus.assignments)}
            </div>
            <button className="text-gray-500 hover:text-gray-700">
              {expandedSections.assignments ? "−" : "+"}
            </button>
          </div>

          {expandedSections.assignments && (
            <div className="p-4 border-t border-gray-200">
              {totalAssignments === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No assessments configured
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Course-level assignments */}
                  {(assignments.course.pre || assignments.course.post) && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Course-Level
                      </h4>
                      <div className="space-y-2">
                        {assignments.course.pre && (
                          <div className=" text-gray-600">
                            • Pre-course assessment assigned
                          </div>
                        )}
                        {assignments.course.post && (
                          <div className=" text-gray-600">
                            • Post-course assessment assigned
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Module-level assignments */}
                  {Object.keys(assignments.modules).length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Module-Level
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(assignments.modules).map(
                          ([moduleId, moduleAssignments]) => {
                            const moduleData = modules.find(
                              (m) => m.id === moduleId
                            );
                            const moduleTitle =
                              moduleData?.title || "Unknown Module";

                            return (
                              <div key={moduleId} className=" text-gray-600">
                                <strong>{moduleTitle}:</strong>
                                {moduleAssignments.pre &&
                                  " Pre-module assessment"}
                                {moduleAssignments.pre &&
                                  moduleAssignments.post &&
                                  ", "}
                                {moduleAssignments.post &&
                                  " Post-module assessment"}
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-8 border-t border-gray-200">
        <button
          type="button"
          onClick={onPrevious}
          disabled={isCreating}
          className="px-6 py-3 border border-gray-300 rounded-md shadow-sm  font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={handleCreateCourse}
          disabled={isCreating || !courseData.title}
          className="px-8 py-3 border border-transparent rounded-md shadow-sm  font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          {isCreating ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              <span>Creating Course...</span>
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-4 w-4" />
              <span>Create Course</span>
            </>
          )}
        </button>
      </div>

      {/* Creation Progress */}
      {isCreating && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className=" font-medium text-blue-900 mb-3">Creation Progress</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between ">
              <span>Course setup</span>
              {getStatusIcon(creationStatus.course) || (
                <div className="w-5 h-5" />
              )}
            </div>
            <div className="flex items-center justify-between ">
              <span>Modules & content</span>
              {getStatusIcon(creationStatus.modules) || (
                <div className="w-5 h-5" />
              )}
            </div>
            {totalAssets > 0 && (
              <div className="flex items-center justify-between ">
                <span>Assets</span>
                {getStatusIcon(creationStatus.assets) || (
                  <div className="w-5 h-5" />
                )}
              </div>
            )}
            {totalAssignments > 0 && (
              <div className="flex items-center justify-between ">
                <span>Assessments</span>
                {getStatusIcon(creationStatus.assignments) || (
                  <div className="w-5 h-5" />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
