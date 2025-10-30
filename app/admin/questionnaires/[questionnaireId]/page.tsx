/**
 * Admin Questionnaire View Page
 * Comprehensive view of questionnaire with questions and assignments
 */
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/utils/helper";

import { useAuth } from "@/app/(auth)/AuthProvider";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import {
  QuestionnaireDoc,
  QuestionnaireAssignmentDoc,
  QuestionnaireQuestion,
} from "@/types/models";
import {
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  PencilIcon,
  ClockIcon,
  UserGroupIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  ListBulletIcon,
  ScaleIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

// Interface for complete questionnaire data
interface CompleteQuestionnaireData {
  questionnaire: QuestionnaireDoc & { id: string };
  assignments: (QuestionnaireAssignmentDoc & {
    id: string;
    courseName?: string;
    moduleName?: string;
  })[];
  stats: {
    assignmentCount: number;
    questionCount: number;
    activeAssignments: number;
  };
}

export default function AdminQuestionnaireViewPage() {
  const params = useParams();
  const questionnaireId = params.questionnaireId as string;
  const { firebaseUser } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();

  const [questionnaireData, setQuestionnaireData] =
    useState<CompleteQuestionnaireData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    questions: true,
    assignments: true,
  });

  // Load complete questionnaire data
  useEffect(() => {
    const loadQuestionnaireData = async () => {
      if (!firebaseUser || !questionnaireId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch questionnaire details from admin questionnaires endpoint
        const questionnairesResponse = await authenticatedFetch(
          `/api/admin/questionnaires.mine`
        );
        const questionnairesData = await questionnairesResponse.json();

        // Find the specific questionnaire
        const questionnaire = questionnairesData.questionnaires?.find(
          (q: any) => q.id === questionnaireId
        );

        if (!questionnaire) {
          throw new Error("Questionnaire not found");
        }

        // Fetch assignments for this questionnaire
        const assignmentsResponse = await authenticatedFetch(
          `/api/admin/assignments.mine`
        );
        const assignmentsData = await assignmentsResponse.json();

        // Filter assignments for this questionnaire
        const assignments =
          assignmentsData.assignments?.filter(
            (a: any) => a.questionnaireId === questionnaireId
          ) || [];

        // Calculate stats
        const stats = {
          assignmentCount: assignments.length,
          questionCount: questionnaire.questions?.length || 0,
          activeAssignments: assignments.filter((a: any) => a.active).length,
        };

        setQuestionnaireData({
          questionnaire: { ...questionnaire, id: questionnaireId },
          assignments,
          stats,
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load questionnaire data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestionnaireData();
  }, [firebaseUser, questionnaireId, authenticatedFetch]);

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Question type icon helper
  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case "single":
        return <CheckCircleIcon className="w-5 h-5 text-blue-600" />;
      case "multi":
        return <ListBulletIcon className="w-5 h-5 text-green-600" />;
      case "scale":
        return <ScaleIcon className="w-5 h-5 text-purple-600" />;
      case "text":
        return <ChatBubbleLeftRightIcon className="w-5 h-5 text-orange-600" />;
      default:
        return <DocumentTextIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  // Question type label helper
  const getQuestionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      single: "Single Choice",
      multi: "Multiple Choice",
      scale: "Scale Rating",
      text: "Text Response",
    };
    return labels[type] || type;
  };

  // Purpose badge color helper
  const getPurposeBadgeColor = (purpose: string) => {
    switch (purpose) {
      case "survey":
        return "bg-blue-100 text-blue-800";
      case "quiz":
        return "bg-green-100 text-green-800";
      case "assessment":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Question display component
  const QuestionDisplay = ({
    question,
    index,
  }: {
    question: QuestionnaireQuestion;
    index: number;
  }) => (
    <div className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-1">
          {getQuestionTypeIcon(question.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-1 rounded-full">
              Q{index + 1}
            </span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {getQuestionTypeLabel(question.type)}
            </span>
            {question.required && (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                Required
              </span>
            )}
          </div>
          <h4 className="font-medium text-gray-900 mb-2">{question.prompt}</h4>

          {/* Question options for choice types */}
          {(question.type === "single" || question.type === "multi") &&
            question.options && (
              <div className="space-y-1 ml-4">
                {question.options.map((option: any, optIndex: number) => (
                  <div
                    key={optIndex}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <div
                      className={`w-3 h-3 rounded-${
                        question.type === "single" ? "full" : "sm"
                      } border-2 border-gray-300`}
                    ></div>
                    <span>
                      {typeof option === "string" ? option : option.label}
                    </span>
                    {typeof option === "object" && option.correct && (
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            )}

          {/* Scale range for scale type */}
          {question.type === "scale" && (
            <div className="ml-4 text-sm text-gray-600">
              <span>
                Scale: {question.scale?.min || 1} to {question.scale?.max || 5}
              </span>
            </div>
          )}
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
          <p className="text-gray-600">Loading questionnaire...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <Link
            href="/admin/questionnaires"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Questionnaires
          </Link>
        </div>
      </div>
    );
  }

  if (!questionnaireData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-4">Questionnaire not found</div>
          <Link
            href="/admin/questionnaires"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Questionnaires
          </Link>
        </div>
      </div>
    );
  }

  const { questionnaire, assignments, stats } = questionnaireData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/questionnaires"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Questionnaires
              </Link>
              <div className="w-px h-6 bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">
                {questionnaire.title}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  questionnaire.archived
                    ? "bg-gray-100 text-gray-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {questionnaire.archived ? "Archived" : "Active"}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getPurposeBadgeColor(
                  questionnaire.purpose
                )}`}
              >
                {questionnaire.purpose}
              </span>
              <Link
                href={`/admin/questionnaires/${questionnaireId}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PencilIcon className="w-4 h-4" />
                Edit Questionnaire
              </Link>
            </div>
          </div>
        </div>

        {/* Questionnaire Overview */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6 border-b border-gray-200">
            <button
              onClick={() => toggleSection("overview")}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                Questionnaire Overview
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
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Stats Cards */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <DocumentTextIcon className="w-8 h-8 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold text-blue-900">
                        {stats.questionCount}
                      </div>
                      <div className="text-sm text-blue-600">Questions</div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <ClipboardDocumentListIcon className="w-8 h-8 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold text-green-900">
                        {stats.assignmentCount}
                      </div>
                      <div className="text-sm text-green-600">Assignments</div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <UserGroupIcon className="w-8 h-8 text-purple-600" />
                    <div>
                      <div className="text-2xl font-bold text-purple-900">
                        {stats.activeAssignments}
                      </div>
                      <div className="text-sm text-purple-600">Active</div>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <StarIcon className="w-8 h-8 text-orange-600" />
                    <div>
                      <div className="text-2xl font-bold text-orange-900 capitalize">
                        {questionnaire.purpose}
                      </div>
                      <div className="text-sm text-orange-600">Type</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Created:</span>{" "}
                  {formatDate(
                    (
                      questionnaire.createdAt?.toDate?.() ||
                      questionnaire.createdAt
                    )?.toISOString?.() || new Date().toISOString()
                  )}
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span>{" "}
                  {formatDate(
                    (
                      questionnaire.updatedAt?.toDate?.() ||
                      questionnaire.updatedAt
                    )?.toISOString?.() || new Date().toISOString()
                  )}
                </div>
                {questionnaire.archivedAt && (
                  <div>
                    <span className="font-medium">Archived:</span>{" "}
                    {formatDate(
                      (
                        questionnaire.archivedAt?.toDate?.() ||
                        questionnaire.archivedAt
                      )?.toISOString?.() || new Date().toISOString()
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Questions Section */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6 border-b border-gray-200">
            <button
              onClick={() => toggleSection("questions")}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                Questions ({questionnaire.questions?.length || 0})
              </h2>
              {expandedSections.questions ? (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>

          {expandedSections.questions && (
            <div className="p-6">
              {!questionnaire.questions ||
              questionnaire.questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No questions created yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {questionnaire.questions.map((question, index) => (
                    <QuestionDisplay
                      key={question.id}
                      question={question}
                      index={index}
                    />
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
                Course Assignments ({assignments.length})
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
                  No assignments created yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {assignment.scope.type === "course"
                              ? "Course Assignment"
                              : "Module Assignment"}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {assignment.timing === "pre" ? "Pre-" : "Post-"}
                            {assignment.scope.type} questionnaire
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>Course ID: {assignment.scope.courseId}</span>
                            {assignment.scope.moduleId && (
                              <span>
                                Module ID: {assignment.scope.moduleId}
                              </span>
                            )}
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
