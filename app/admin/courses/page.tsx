/**
 * Admin Courses Management Page
 * Lists all courses with edit, delete, and module management actions
 */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

import { useAuth } from "@/app/(auth)/AuthProvider";
import {
  useAuthenticatedFetch,
  useAuthenticatedMutation,
} from "@/hooks/useAuthenticatedFetch";
import { CourseDoc } from "@/types/models";

interface Course extends CourseDoc {
  id: string;
  moduleCount: number;
  assignmentCount?: number;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { firebaseUser } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const publishCourseApi = useAuthenticatedMutation();
  // Load courses
  useEffect(() => {
    const loadCourses = async () => {
      if (!firebaseUser) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch(
          "/api/admin/courses.mine?limit=100"
        );
        const data = await response.json();
        setCourses(data.courses || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load courses");
      } finally {
        setIsLoading(false);
      }
    };

    loadCourses();
  }, [firebaseUser, authenticatedFetch]);

  // Handle publish/unpublish
  const handlePublishToggle = async (
    courseId: string,
    currentPublished: boolean
  ) => {
    try {
      await publishCourseApi.mutate("/api/admin/course.publish", {
        courseId,
        published: !currentPublished,
      });

      // Update local state
      setCourses((prev) =>
        prev.map((course) =>
          course.id === courseId
            ? { ...course, published: !currentPublished }
            : course
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update course");
    }
  };

  // Handle delete (TODO: implement delete API endpoint)
  const handleDelete = async (courseId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this course? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      // TODO: Implement delete endpoint
      console.log("Delete course:", courseId);
      setError("Delete functionality not yet implemented");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete course");
    }
  };

  const formatDate = (timestamp: { seconds: number } | Date | null) => {
    if (!timestamp) return "Unknown";

    let date: Date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === "object" && "seconds" in timestamp) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      return "Unknown";
    }

    return date.toLocaleDateString();
  };

  if (!firebaseUser) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-600">
          Please log in to continue.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black">Course Management</h1>
          <p className="text-black mt-1">
            Manage your courses, modules, and questionnaires.
            <span className="font-medium text-black">
              {" "}
              Click module count to add/edit modules.
            </span>
          </p>
        </div>
        <Link
          href="/admin/new"
          className="bg-white text-black border border-black px-4 py-2 rounded-lg hover:bg-white transition-colors"
        >
          + New Course
        </Link>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-white border border-black text-black px-4 py-3 rounded-lg mb-6">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-black hover:text-black"
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-black">Loading courses...</div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && courses.length === 0 && (
        <div className="text-center py-12">
          <div className="text-black mb-4">No courses found</div>
          <div className="mb-6">
            <Link
              href="/admin/new"
              className="bg-white text-black border border-black px-6 py-3 rounded-lg hover:bg-white inline-block"
            >
              Create your first course
            </Link>
          </div>
          <div className="text-sm text-black">
            <div className="mb-2">After creating a course:</div>
            <div>
              1. Click the{" "}
              <span className="bg-white text-black border border-black px-2 py-1 rounded">
                📝 modules
              </span>{" "}
              button to add modules
            </div>
            <div>
              2. Click &quot;Edit&quot; to manage course details and
              questionnaires
            </div>
          </div>
        </div>
      )}

      {/* Courses List */}
      {!isLoading && courses.length > 0 && (
        <div className="bg-white border border-black rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white border-b border-black">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Modules
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-black">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-white">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-black">
                          {course.title}
                        </div>
                        <div className="text-sm text-black mt-1">
                          {course.description}
                        </div>
                        <div className="text-xs text-black mt-1">
                          {course.level} • {course.durationMinutes}min
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border border-black ${
                          course.published
                            ? "bg-white text-black"
                            : "bg-white text-black"
                        }`}
                      >
                        {course.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      <Link
                        href={`/admin/courses/${course.id}/modules`}
                        className="inline-flex items-center gap-1 bg-white text-black border border-black hover:bg-white px-3 py-1 rounded-lg font-medium transition-colors"
                      >
                        📝 {course.moduleCount || 0} modules
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {formatDate(course.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {/* Edit Course */}
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="text-black hover:text-black"
                      >
                        Edit
                      </Link>

                      {/* Manage Modules */}
                      <Link
                        href={`/admin/courses/${course.id}/modules`}
                        className="text-black hover:text-black"
                      >
                        Modules
                      </Link>

                      {/* Publish/Unpublish */}
                      <button
                        onClick={() =>
                          handlePublishToggle(course.id, course.published)
                        }
                        disabled={publishCourseApi.loading}
                        className="text-black hover:text-black disabled:opacity-50"
                      >
                        {publishCourseApi.loading
                          ? "..."
                          : course.published
                          ? "Unpublish"
                          : "Publish"}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="text-black hover:text-black"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {!isLoading && courses.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-black">
            <div className="text-sm text-black">Total Courses</div>
            <div className="text-2xl font-bold text-black">
              {courses.length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-black">
            <div className="text-sm text-black">Published</div>
            <div className="text-2xl font-bold text-black">
              {courses.filter((c) => c.published).length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-black">
            <div className="text-sm text-black">Drafts</div>
            <div className="text-2xl font-bold text-black">
              {courses.filter((c) => !c.published).length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
