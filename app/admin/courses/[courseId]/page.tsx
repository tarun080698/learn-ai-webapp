/**
 * Admin Course Preview Page
 * Comprehensive preview of course with all details, modules, and assets
 */
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/utils/helper";

import { useAuth } from "@/app/(auth)/AuthProvider";
import { getCourseComplete } from "@/lib/api/admin";
import {
  CourseDoc,
  ModuleDoc,
  ModuleAsset,
  QuestionnaireAssignmentDoc,
} from "@/types/models";
import {
  BookOpenIcon,
  PlayIcon,
  PhotoIcon,
  DocumentIcon,
  LinkIcon,
  PencilIcon,
  ClockIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
  ArrowLeftIcon,
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

export default function AdminCoursePreviewPage() {
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
    overview: true,
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

  // Asset icon helper
  const getAssetIcon = (kind: string) => {
    switch (kind) {
      case "video":
        return <PlayIcon className="w-5 h-5 text-blue-600" />;
      case "image":
        return <PhotoIcon className="w-5 h-5 text-green-600" />;
      case "pdf":
        return <DocumentIcon className="w-5 h-5 text-red-600" />;
      case "link":
        return <LinkIcon className="w-5 h-5 text-purple-600" />;
      default:
        return <DocumentTextIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  // Asset type label helper
  const getAssetTypeLabel = (kind: string) => {
    const labels: Record<string, string> = {
      video: "Video",
      image: "Image",
      pdf: "PDF Document",
      link: "External Link",
    };
    return labels[kind] || kind;
  };

  // Asset display component
  const AssetDisplay = ({ asset }: { asset: ModuleAsset }) => (
    <div className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-1">{getAssetIcon(asset.kind)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 truncate">
              {asset.title || "Untitled Asset"}
            </h4>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {getAssetTypeLabel(asset.kind)}
            </span>
          </div>
          {asset.body && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {asset.body}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Order: {asset.order}</span>
            {asset.meta?.size && typeof asset.meta.size === "number" ? (
              <span>Size: {formatFileSize(asset.meta.size)}</span>
            ) : null}
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
    </div>
  );

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
        {/* Header with Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Courses
              </Link>
              <div className="w-px h-6 bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">
                {course.title}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
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
              <Link
                href={`/admin/courses/${courseId}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PencilIcon className="w-4 h-4" />
                Edit Course
              </Link>
            </div>
          </div>
        </div>

        {/* Course Overview */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6 border-b border-gray-200">
            <button
              onClick={() => toggleSection("overview")}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                Course Overview
              </h2>
              {expandedSections.overview ? (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>

          {expandedSections.overview && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hero Image */}
                <div className="lg:col-span-1">
                  <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                    {course.heroImageUrl ? (
                      <Image
                        src={course.heroImageUrl}
                        alt={course.title}
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

                {/* Course Info */}
                <div className="lg:col-span-2">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Description
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {formatDuration(course.durationMinutes)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AcademicCapIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 capitalize">
                          {course.level}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpenIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {stats.moduleCount} modules
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {stats.totalAssets} assets
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Created:</span>{" "}
                        {formatDate(
                          (
                            course.createdAt?.toDate?.() || course.createdAt
                          )?.toISOString?.() || new Date().toISOString()
                        )}
                      </div>
                      <div>
                        <span className="font-medium">Last Updated:</span>{" "}
                        {formatDate(
                          (
                            course.updatedAt?.toDate?.() || course.updatedAt
                          )?.toISOString?.() || new Date().toISOString()
                        )}
                      </div>
                      {course.publishedAt && (
                        <div>
                          <span className="font-medium">Published:</span>{" "}
                          {formatDate(
                            (
                              course.publishedAt?.toDate?.() ||
                              course.publishedAt
                            )?.toISOString?.() || new Date().toISOString()
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modules Section */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6 border-b border-gray-200">
            <button
              onClick={() => toggleSection("modules")}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                Course Modules ({modules.length})
              </h2>
              {expandedSections.modules ? (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>

          {expandedSections.modules && (
            <div className="p-6">
              {modules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No modules created yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {modules.map((module, index) => (
                    <div
                      key={module.id}
                      className="border rounded-lg overflow-hidden"
                    >
                      <div className="p-4 bg-gray-50 border-b">
                        <button
                          onClick={() => toggleModule(module.id)}
                          className="flex items-center justify-between w-full text-left"
                        >
                          <div className="flex items-center gap-3">
                            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-1 rounded-full">
                              {index + 1}
                            </span>
                            <h3 className="text-lg font-medium text-gray-900">
                              {module.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>
                                {formatDuration(module.estMinutes)} min
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
                          {expandedModules[module.id] ? (
                            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </div>

                      {expandedModules[module.id] && (
                        <div className="p-4 space-y-4">
                          {/* Module Content */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">
                              Summary
                            </h4>
                            <p className="text-gray-700">{module.summary}</p>
                          </div>

                          {module.body && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">
                                Content
                              </h4>
                              <div className="prose prose-sm max-w-none bg-gray-50 rounded-lg p-4">
                                <div className="whitespace-pre-wrap text-gray-700">
                                  {module.body}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Primary Content */}
                          {module.contentUrl && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">
                                Primary Content
                              </h4>
                              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                                {getAssetIcon(module.contentType)}
                                <span className="text-sm text-gray-700 capitalize">
                                  {module.contentType} Content
                                </span>
                                <a
                                  href={module.contentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-auto p-1 text-blue-600 hover:bg-blue-100 rounded"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Module Assets */}
                          {module.assets && module.assets.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">
                                Assets ({module.assets.length})
                              </h4>
                              <div className="space-y-2">
                                {module.assets.map((asset: ModuleAsset) => (
                                  <AssetDisplay key={asset.id} asset={asset} />
                                ))}
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
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <button
              onClick={() => toggleSection("assignments")}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                Assessments ({assignments.length})
              </h2>
              {expandedSections.assignments ? (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>

          {expandedSections.assignments && (
            <div className="p-6">
              {assignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No assessments assigned yet.
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
                          <p className="text-sm text-gray-600 mt-1">
                            {assignment.questionnaire?.purpose}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
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
                      </div>
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
