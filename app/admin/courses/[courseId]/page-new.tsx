/**
 * Admin Course Edit Page
 * Edit course and navigate to preview/modules
 */
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate, formatDateTime } from "@/utils/dateUtils";

import { useAuth } from "@/app/(auth)/AuthProvider";
import { getCourseComplete } from "@/lib/api/admin";
import { CourseDoc } from "@/types/models";
import {
  BookOpenIcon,
  EyeIcon,
  PencilIcon,
  CogIcon,
} from "@heroicons/react/24/outline";

// Simplified course data interface for edit page
interface CourseData {
  course: CourseDoc & { id: string };
  stats: {
    moduleCount: number;
    assignmentCount: number;
    totalAssets: number;
  };
}

export default function AdminCourseEditPage() {
  const params = useParams();
  const courseId = params.courseId as string;
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
        setError("Failed to load course data");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, firebaseUser]);

  if (!firebaseUser) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          Please log in to continue.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          The course you're looking for doesn't exist or you don't have
          permission to access it.
        </div>
      </div>
    );
  }

  const { course, stats } = courseData;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {course.title}
            </h1>
            <p className="text-gray-600">{course.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/courses/${courseId}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <EyeIcon className="h-4 w-4" />
              Preview
            </Link>
          </div>
        </div>

        {/* Course Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <BookOpenIcon className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.moduleCount}
                </p>
                <p className=" text-gray-600">Modules</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <PencilIcon className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.assignmentCount}
                </p>
                <p className=" text-gray-600">Assignments</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <CogIcon className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalAssets}
                </p>
                <p className=" text-gray-600">Assets</p>
              </div>
            </div>
          </div>
        </div>

        {/* Course Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ">
            <div>
              <span className="font-medium text-gray-700">Created:</span>
              <div className="text-gray-600">
                {formatDate(course.createdAt)}
              </div>
            </div>
            {course.updatedAt && (
              <div>
                <span className="font-medium text-gray-700">Updated:</span>
                <div className="text-gray-600">
                  {formatDate(course.updatedAt)}
                </div>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-700">Status:</span>
              <div className="text-gray-600 capitalize">
                {course.archived
                  ? "archived"
                  : course.published
                  ? "published"
                  : "draft"}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Level:</span>
              <div className="text-gray-600 capitalize">
                {course.level || "beginner"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Edit Course */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
          <div className="flex items-start">
            <PencilIcon className="h-8 w-8 text-blue-500 mr-4 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Edit Course Details
              </h3>
              <p className="text-gray-600 mb-4">
                Update course information, description, and settings.
              </p>
              <button
                onClick={() => router.push(`/admin/courses/${courseId}/edit`)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Course
              </button>
            </div>
          </div>
        </div>

        {/* Manage Modules */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-green-300 transition-colors">
          <div className="flex items-start">
            <BookOpenIcon className="h-8 w-8 text-green-500 mr-4 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Manage Modules
              </h3>
              <p className="text-gray-600 mb-4">
                Add, edit, and organize course modules and content.
              </p>
              <button
                onClick={() =>
                  router.push(`/admin/courses/${courseId}/modules`)
                }
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Manage Modules
              </button>
            </div>
          </div>
        </div>

        {/* Course Settings */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
          <div className="flex items-start">
            <CogIcon className="h-8 w-8 text-purple-500 mr-4 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Course Settings
              </h3>
              <p className="text-gray-600 mb-4">
                Configure publishing, access controls, and advanced options.
              </p>
              <button
                onClick={() =>
                  router.push(`/admin/courses/${courseId}/settings`)
                }
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
