"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useMutation } from "@tanstack/react-query";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

import type { WizardStepProps } from "../../../../lib/types";
import {
  updateCourse,
  createModule,
  upsertAssignment,
} from "../../../../lib/api/admin";
import { useToast } from "../../../ui/Toast";

export function StepReview({ wizardState, onPrevious }: WizardStepProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [creationStatus, setCreationStatus] = useState<{
    course?: "pending" | "success" | "error";
    modules?: "pending" | "success" | "error";
    assignments?: "pending" | "success" | "error";
  }>({});
  const { addToast } = useToast();

  const courseData = wizardState.courseData;
  const modules = wizardState.modules;
  const assignments = wizardState.assignments;

  const updateCourseMutation = useMutation({
    mutationFn: ({
      courseId,
      data,
    }: {
      courseId: string;
      data: {
        title?: string;
        description?: string;
        durationMinutes?: number;
        level?: "beginner" | "intermediate" | "advanced" | "expert";
        heroImageUrl?: string;
      };
    }) => updateCourse(courseId, data),
    onSuccess: () => {
      setCreationStatus((prev) => ({ ...prev, course: "success" }));
    },
    onError: () => {
      setCreationStatus((prev) => ({ ...prev, course: "error" }));
    },
  });

  const createModuleMutation = useMutation({
    mutationFn: createModule,
    onSuccess: () => {
      setCreationStatus((prev) => ({ ...prev, modules: "success" }));
    },
    onError: () => {
      setCreationStatus((prev) => ({ ...prev, modules: "error" }));
    },
  });

  const upsertAssignmentMutation = useMutation({
    mutationFn: upsertAssignment,
    onSuccess: () => {
      setCreationStatus((prev) => ({ ...prev, assignments: "success" }));
    },
    onError: () => {
      setCreationStatus((prev) => ({ ...prev, assignments: "error" }));
    },
  });

  const handleCreateCourse = async () => {
    // If no courseId exists, create the course first
    if (!wizardState.courseId) {
      if (!wizardState.courseData.title) {
        addToast({
          message: "Please provide a course title to create the course.",
          type: "error",
        });
        return;
      }

      // Create course first
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

        // Update wizard state with the new course ID
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
      await updateCourseMutation.mutateAsync({
        courseId: wizardState.courseId,
        data: {
          title: courseData.title,
          description: courseData.description,
          durationMinutes: Math.round((courseData.durationHours || 1) * 60),
          level: courseData.level,
          heroImageUrl: courseData.heroImageUrl,
        },
      });

      // Step 2: Create/update modules
      if (modules.length > 0) {
        setCreationStatus((prev) => ({ ...prev, modules: "pending" }));

        for (let i = 0; i < modules.length; i++) {
          const moduleData = modules[i];
          if (moduleData.title && moduleData.title.trim()) {
            const contentType = moduleData.contentType || "text";
            await createModuleMutation.mutateAsync({
              courseId: wizardState.courseId,
              index: i, // Add module index/order
              title: moduleData.title,
              summary: moduleData.description || moduleData.title, // Use description as summary, fallback to title
              estMinutes: moduleData.estMinutes || 15, // Ensure estMinutes is provided with default
              contentType: contentType,
              contentUrl: moduleData.contentUrl,
              body: contentType === "text" ? (moduleData.body || "Content to be added.") : moduleData.body,
            });
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
          await upsertAssignmentMutation.mutateAsync({
            scope: { type: "course", courseId: wizardState.courseId },
            timing: "pre",
            questionnaireId: assignments.course.pre.questionnaireId,
            active: assignments.course.pre.active,
          });
        }

        if (assignments.course.post) {
          await upsertAssignmentMutation.mutateAsync({
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
            await upsertAssignmentMutation.mutateAsync({
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
            await upsertAssignmentMutation.mutateAsync({
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

      addToast({ message: "Course created successfully!", type: "success" });

      // Redirect to course management or show success message
      setTimeout(() => {
        window.location.href = "/admin";
      }, 2000);
    } catch (error) {
      console.error("Course creation failed:", error);
      addToast({
        message: "Failed to create course. Please try again.",
        type: "error",
      });
    } finally {
      setIsCreating(false);
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
        return (
          <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
        );
    }
  };

  const getStatusText = (status?: "pending" | "success" | "error") => {
    switch (status) {
      case "pending":
        return "In progress...";
      case "success":
        return "Completed";
      case "error":
        return "Failed";
      default:
        return "Pending";
    }
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-[0_1px_2px_rgba(38,70,83,0.06),0_8px_24px_rgba(38,70,83,0.08)]">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Review & Create Course
        </h2>
        <p className="text-gray-600 text-lg">
          Review your course configuration and create the final course with all
          modules and assessments.
        </p>
      </div>

      <div className="space-y-8">
        {/* Course Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Course Overview
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">
                Basic Information
              </h4>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-500">Title:</dt>
                  <dd className="font-medium">{courseData.title}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Description:</dt>
                  <dd>{courseData.description || "No description"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Duration:</dt>
                  <dd>
                    {courseData.durationHours || 1} hours (
                    {Math.round((courseData.durationHours || 1) * 60)} minutes)
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Level:</dt>
                  <dd className="capitalize">{courseData.level}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Course Image</h4>
              {courseData.heroImageUrl ? (
                <Image
                  src={courseData.heroImageUrl}
                  alt="Course hero"
                  width={128}
                  height={80}
                  className="object-cover rounded-md border border-gray-200"
                />
              ) : (
                <div className="w-32 h-20 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No image</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modules Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Modules ({modules.length})
          </h3>

          {modules.length === 0 ? (
            <p className="text-gray-500">No modules configured</p>
          ) : (
            <div className="space-y-3">
              {modules.map((module, index) => (
                <div
                  key={index}
                  className="border border-gray-100 rounded-md p-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {module.title || `Module ${index + 1}`}
                      </h4>
                      {module.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {module.description}
                        </p>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center space-x-2">
                      {module.contentType && (
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                          {module.contentType}
                        </span>
                      )}
                      {module.estMinutes && (
                        <span className="text-xs text-gray-400">
                          {module.estMinutes} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assessments Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Assessment Gating
          </h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700">Course Level</h4>
              <div className="text-sm text-gray-600 mt-1">
                Pre-assessment: {assignments.course.pre ? "Configured" : "None"}
                <br />
                Post-assessment:{" "}
                {assignments.course.post ? "Configured" : "None"}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700">Module Level</h4>
              <div className="text-sm text-gray-600 mt-1">
                {Object.keys(assignments.modules).length > 0
                  ? `${
                      Object.keys(assignments.modules).length
                    } modules with gating configured`
                  : "No module-level gating"}
              </div>
            </div>
          </div>
        </div>

        {/* Creation Progress */}
        {isCreating && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Creation Progress
            </h3>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(creationStatus.course)}
                <span className="text-sm">Updating course information</span>
                <span className="text-xs text-gray-500">
                  {getStatusText(creationStatus.course)}
                </span>
              </div>

              {modules.length > 0 && (
                <div className="flex items-center space-x-3">
                  {getStatusIcon(creationStatus.modules)}
                  <span className="text-sm">Creating modules</span>
                  <span className="text-xs text-gray-500">
                    {getStatusText(creationStatus.modules)}
                  </span>
                </div>
              )}

              {(assignments.course.pre ||
                assignments.course.post ||
                Object.keys(assignments.modules).length > 0) && (
                <div className="flex items-center space-x-3">
                  {getStatusIcon(creationStatus.assignments)}
                  <span className="text-sm">Setting up assessments</span>
                  <span className="text-xs text-gray-500">
                    {getStatusText(creationStatus.assignments)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={onPrevious}
            disabled={isCreating}
            className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <button
            type="button"
            onClick={handleCreateCourse}
            disabled={isCreating}
            className="px-8 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? "Creating Course..." : "Create Course"}
          </button>
        </div>
      </div>
    </div>
  );
}
