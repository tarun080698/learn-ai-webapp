/**
 * Admin Course Edit Page
 * Edit course and navigate to preview/modules
 */
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/utils/dateUtils";

import { useAuth } from "@/app/(auth)/AuthProvider";
import { getCourseComplete } from "@/lib/api/admin";
import { CourseDoc, ModuleDoc, ModuleAsset, QuestionnaireAssignmentDoc } from "@/types/models";
import {
  BookOpenIcon,
  EyeIcon,
  PencilIcon,
  ClockIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronRightIcon,
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

export default function AdminCourseDetailsPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { firebaseUser } = useAuth();

  const [courseData, setCourseData] = useState<CompleteCourseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<
    Record<string, boolean>
  >({});
  const [expandedSections, setExpandedSections] = useState({
    course: true,
    modules: true,
    assignments: true,
  });

  // Load complete course data
  useEffect(() => {
    const loadCourseData = async () => {
      if (!firebaseUser || !courseId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Use our new complete course API
        const response = await getCourseComplete(courseId);
        setCourseData(response);

        // Expand all modules by default
        const moduleExpansion: Record<string, boolean> = {};
        response.modules.forEach((module: ModuleDoc & { id: string }) => {
          moduleExpansion[module.id] = true;
        });
        setExpandedModules(moduleExpansion);
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

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Format file size helper
  const formatFileSize = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  // Asset display component
  const AssetDisplay = ({
    asset
  }: {
    asset: ModuleAsset;
  }) => (
    <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 mb-2">{asset.title}</h4>
        <div className=" text-gray-500 space-y-1">
          <span>Order: {asset.order}</span>
          {(() => {
            const size = asset.meta?.size;
            if (size && typeof size === "number") {
              return <span>Size: {formatFileSize(size)}</span>;
            }
            return null;
          })()}
          <span className="capitalize">{asset.kind} file</span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <a
          href={asset.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="View asset"
        >
          <EyeIcon className="h-4 w-4" />
        </a>
      </div>
    </div>
  );

  // Using centralized date utilities from @/utils/dateUtils

  if (!firebaseUser) {
    return (
      <div className="p-6">
        <div className="text-center text-black">Please log in to continue.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-black">Loading course...</div>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="text-black mb-4">Course not found</div>
          <Link
            href="/admin/courses"
            className="text-black hover:text-black border-b border-black"
          >
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
            <div>
              <Link
                href="/admin/courses"
                className="text-blue-600 hover:text-blue-800  mb-2 inline-block"
              >
                ← Back to Courses
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                Course Details
              </h1>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/admin/courses/${courseId}/edit`}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Edit Course</span>
              </Link>
              <span
                className={`px-3 py-2 rounded-lg  font-medium ${
                  course.published
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {course.published ? "Published" : "Draft"}
              </span>
            </div>
          </div>

          {/* Course Hero */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {course.title}
              </h2>
              <p className="text-gray-600 mb-4">{course.description}</p>
              <div className="flex items-center space-x-6  text-gray-500">
                <div className="flex items-center space-x-1">
                  <ClockIcon className="h-4 w-4" />
                  <span>{formatDuration(course.durationMinutes || 0)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <AcademicCapIcon className="h-4 w-4" />
                  <span className="capitalize">{course.level}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <BookOpenIcon className="h-4 w-4" />
                  <span>{stats.moduleCount} modules</span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-1">
              {course.heroImageUrl && (
                <div className="relative h-48 w-full rounded-lg overflow-hidden bg-gray-200">
                  <Image
                    src={course.heroImageUrl}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Course Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <BookOpenIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className=" font-medium text-gray-500">Modules</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.moduleCount}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className=" font-medium text-gray-500">Assets</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalAssets}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <AcademicCapIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className=" font-medium text-gray-500">Assessments</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.assignmentCount}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-orange-500" />
              <div className="ml-3">
                <p className=" font-medium text-gray-500">Duration</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatDuration(course.durationMinutes || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Course Metadata */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Course Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className=" font-medium text-gray-500">Created</dt>
              <dd className="mt-1  text-gray-900">
                {formatDate(course.createdAt)}
              </dd>
            </div>
            <div>
              <dt className=" font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1  text-gray-900">
                {formatDate(course.updatedAt)}
              </dd>
            </div>
            <div>
              <dt className=" font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    course.published
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {course.published ? "Published" : "Draft"}
                </span>
              </dd>
            </div>
            <div>
              <dt className=" font-medium text-gray-500">Level</dt>
              <dd className="mt-1  text-gray-900 capitalize">{course.level}</dd>
            </div>
          </div>
        </div>
        {/* Modules Section */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Course Modules
              </h3>
              <button
                onClick={() => toggleSection("modules")}
                className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
              >
                {expandedSections.modules ? (
                  <ChevronDownIcon className="h-5 w-5" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5" />
                )}
                <span>{expandedSections.modules ? "Collapse" : "Expand"}</span>
              </button>
            </div>
          </div>

          {expandedSections.modules && (
            <div className="p-6">
              {modules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpenIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <div className="text-lg font-medium mb-2">No modules yet</div>
                  <div className="">Modules will appear here once created</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {modules.map((module, index) => (
                    <div
                      key={module.id}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div className="bg-gray-50 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                              Module {index + 1}
                            </span>
                            <h4 className="text-lg font-semibold text-gray-900">
                              {module.title}
                            </h4>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className=" text-gray-500">
                              {module.estMinutes}min
                            </span>
                            <button
                              onClick={() => toggleModule(module.id)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              {expandedModules[module.id] ? (
                                <ChevronDownIcon className="h-4 w-4" />
                              ) : (
                                <ChevronRightIcon className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <p className="text-gray-600 mt-2">{module.summary}</p>

                        <div className="flex items-center space-x-4 mt-3  text-gray-500">
                          <span className="capitalize">
                            {module.contentType}
                          </span>
                          {module.assets && module.assets.length > 0 && (
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

                      {expandedModules[module.id] && (
                        <div className="p-4 space-y-4">
                          {/* Module Content */}
                          {module.body && (
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">
                                Content
                              </h5>
                              <div className="prose prose-sm max-w-none bg-gray-50 rounded-lg p-4">
                                <div className="whitespace-pre-wrap text-gray-700">
                                  {module.body}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Module Assets */}
                          {module.assets && module.assets.length > 0 && (
                            <div>
                              <h5 className="font-medium text-gray-900 mb-3">
                                Assets ({module.assets.length})
                              </h5>
                              <div className="space-y-2">
                                {module.assets.map(
                                  (asset: ModuleAsset) => (
                                    <AssetDisplay
                                      key={asset.id}
                                      asset={asset}
                                    />
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Assignments Section */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Questionnaire Assignments
              </h3>
              <button
                onClick={() => toggleSection("assignments")}
                className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
              >
                {expandedSections.assignments ? (
                  <ChevronDownIcon className="h-5 w-5" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5" />
                )}
                <span>
                  {expandedSections.assignments ? "Collapse" : "Expand"}
                </span>
              </button>
            </div>
          </div>

          {expandedSections.assignments && (
            <div className="p-6">
              {assignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AcademicCapIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <div className="text-lg font-medium mb-2">
                    No assessments assigned
                  </div>
                  <div className="">
                    Pre/post questionnaires will appear here once assigned
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {assignment.questionnaire?.title ||
                              "Unknown Questionnaire"}
                          </div>
                          <div className=" text-gray-500 mt-1">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                assignment.timing === "pre"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {assignment.timing === "pre"
                                ? "Pre-Course"
                                : "Post-Course"}
                            </span>
                            <span className="ml-2">
                              Scope:{" "}
                              {assignment.scope.type === "course"
                                ? "Entire Course"
                                : "Module Level"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
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
                      {assignment.questionnaire && (
                        <div className="mt-3  text-gray-600">
                          <div>
                            Purpose:{" "}
                            <span className="capitalize">
                              {assignment.questionnaire.purpose}
                            </span>
                          </div>
                          <div>
                            Questions:{" "}
                            {assignment.questionnaire.questions?.length || 0}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
