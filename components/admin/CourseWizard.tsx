/**
 * CourseWizard component
 * Multi-step course creation and management interface for admins
 */
"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FileUpload } from "@/components/FileUpload";
import { type UploadResult } from "@/hooks/useFileUpload";
import { useAuthenticatedMutation } from "@/hooks/useAuthenticatedFetch";

// Types for the wizard steps
export interface CourseFormData {
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  durationMinutes: number;
  heroImageUrl?: string;
}

export interface CourseWizardProps {
  mode: "create" | "edit";
  initialData?: Partial<CourseFormData> & { courseId?: string };
  onComplete?: (result: { courseId: string; isUpdate: boolean }) => void;
  onCancel?: () => void;
}

const STEPS = [
  {
    id: "details",
    title: "Course Details",
    description: "Basic information about your course",
  },
  {
    id: "hero",
    title: "Hero Image",
    description: "Upload an eye-catching cover image",
  },
  {
    id: "review",
    title: "Review",
    description: "Confirm and create your course",
  },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export function CourseWizard({
  mode,
  initialData,
  onComplete,
  onCancel,
}: CourseWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<StepId>("details");
  const [formData, setFormData] = useState<CourseFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    level: initialData?.level || "beginner",
    durationMinutes: initialData?.durationMinutes || 60,
    heroImageUrl: initialData?.heroImageUrl,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const {
    mutate: saveCourse,
    loading: isSubmitting,
    error: submitError,
  } = useAuthenticatedMutation();

  // Form validation
  const validateStep = useCallback(
    (step: StepId): boolean => {
      const newErrors: Record<string, string> = {};

      if (step === "details") {
        if (!formData.title.trim()) {
          newErrors.title = "Course title is required";
        } else if (formData.title.length < 5) {
          newErrors.title = "Title must be at least 5 characters";
        }

        if (!formData.description.trim()) {
          newErrors.description = "Course description is required";
        } else if (formData.description.length < 20) {
          newErrors.description = "Description must be at least 20 characters";
        }

        if (formData.durationMinutes < 5) {
          newErrors.durationMinutes = "Duration must be at least 5 minutes";
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData]
  );

  // Navigation between steps
  const goToStep = useCallback(
    (step: StepId) => {
      const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
      const targetStepIndex = STEPS.findIndex((s) => s.id === step);

      // Validate current step if moving forward
      if (targetStepIndex > currentStepIndex && !validateStep(currentStep)) {
        return;
      }

      setCurrentStep(step);
    },
    [currentStep, validateStep]
  );

  const nextStep = useCallback(() => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      goToStep(STEPS[currentIndex + 1].id);
    }
  }, [currentStep, goToStep]);

  const prevStep = useCallback(() => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      goToStep(STEPS[currentIndex - 1].id);
    }
  }, [currentStep, goToStep]);

  // Form submission
  const handleSubmit = useCallback(async () => {
    if (!validateStep("details")) return;

    try {
      const payload = {
        ...(mode === "edit" && initialData?.courseId
          ? { courseId: initialData.courseId }
          : {}),
        ...formData,
      };

      const result = (await saveCourse(
        "/api/admin/course.upsert",
        payload
      )) as { courseId: string; isUpdate: boolean };

      if (onComplete) {
        onComplete({
          courseId: result.courseId,
          isUpdate: result.isUpdate,
        });
      } else {
        // Navigate to course management or modules
        router.push(`/admin/courses/${result.courseId}`);
      }
    } catch (error) {
      console.error("Course submit error:", error);
      setErrors({
        submit:
          error instanceof Error ? error.message : "Failed to save course",
      });
    } finally {
      // isSubmitting is handled by the mutation hook
    }
  }, [
    formData,
    mode,
    initialData?.courseId,
    onComplete,
    router,
    validateStep,
    saveCourse,
  ]);

  // Handle hero image upload
  const handleHeroUpload = useCallback((result: UploadResult) => {
    setFormData((prev) => ({ ...prev, heroImageUrl: result.url }));
  }, []);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case "details":
        return (
          <div className="space-y-6">
            <div>
              <label className="block  font-medium text-gray-700 mb-2">
                Course Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter an engaging course title..."
                className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.title ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.title && (
                <p className="mt-1  text-red-600">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block  font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe what students will learn and achieve..."
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.description && (
                <p className="mt-1  text-red-600">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block  font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={formData.level}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      level: e.target.value as CourseFormData["level"],
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block  font-medium text-gray-700 mb-2">
                  Estimated Duration (minutes) *
                </label>
                <input
                  type="number"
                  min="5"
                  max="600"
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      durationMinutes: parseInt(e.target.value) || 0,
                    }))
                  }
                  className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.durationMinutes
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                />
                {errors.durationMinutes && (
                  <p className="mt-1  text-red-600">{errors.durationMinutes}</p>
                )}
              </div>
            </div>
          </div>
        );

      case "hero":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Course Hero Image
              </h3>
              <p className="text-gray-600 mb-6">
                Upload an engaging cover image that represents your course
                content. This will be displayed prominently to attract students.
              </p>
            </div>

            {formData.heroImageUrl ? (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                  <Image
                    src={formData.heroImageUrl}
                    alt="Course hero"
                    width={800}
                    height={256}
                    className="w-full h-64 object-cover"
                  />
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        heroImageUrl: undefined,
                      }))
                    }
                    className="px-4 py-2 text-red-600 hover:text-red-800 border border-red-300 hover:border-red-400 rounded-lg transition-colors"
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            ) : (
              <FileUpload
                type="hero"
                placeholder="Upload course hero image"
                description="Recommended: 1200x630px, under 5MB"
                onUploadComplete={handleHeroUpload}
                className="max-w-2xl mx-auto"
              />
            )}
          </div>
        );

      case "review":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Review Your Course
              </h3>
              <p className="text-gray-600 mb-6">
                Please review the course details before{" "}
                {mode === "create" ? "creating" : "updating"}.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <dt className=" font-medium text-gray-500">Title</dt>
                <dd className="mt-1 text-lg text-gray-900">{formData.title}</dd>
              </div>

              <div>
                <dt className=" font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-gray-700">{formData.description}</dd>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className=" font-medium text-gray-500">Level</dt>
                  <dd className="mt-1 text-gray-900 capitalize">
                    {formData.level}
                  </dd>
                </div>

                <div>
                  <dt className=" font-medium text-gray-500">Duration</dt>
                  <dd className="mt-1 text-gray-900">
                    {formData.durationMinutes} minutes
                  </dd>
                </div>
              </div>

              {formData.heroImageUrl && (
                <div>
                  <dt className=" font-medium text-gray-500 mb-2">
                    Hero Image
                  </dt>
                  <dd>
                    <Image
                      src={formData.heroImageUrl}
                      alt="Course hero"
                      width={128}
                      height={80}
                      className="w-32 h-20 object-cover rounded border"
                    />
                  </dd>
                </div>
              )}
            </div>

            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{errors.submit}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const isLastStep = currentStepIndex === STEPS.length - 1;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${
                index < STEPS.length - 1 ? "flex-1" : ""
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 cursor-pointer ${
                  index <= currentStepIndex
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-gray-300 text-gray-400"
                }`}
                onClick={() => goToStep(step.id)}
              >
                {index + 1}
              </div>

              <div className="ml-3 min-w-0">
                <p
                  className={` font-medium ${
                    index <= currentStepIndex
                      ? "text-blue-600"
                      : "text-gray-400"
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>

              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 mx-4 h-0.5 ${
                    index < currentStepIndex ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <div>
          {currentStepIndex > 0 && (
            <button
              onClick={prevStep}
              disabled={isSubmitting}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-lg transition-colors disabled:opacity-50"
            >
              ← Previous
            </button>
          )}
        </div>

        <div className="flex space-x-4">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          {isLastStep ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  {mode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : mode === "create" ? (
                "Create Course"
              ) : (
                "Update Course"
              )}
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
