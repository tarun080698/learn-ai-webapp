/**
 * Admin Course Edit Page
 * Edit course details, modules, and assets
 */
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/utils/dateUtils";

import { useAuth } from "@/app/(auth)/AuthProvider";
import { getCourseComplete } from "@/lib/api/admin";
import {
  CourseDoc,
  ModuleDoc,
  ModuleAsset,
  QuestionnaireAssignmentDoc,
} from "@/types/models";
import {
  ArrowLeftIcon,
  PencilIcon,
  CheckIcon,
  EyeIcon,
  TrashIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

// Interface for complete course data from API
interface CompleteCourseData {
  course: CourseDoc & { id: string };
  modules: (ModuleDoc & { id: string })[];
  assignments: (QuestionnaireAssignmentDoc & {
    id: string;
    questionnaire?: {
      title: string;
      purpose: string;
      questions?: unknown[];
    };
  })[];
  stats: {
    moduleCount: number;
    assignmentCount: number;
    totalAssets: number;
  };
}

export default function AdminCourseEditPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { firebaseUser } = useAuth();

  const [courseData, setCourseData] = useState<CompleteCourseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    durationMinutes: 0,
    level: "beginner" as "beginner" | "intermediate" | "advanced",
    published: false,
  });

  // Load complete course data
  useEffect(() => {
    const loadCourseData = async () => {
      if (!firebaseUser || !courseId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await getCourseComplete(courseId);
        setCourseData(response);

        // Initialize edit form with current data
        setEditForm({
          title: response.course.title,
          description: response.course.description,
          durationMinutes: response.course.durationMinutes,
          level: response.course.level,
          published: response.course.published,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load course data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadCourseData();
  }, [firebaseUser, courseId]);

  const handleSave = async () => {
    // TODO: Implement save functionality
    console.log("Saving course:", editForm);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (courseData) {
      setEditForm({
        title: courseData.course.title,
        description: courseData.course.description,
        durationMinutes: courseData.course.durationMinutes,
        level: courseData.course.level,
        published: courseData.course.published,
      });
    }
    setIsEditing(false);
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

  if (error) {
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

  const { course, modules, assignments, stats } = courseData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
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
            <div className="flex items-center gap-3">
              <Link
                href={`/admin/courses/${courseId}`}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <EyeIcon className="w-4 h-4" />
                Preview
              </Link>
            </div>
          </div>
        </div>

        {/* Course Details Form */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Course Details
              </h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit Details
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckIcon className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {!isEditing ? (
              // Display Mode
              <div className="space-y-6">
                <div>
                  <label className="block  font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <p className="text-gray-900">{course.title}</p>
                </div>

                <div>
                  <label className="block  font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <p className="text-gray-900">{course.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block  font-medium text-gray-700 mb-1">
                      Duration
                    </label>
                    <p className="text-gray-900">
                      {course.durationMinutes} minutes
                    </p>
                  </div>

                  <div>
                    <label className="block  font-medium text-gray-700 mb-1">
                      Level
                    </label>
                    <p className="text-gray-900 capitalize">{course.level}</p>
                  </div>

                  <div>
                    <label className="block  font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <span
                      className={`inline-flex px-2 py-1  font-medium rounded-full ${
                        course.published
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {course.published ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6  text-gray-600">
                  <div>
                    <span className="font-medium">Created:</span>{" "}
                    {formatDate(course.createdAt)}
                  </div>
                  <div>
                    <span className="font-medium">Last Updated:</span>{" "}
                    {formatDate(course.updatedAt)}
                  </div>
                </div>
              </div>
            ) : (
              // Edit Mode
              <form className="space-y-6">
                <div>
                  <label
                    htmlFor="title"
                    className="block  font-medium text-gray-700 mb-1"
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block  font-medium text-gray-700 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label
                      htmlFor="duration"
                      className="block  font-medium text-gray-700 mb-1"
                    >
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      id="duration"
                      value={editForm.durationMinutes}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          durationMinutes: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="level"
                      className="block  font-medium text-gray-700 mb-1"
                    >
                      Level
                    </label>
                    <select
                      id="level"
                      value={editForm.level}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          level: e.target.value as
                            | "beginner"
                            | "intermediate"
                            | "advanced",
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block  font-medium text-gray-700 mb-1">
                      Published
                    </label>
                    <div className="flex items-center mt-2">
                      <input
                        type="checkbox"
                        id="published"
                        checked={editForm.published}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            published: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="published"
                        className="ml-2  text-gray-700"
                      >
                        Publish this course
                      </label>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Modules Section */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Course Modules ({modules.length})
              </h2>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => {
                  // TODO: Implement add module functionality
                  console.log("Add new module");
                }}
              >
                <PlusIcon className="w-4 h-4" />
                Add Module
              </button>
            </div>
          </div>

          <div className="p-6">
            {modules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No modules created yet. Click "Add Module" to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {modules.map((module, index) => (
                  <div key={module.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-blue-100 text-blue-800  font-medium px-2.5 py-1 rounded-full">
                            {index + 1}
                          </span>
                          <h3 className="text-lg font-medium text-gray-900">
                            {module.title}
                          </h3>
                        </div>
                        <p className="text-gray-600 mb-2">{module.summary}</p>
                        <div className="flex items-center gap-4  text-gray-500">
                          <span>{module.estMinutes} min</span>
                          {module.assets && (
                            <span>{module.assets.length} assets</span>
                          )}
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              module.published
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {module.published ? "Published" : "Draft"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          onClick={() => {
                            // TODO: Implement edit module functionality
                            console.log("Edit module", module.id);
                          }}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          onClick={() => {
                            // TODO: Implement delete module functionality
                            console.log("Delete module", module.id);
                          }}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Assignments Section */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Assessments ({assignments.length})
              </h2>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => {
                  // TODO: Implement add assignment functionality
                  console.log("Add new assignment");
                }}
              >
                <PlusIcon className="w-4 h-4" />
                Add Assessment
              </button>
            </div>
          </div>

          <div className="p-6">
            {assignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No assessments assigned yet. Click "Add Assessment" to get
                started.
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {assignment.questionnaire?.title ||
                            "Untitled Assessment"}
                        </h3>
                        <p className=" text-gray-600 mt-1">
                          {assignment.questionnaire?.purpose}
                        </p>
                        <div className="flex items-center gap-4 mt-2  text-gray-500">
                          <span>Timing: {assignment.timing}</span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              assignment.active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {assignment.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          onClick={() => {
                            // TODO: Implement edit assignment functionality
                            console.log("Edit assignment", assignment.id);
                          }}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          onClick={() => {
                            // TODO: Implement delete assignment functionality
                            console.log("Delete assignment", assignment.id);
                          }}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
