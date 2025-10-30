/**
 * Admin Course Edit Page
 * Edit course and navigate to preview
 */
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/utils/dateUtils";

import { useAuth } from "@/app/(auth)/AuthProvider";
import { getCourseComplete } from "@/lib/api/admin";
import { CourseDoc } from "@/types/models";
import {
  BookOpenIcon,
  EyeIcon,
  PencilIcon,
  CogIcon,
} from "@heroicons/react/24/outline";

interface CourseData {
  course: CourseDoc & { id: string };
  stats: {
    moduleCount: number;
    assignmentCount: number;
    totalAssets: number;
  };
}

function AdminCourseEdit() {
  const params = useParams() as { courseId: string };
  const courseId = params.courseId;
  const router = useRouter();
  const { firebaseUser } = useAuth();

  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!firebaseUser || !courseId) return;

      try {
        setLoading(true);
        setError(null);

        const data = await getCourseComplete(courseId);
        setCourseData({
          course: data.course,
          stats: data.stats,
        });
      } catch (err) {
        console.error("Error fetching course data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch course data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, firebaseUser]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="bg-white rounded-lg p-6">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Error Loading Course
            </h2>
            <p className="text-red-700 mb-4">{error}</p>
            <Link
              href="/admin/courses"
              className="inline-block text-red-600 hover:text-red-800 underline"
            >
              ← Back to Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!courseData) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Course Not Found
            </h2>
            <p className="text-gray-500 mb-4">
              The course you&apos;re looking for doesn&apos;t exist.
            </p>
            <Link
              href="/admin/courses"
              className="inline-block text-blue-600 hover:text-blue-800 underline"
            >
              ← Back to Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { course, stats } = courseData;

  // Using centralized date utilities from @/utils/dateUtils

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header with navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/courses"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Courses
            </Link>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <PencilIcon className="w-5 h-5" />
            <span className="font-medium">Edit Course</span>
          </div>
        </div>

        {/* Course Summary Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {course.title}
              </h1>
              <span
                className={`px-3 py-1 rounded-full  font-medium ${
                  course.archived
                    ? "bg-gray-100 text-gray-800"
                    : course.published
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {course.archived
                  ? "Archived"
                  : course.published
                  ? "Published"
                  : "Draft"}
              </span>
            </div>
            <Link
              href={`/admin/courses/${courseId}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <EyeIcon className="w-4 h-4" />
              Preview Course
            </Link>
          </div>

          {course.description && (
            <p className="text-gray-700 mb-4">{course.description}</p>
          )}

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {stats.moduleCount}
              </div>
              <div className=" text-blue-800">Modules</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {stats.totalAssets}
              </div>
              <div className=" text-green-800">Assets</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {stats.assignmentCount}
              </div>
              <div className=" text-purple-800">Assignments</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t  text-gray-500">
            <p>
              Created: {formatDate(course.createdAt)}
              {course.updatedAt && course.updatedAt !== course.createdAt && (
                <span className="ml-4">
                  Updated: {formatDate(course.updatedAt)}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Edit Basic Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <PencilIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Basic Info</h3>
                <p className=" text-gray-500">
                  Edit title, description, and settings
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/admin/courses/${courseId}/edit`)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit Course Info
            </button>
          </div>

          {/* Manage Modules */}
          <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpenIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Modules</h3>
                <p className=" text-gray-500">
                  Manage course modules and content
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/admin/courses/${courseId}/modules`)}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Manage Modules
            </button>
          </div>

          {/* Course Settings */}
          <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <CogIcon className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Settings</h3>
                <p className=" text-gray-500">Advanced course configuration</p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/admin/courses/${courseId}/settings`)}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Course Settings
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/admin/courses/${courseId}`}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <EyeIcon className="w-4 h-4" />
              Preview Course
            </Link>
            <button
              onClick={() => {
                // TODO: Implement publish/unpublish functionality
                console.log("Publish/unpublish course");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                course.published
                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                  : "bg-green-100 text-green-800 hover:bg-green-200"
              }`}
            >
              {course.published ? "Unpublish" : "Publish"}
            </button>
            <button
              onClick={() => {
                // TODO: Implement duplicate functionality
                console.log("Duplicate course");
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Duplicate Course
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminCourseEdit;
