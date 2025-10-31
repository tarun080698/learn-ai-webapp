/**
 * Admin Course Edit Page - Modern Clean Design
 * Simplified course editing interface with consistent styling
 */
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { useAuth } from "@/app/(auth)/AuthProvider";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import {
  ArrowLeftIcon,
  PencilIcon,
  PhotoIcon,
  ClockIcon,
  AcademicCapIcon,
  TagIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

// Interface for course data
interface CourseData {
  id: string;
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  durationMinutes: number;
  heroImageUrl?: string;
  published: boolean;
  archived: boolean;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}

export default function AdminCourseEditPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { firebaseUser } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();

  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    level: "beginner" as "beginner" | "intermediate" | "advanced",
    durationMinutes: 0,
    heroImageUrl: "",
    published: false,
  });

  // Load course data
  useEffect(() => {
    const loadCourse = async () => {
      if (!firebaseUser || !courseId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Get course data using the course complete API
        const response = await authenticatedFetch(
          `/api/admin/course.complete?courseId=${courseId}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load course");
        }

        const course = data.course;
        setCourseData(course);
        setFormData({
          title: course.title || "",
          description: course.description || "",
          level: course.level || "beginner",
          durationMinutes: course.durationMinutes || 0,
          heroImageUrl: course.heroImageUrl || "",
          published: course.published || false,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load course");
      } finally {
        setIsLoading(false);
      }
    };

    loadCourse();
  }, [firebaseUser, courseId, authenticatedFetch]);

  // Handle save
  const handleSave = async () => {
    if (!firebaseUser) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await authenticatedFetch("/api/admin/course.upsert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: courseId,
          ...formData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update course");
      }

      // Redirect back to course view page
      router.push(`/admin/courses/${courseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save course");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle archive
  const handleArchive = async () => {
    if (!firebaseUser) return;

    if (
      !confirm(
        "Are you sure you want to archive this course? This will hide it from students."
      )
    ) {
      return;
    }

    try {
      const response = await authenticatedFetch("/api/admin/course.archive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: courseId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to archive course");
      }

      // Redirect back to courses list
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive course");
    }
  };

  // Format duration helper
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (!firebaseUser) {
    return (
      <div className="p-6">
        <div className="text-center text-black">Please log in to continue.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error && !courseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <Link href="/admin" className="text-blue-600 hover:text-blue-800">
            ← Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-4">Course not found</div>
          <Link href="/admin" className="text-blue-600 hover:text-blue-800">
            ← Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href={`/admin/courses/${courseId}`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Course
            </Link>
            <div className="w-px h-6 bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Course</h1>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-800 font-medium">Error</div>
            <div className="text-red-700  mt-1">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Course Details
              </h2>

              {/* Title */}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter course title..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block  font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter course description..."
                />
              </div>

              {/* Level and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block  font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        level: e.target.value as
                          | "beginner"
                          | "intermediate"
                          | "advanced",
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block  font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        durationMinutes: Number(e.target.value),
                      }))
                    }
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Hero Image URL */}
              <div>
                <label className="block  font-medium text-gray-700 mb-2">
                  Hero Image URL
                </label>
                <input
                  type="url"
                  value={formData.heroImageUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      heroImageUrl: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Published Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.published}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      published: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="published"
                  className="ml-2  font-medium text-gray-700"
                >
                  Published (visible to students)
                </label>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Hero Image Preview */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Hero Image Preview
              </h3>
              <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                {formData.heroImageUrl ? (
                  <Image
                    src={formData.heroImageUrl}
                    alt="Course hero image"
                    width={400}
                    height={225}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <PhotoIcon className="w-12 h-12" />
                  </div>
                )}
              </div>
            </div>

            {/* Course Stats */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Course Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-gray-500" />
                  <span className=" text-gray-600">
                    Duration: {formatDuration(formData.durationMinutes)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AcademicCapIcon className="w-4 h-4 text-gray-500" />
                  <span className=" text-gray-600 capitalize">
                    Level: {formData.level}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TagIcon className="w-4 h-4 text-gray-500" />
                  <span className=" text-gray-600">
                    Status: {formData.published ? "Published" : "Draft"}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="space-y-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PencilIcon className="w-4 h-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={handleArchive}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                  Archive Course
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
