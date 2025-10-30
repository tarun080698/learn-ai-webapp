/**
 * Admin Course Preview Page
 * Comprehensive preview of course data including modules, assets, and questionnaires
 */
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { useAuth } from "@/app/(auth)/AuthProvider";
import { getCourseComplete } from "@/lib/api/admin";
import { formatDate, formatDuration, formatLevel } from "@/utils/dateUtils";
import {
  CourseDoc,
  ModuleDoc,
  QuestionnaireAssignmentDoc,
  ModuleAsset,
} from "@/types/models";
import {
  BookOpenIcon,
  ClockIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  PlayIcon,
  PhotoIcon,
  LinkIcon,
  PencilIcon,
  EyeIcon,
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

// Asset display component
const AssetDisplay: React.FC<{ asset: ModuleAsset }> = ({ asset }) => {
  const getAssetIcon = (type: string) => {
    switch (type) {
      case "video":
        return <PlayIcon className="w-5 h-5 text-blue-600" />;
      case "image":
        return <PhotoIcon className="w-5 h-5 text-green-600" />;
      case "document":
        return <DocumentTextIcon className="w-5 h-5 text-red-600" />;
      case "link":
        return <LinkIcon className="w-5 h-5 text-purple-600" />;
      default:
        return <DocumentTextIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAssetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      video: "Video",
      image: "Image",
      document: "Document",
      link: "Link",
      text: "Text Content",
    };
    return labels[type] || "Unknown";
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">{getAssetIcon(asset.kind)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 truncate">
              {asset.title}
            </h4>
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
              {getAssetTypeLabel(asset.kind)}
            </span>
          </div>
          {asset.body && (
            <div className=" text-gray-700 mb-2">
              <div
                dangerouslySetInnerHTML={{
                  __html: asset.body.substring(0, 200) + "...",
                }}
              />
            </div>
          )}
          {asset.url && (
            <a
              href={asset.url}
              target="_blank"
              rel="noopener noreferrer"
              className=" text-blue-600 hover:text-blue-800 underline"
            >
              View Asset
            </a>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>Order: {asset.order}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function AdminCoursePreview() {
  const params = useParams() as { courseId: string };
  const courseId = params.courseId;
  const { firebaseUser } = useAuth();

  const [courseData, setCourseData] = useState<CompleteCourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );

  const toggleModuleExpansion = (moduleId: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!firebaseUser || !courseId) return;

      try {
        setLoading(true);
        setError(null);

        const data = await getCourseComplete(courseId);
        setCourseData(data);
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

  // Import date formatting utilities
  // Note: We'll import these at the top of the file

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="bg-white rounded-lg p-6 mb-6">
              <div className="h-48 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Error Loading Course
            </h2>
            <p className="text-red-700">{error}</p>
            <Link
              href="/admin/courses"
              className="inline-block mt-4 text-red-600 hover:text-red-800 underline"
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
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Course Not Found
            </h2>
            <p className="text-gray-500 mb-4">
              The course you're looking for doesn't exist or you don't have
              permission to view it.
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

  const { course, modules, assignments, stats } = courseData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header with navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/courses"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Courses
            </Link>
            <div className="text-gray-400">|</div>
            <Link
              href={`/admin/courses/${courseId}`}
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
            >
              <PencilIcon className="w-4 h-4" />
              Edit Course
            </Link>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <EyeIcon className="w-5 h-5" />
            <span className="font-medium">Course Preview</span>
          </div>
        </div>

        {/* Course Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
                {course.heroImageUrl ? (
                  <Image
                    src={course.heroImageUrl}
                    alt={course.title}
                    width={400}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <BookOpenIcon className="w-16 h-16" />
                  </div>
                )}
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
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

              {course.description && (
                <p className="text-xl text-gray-600 mb-4">
                  {course.description}
                </p>
              )}

              {course.description && (
                <p className="text-gray-700 mb-6">{course.description}</p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-gray-500" />
                  <span>{formatDuration(course.durationMinutes)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AcademicCapIcon className="w-4 h-4 text-gray-500" />
                  <span>{formatLevel(course.level)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpenIcon className="w-4 h-4 text-gray-500" />
                  <span>{stats.moduleCount} modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="w-4 h-4 text-gray-500" />
                  <span>{stats.totalAssets} assets</span>
                </div>
              </div>

              {course.tags && course.tags.length > 0 && (
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6  text-gray-500">
                <p>
                  Created: {formatDate(course.createdAt)}
                  {course.updatedAt &&
                    course.updatedAt !== course.createdAt && (
                      <span className="ml-4">
                        Updated: {formatDate(course.updatedAt)}
                      </span>
                    )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pre-Course Assignments */}
        {assignments.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Pre-Course Assignments
            </h2>
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="bg-blue-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-blue-900">
                      {assignment.questionnaire?.title || "Untitled Assignment"}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        assignment.active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {assignment.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {assignment.questionnaire?.purpose && (
                    <p className="text-blue-800 mb-3">
                      {assignment.questionnaire.purpose}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-4  text-blue-700">
                    {assignment.dueDate && (
                      <span>Due: {formatDate(assignment.dueDate)}</span>
                    )}
                    {assignment.maxAttempts && (
                      <span>Max attempts: {assignment.maxAttempts}</span>
                    )}
                    <span>Scope: {assignment.scope}</span>
                    <span>Timing: {assignment.timing}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Course Modules */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Course Modules ({stats.moduleCount})
          </h2>

          {modules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpenIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No modules have been added to this course yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {modules.map((module, index) => (
                <div key={module.id} className="border rounded-lg">
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleModuleExpansion(module.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-blue-100 text-blue-800  font-medium px-2 py-1 rounded">
                            Module {index + 1}
                          </span>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {module.title}
                          </h3>
                        </div>
                        {module.description && (
                          <p className="text-gray-600 mb-2">
                            {module.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4  text-gray-500">
                          <span>
                            {module.assets?.length || 0}{" "}
                            {module.assets?.length === 1 ? "asset" : "assets"}
                          </span>
                          {module.estimatedDurationHrs && (
                            <span>
                              {formatDuration(module.estimatedDurationHrs)}
                            </span>
                          )}
                          <span>Order: {module.order}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        {expandedModules.has(module.id) ? (
                          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedModules.has(module.id) && (
                    <div className="border-t bg-gray-50 p-4">
                      {module.body && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Module Content:
                          </h4>
                          <div
                            className="prose prose-sm max-w-none text-gray-700"
                            dangerouslySetInnerHTML={{ __html: module.body }}
                          />
                        </div>
                      )}

                      {module.assets && module.assets.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">
                            Assets ({module.assets.length}):
                          </h4>
                          <div className="space-y-3">
                            {module.assets
                              .sort((a, b) => (a.order || 0) - (b.order || 0))
                              .map((asset) => (
                                <AssetDisplay key={asset.id} asset={asset} />
                              ))}
                          </div>
                        </div>
                      )}

                      {(!module.assets || module.assets.length === 0) && (
                        <div className="text-center py-4 text-gray-500">
                          <DocumentTextIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p>No assets in this module yet.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminCoursePreview;
