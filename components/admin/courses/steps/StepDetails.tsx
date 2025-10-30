"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createCourse, updateCourse, uploadFile } from "@/lib/api/admin";
import type { WizardState } from "@/lib/types";

// Validation schema for Step 1
const courseDetailsSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must be less than 120 characters"),
  description: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length >= 20,
      "Description must be at least 20 characters if provided"
    ),
  durationHours: z.number().min(1, "Duration must be at least 1 hour"),
  level: z.enum(["beginner", "intermediate", "advanced", "expert"]),
  heroImageUrl: z.string().url().optional().or(z.literal("")),
});

type CourseDetailsFormData = z.infer<typeof courseDetailsSchema>;

interface StepDetailsProps {
  wizardState: WizardState;
  updateWizardState: (updates: Partial<WizardState>) => void;
  nextStep: () => void;
  showToast: (type: "success" | "error" | "info", message: string) => void;
}

export function StepDetails({
  wizardState,
  updateWizardState,
  nextStep,
  showToast,
}: StepDetailsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "saved" | "saving" | "error" | null
  >(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CourseDetailsFormData>({
    resolver: zodResolver(courseDetailsSchema),
    defaultValues: {
      title: wizardState.courseData.title || "",
      description: wizardState.courseData.description || "",
      durationHours: wizardState.courseData.durationHours || 1,
      level: wizardState.courseData.level || "beginner",
      heroImageUrl: wizardState.courseData.heroImageUrl || "",
    },
    mode: "onChange",
  });

  const watchedFields = watch();

  // Auto-save functionality (debounced)
  const autoSave = useCallback(
    async (data: CourseDetailsFormData) => {
      if (!wizardState.courseId) return; // Only auto-save if course already exists

      try {
        setAutoSaveStatus("saving");
        await updateCourse(wizardState.courseId, {
          title: data.title,
          description: data.description,
          durationMinutes: Math.round(data.durationHours * 60),
          level: data.level,
          heroImageUrl: data.heroImageUrl || undefined,
        });
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus(null), 2000);
      } catch (error) {
        console.error("Auto-save failed:", error);
        setAutoSaveStatus("error");
        setTimeout(() => setAutoSaveStatus(null), 3000);
      }
    },
    [wizardState.courseId]
  );

  // Debounced auto-save effect
  useEffect(() => {
    if (!isValid || !wizardState.courseId) return;

    const timeoutId = setTimeout(() => {
      autoSave(watchedFields);
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [watchedFields, isValid, autoSave, wizardState.courseId]);

  // Handle file upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      showToast("error", "Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "File size must be less than 5MB");
      return;
    }

    try {
      setIsUploading(true);
      const { url } = await uploadFile(file, "hero");
      setValue("heroImageUrl", url);
      showToast("success", "Image uploaded successfully");
    } catch (error) {
      console.error("Upload failed:", error);
      showToast("error", "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle form submission and create course draft
  const onSubmit = async (data: CourseDetailsFormData) => {
    try {
      setIsLoading(true);

      const courseData = {
        title: data.title,
        description: data.description,
        durationMinutes: Math.round(data.durationHours * 60),
        level: data.level,
        heroImageUrl: data.heroImageUrl || undefined,
      };

      let courseId = wizardState.courseId;

      if (courseId) {
        // Update existing course
        await updateCourse(courseId, courseData);
        showToast("success", "Course updated successfully");
      } else {
        // Create new course draft
        const result = await createCourse(courseData);
        console.log("Create course API response:", result);
        courseId = result.id;

        if (!courseId) {
          console.error("Missing course ID in response:", result);
          throw new Error("Course ID not returned from server");
        }

        showToast("success", "Course draft created successfully");
      } // Update wizard state
      updateWizardState({
        courseId,
        courseData: data,
      });

      // Proceed to next step
      nextStep();
    } catch (error) {
      console.error("Failed to save course:", error);
      showToast(
        "error",
        error instanceof Error ? error.message : "Failed to save course"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-[0_1px_2px_rgba(38,70,83,0.06),0_8px_24px_rgba(38,70,83,0.08)]">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Course Details
            </h2>
            <p className="text-gray-600 text-lg">
              Let&apos;s start with the basic information about your course.
              This will help students understand what they&apos;ll learn.
            </p>
          </div>
          {autoSaveStatus && (
            <div className="flex items-center text-sm">
              {autoSaveStatus === "saving" && (
                <>
                  <i className="fa-solid fa-spinner animate-spin text-blue-500 mr-2"></i>
                  <span className="text-blue-600">Saving...</span>
                </>
              )}
              {autoSaveStatus === "saved" && (
                <>
                  <i className="fa-solid fa-check text-green-500 mr-2"></i>
                  <span className="text-green-600">Saved</span>
                </>
              )}
              {autoSaveStatus === "error" && (
                <>
                  <i className="fa-solid fa-exclamation-triangle text-red-500 mr-2"></i>
                  <span className="text-red-600">Save failed</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Course Title */}
        <div className="space-y-3">
          <label
            className="block text-gray-700 font-medium text-lg"
            htmlFor="title"
          >
            Course Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            {...register("title")}
            className={`w-full bg-white border rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 text-lg ${
              errors.title ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="e.g., Advanced React Development Patterns"
          />
          {errors.title && (
            <p className="text-red-500 text-sm">{errors.title.message}</p>
          )}
          <p className="text-gray-500 text-sm">
            Choose a clear, descriptive title that accurately represents your
            course content.
          </p>
        </div>

        {/* Course Description */}
        <div className="space-y-3">
          <label
            className="block text-gray-700 font-medium text-lg"
            htmlFor="description"
          >
            Course Description
          </label>
          <textarea
            id="description"
            rows={6}
            {...register("description")}
            className={`w-full bg-white border rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 resize-none ${
              errors.description ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Describe what students will learn, the outcomes they can expect, and who this course is for..."
          />
          {errors.description && (
            <p className="text-red-500 text-sm">{errors.description.message}</p>
          )}
          <p className="text-gray-500 text-sm">
            Provide a detailed description that helps students understand the
            value and outcomes of your course.
          </p>
        </div>

        {/* Course Level & Duration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label
              className="block text-gray-700 font-medium text-lg"
              htmlFor="level"
            >
              Difficulty Level <span className="text-red-500">*</span>
            </label>
            <select
              id="level"
              {...register("level")}
              className={`w-full bg-white border rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 ${
                errors.level ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
            {errors.level && (
              <p className="text-red-500 text-sm">{errors.level.message}</p>
            )}
          </div>
          <div className="space-y-3">
            <label
              className="block text-gray-700 font-medium text-lg"
              htmlFor="durationHours"
            >
              Estimated Duration (hours) <span className="text-red-500">*</span>
            </label>
            <input
              id="durationHours"
              type="number"
              min="1"
              step="0.5"
              {...register("durationHours", { valueAsNumber: true })}
              className={`w-full bg-white border rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 ${
                errors.durationHours ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., 40"
            />
            {errors.durationHours && (
              <p className="text-red-500 text-sm">
                {errors.durationHours.message}
              </p>
            )}
          </div>
        </div>

        {/* Course Thumbnail Upload */}
        <div className="space-y-4">
          <label className="block text-gray-700 font-medium text-lg">
            Course Thumbnail
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8">
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="w-64 h-36 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden">
                {watchedFields.heroImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={watchedFields.heroImageUrl}
                    alt="Course thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <i className="fa-solid fa-image text-4xl mb-2"></i>
                    <p className="text-sm">No image selected</p>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Upload Course Thumbnail
                </h4>
                <p className="text-gray-600 mb-4">
                  Recommended dimensions: 1280×720 pixels (16:9 aspect ratio)
                </p>
                <p className="text-gray-600 mb-6">
                  Maximum file size: 5MB. Supported formats: JPG, PNG, WebP
                </p>
                <div className="flex items-center space-x-4">
                  <label
                    htmlFor="heroImage"
                    className={`bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-150 flex items-center space-x-2 cursor-pointer ${
                      isUploading
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-blue-700"
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <i className="fa-solid fa-spinner animate-spin"></i>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-upload"></i>
                        <span>Choose File</span>
                      </>
                    )}
                  </label>
                  <input
                    id="heroImage"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={isLoading || !isValid}
            className={`bg-blue-600 text-white px-8 py-4 rounded-xl font-medium transition-colors duration-150 flex items-center space-x-2 cursor-pointer ${
              isLoading || !isValid
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue-700"
            }`}
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-spinner animate-spin"></i>
                <span>
                  {wizardState.courseId ? "Updating..." : "Creating..."}
                </span>
              </>
            ) : (
              <>
                <span>
                  {wizardState.courseId
                    ? "Update & Continue"
                    : "Create Draft & Continue"}
                </span>
                <i className="fa-solid fa-chevron-right"></i>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
