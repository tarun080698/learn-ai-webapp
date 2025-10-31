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
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
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
          (q: QuestionnaireDoc & { id: string }) => q.id === questionnaireId
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
            (a: QuestionnaireAssignmentDoc & { id: string }) =>
              a.questionnaireId === questionnaireId
          ) || [];

        // Calculate stats
        const stats = {
          assignmentCount: assignments.length,
          questionCount: questionnaire.questions?.length || 0,
          activeAssignments: assignments.filter(
            (a: QuestionnaireAssignmentDoc & { id: string }) => a.active
          ).length,
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
        return (
          <CheckCircleIcon
            className="w-5 h-5"
            style={{ color: "var(--primary)" }}
          />
        );
      case "multi":
        return (
          <ListBulletIcon
            className="w-5 h-5"
            style={{ color: "var(--accent)" }}
          />
        );
      case "scale":
        return (
          <ScaleIcon
            className="w-5 h-5"
            style={{ color: "var(--destructive)" }}
          />
        );
      case "text":
        return (
          <ChatBubbleLeftRightIcon
            className="w-5 h-5"
            style={{ color: "var(--secondary)" }}
          />
        );
      default:
        return (
          <DocumentTextIcon
            className="w-5 h-5"
            style={{ color: "var(--secondary-60)" }}
          />
        );
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

  // Question display component
  const QuestionDisplay = ({
    question,
    index,
  }: {
    question: QuestionnaireQuestion;
    index: number;
  }) => (
    <div
      className="rounded-xl p-4 transition-colors"
      style={{
        border: "1px solid var(--secondary-15)",
        backgroundColor: "var(--card)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--secondary-5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "var(--card)";
      }}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-1">
          {getQuestionTypeIcon(question.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className=" font-medium px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: "var(--secondary-10)",
                color: "var(--secondary)",
                border: "1px solid var(--secondary-15)",
              }}
            >
              Q{index + 1}
            </span>
            <span
              className="text-xs px-2 py-1 rounded-full"
              style={{
                backgroundColor: "var(--primary-10)",
                color: "var(--primary)",
                border: "1px solid var(--primary-10)",
              }}
            >
              {getQuestionTypeLabel(question.type)}
            </span>
            {question.required && (
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{
                  backgroundColor: "var(--destructive-10)",
                  color: "var(--destructive)",
                  border: "1px solid var(--destructive-10)",
                }}
              >
                Required
              </span>
            )}
          </div>
          <h4
            className="font-medium mb-2"
            style={{ color: "var(--secondary)" }}
          >
            {question.prompt}
          </h4>

          {/* Question options for choice types */}
          {(question.type === "single" || question.type === "multi") &&
            question.options && (
              <div className="space-y-1 ml-4">
                {question.options.map(
                  (
                    option: string | { label: string; correct?: boolean },
                    optIndex: number
                  ) => (
                    <div
                      key={optIndex}
                      className="flex items-center gap-2  text-secondary/70"
                    >
                      <div
                        className={`w-3 h-3 rounded-${
                          question.type === "single" ? "full" : "sm"
                        } border-2 border-secondary/30`}
                      ></div>
                      <span>
                        {typeof option === "string" ? option : option.label}
                      </span>
                      {typeof option === "object" && option.correct && (
                        <CheckCircleIcon className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  )
                )}
              </div>
            )}

          {/* Scale range for scale type */}
          {question.type === "scale" && (
            <div className="ml-4  text-secondary/70">
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
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderBottomColor: "var(--primary)" }}
          ></div>
          <p style={{ color: "var(--secondary-70)" }}>
            Loading questionnaire...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="text-center">
          <div className="mb-4" style={{ color: "var(--destructive)" }}>
            Error: {error}
          </div>
          <Link
            href="/admin/questionnaires"
            className="transition-colors"
            style={{ color: "var(--primary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--primary-80)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--primary)";
            }}
          >
            ← Back to Questionnaires
          </Link>
        </div>
      </div>
    );
  }

  if (!questionnaireData) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="text-center">
          <div className="mb-4" style={{ color: "var(--secondary-70)" }}>
            Questionnaire not found
          </div>
          <Link
            href="/admin/questionnaires"
            className="transition-colors"
            style={{ color: "var(--primary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--primary-80)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--primary)";
            }}
          >
            ← Back to Questionnaires
          </Link>
        </div>
      </div>
    );
  }

  const { questionnaire, assignments, stats } = questionnaireData;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with Navigation */}
        <div
          className="rounded-2xl mb-6 p-6"
          style={{
            backgroundColor: "var(--card)",
            boxShadow:
              "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
            border: "1px solid var(--secondary-15)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/questionnaires"
                className="flex items-center gap-2 transition-colors"
                style={{ color: "var(--secondary-70)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--secondary-70)";
                }}
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Questionnaires
              </Link>
              <div
                className="w-px h-6"
                style={{ backgroundColor: "var(--secondary-20)" }}
              ></div>
              <h1
                className="text-2xl font-bold"
                style={{ color: "var(--secondary)" }}
              >
                {questionnaire.title}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="px-3 py-1 rounded-full  font-medium"
                style={{
                  backgroundColor: questionnaire.archived
                    ? "var(--secondary-10)"
                    : "var(--primary-10)",
                  color: questionnaire.archived
                    ? "var(--secondary)"
                    : "var(--primary)",
                  border: `1px solid ${
                    questionnaire.archived
                      ? "var(--secondary-15)"
                      : "var(--primary-10)"
                  }`,
                }}
              >
                {questionnaire.archived ? "Archived" : "Active"}
              </span>
              <span
                className="px-3 py-1 rounded-full  font-medium capitalize"
                style={{
                  backgroundColor:
                    questionnaire.purpose === "quiz"
                      ? "var(--primary-10)"
                      : questionnaire.purpose === "assessment"
                      ? "var(--accent-10)"
                      : "var(--secondary-10)",
                  color:
                    questionnaire.purpose === "quiz"
                      ? "var(--primary)"
                      : questionnaire.purpose === "assessment"
                      ? "var(--accent)"
                      : "var(--secondary)",
                  border: `1px solid ${
                    questionnaire.purpose === "quiz"
                      ? "var(--primary-10)"
                      : questionnaire.purpose === "assessment"
                      ? "var(--accent-10)"
                      : "var(--secondary-15)"
                  }`,
                }}
              >
                {questionnaire.purpose}
              </span>
              <Link
                href={`/admin/questionnaires/${questionnaireId}/edit`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--primary-90)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--primary)";
                }}
              >
                <PencilIcon className="w-4 h-4" />
                Edit Questionnaire
              </Link>
            </div>
          </div>
        </div>

        {/* Questionnaire Overview */}
        <div
          style={{
            backgroundColor: "var(--card)",
            borderRadius: "16px",
            boxShadow:
              "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
            border: "1px solid var(--secondary-15)",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              padding: "24px",
              borderBottom: "1px solid var(--secondary-15)",
            }}
          >
            <button
              onClick={() => toggleSection("overview")}
              className="flex items-center justify-between w-full text-left"
            >
              <h2
                className="text-xl font-semibold"
                style={{ color: "var(--secondary)" }}
              >
                Questionnaire Overview
              </h2>
              {expandedSections.overview ? (
                <ChevronDownIcon
                  className="w-5 h-5"
                  style={{ color: "var(--secondary-50)" }}
                />
              ) : (
                <ChevronRightIcon
                  className="w-5 h-5"
                  style={{ color: "var(--secondary-50)" }}
                />
              )}
            </button>
          </div>

          {expandedSections.overview && (
            <div style={{ padding: "24px" }}>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Stats Cards */}
                <div
                  style={{
                    backgroundColor: "var(--primary-10)",
                    borderRadius: "12px",
                    padding: "16px",
                    border: "1px solid var(--primary-20)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <DocumentTextIcon
                      className="w-8 h-8"
                      style={{ color: "var(--primary)" }}
                    />
                    <div>
                      <div
                        className="text-2xl font-bold"
                        style={{ color: "var(--secondary)" }}
                      >
                        {stats.questionCount}
                      </div>
                      <div className="" style={{ color: "var(--primary)" }}>
                        Questions
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "var(--accent-10)",
                    borderRadius: "12px",
                    padding: "16px",
                    border: "1px solid var(--accent-20)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <ClipboardDocumentListIcon
                      className="w-8 h-8"
                      style={{ color: "var(--accent)" }}
                    />
                    <div>
                      <div
                        className="text-2xl font-bold"
                        style={{ color: "var(--secondary)" }}
                      >
                        {stats.assignmentCount}
                      </div>
                      <div className="" style={{ color: "var(--accent)" }}>
                        Assignments
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "var(--destructive-10)",
                    borderRadius: "12px",
                    padding: "16px",
                    border: "1px solid var(--destructive-20)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon
                      className="w-8 h-8"
                      style={{ color: "var(--destructive)" }}
                    />
                    <div>
                      <div
                        className="text-2xl font-bold"
                        style={{ color: "var(--secondary)" }}
                      >
                        {stats.activeAssignments}
                      </div>
                      <div className="" style={{ color: "var(--destructive)" }}>
                        Active
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "var(--secondary-10)",
                    borderRadius: "12px",
                    padding: "16px",
                    border: "1px solid var(--secondary-20)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <StarIcon
                      className="w-8 h-8"
                      style={{ color: "var(--secondary)" }}
                    />
                    <div>
                      <div
                        className="text-2xl font-bold capitalize"
                        style={{ color: "var(--secondary)" }}
                      >
                        {questionnaire.purpose}
                      </div>
                      <div
                        className=""
                        style={{ color: "var(--secondary-70)" }}
                      >
                        Type
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="mt-6 grid grid-cols-2 gap-4 "
                style={{ color: "var(--secondary-70)" }}
              >
                <div>
                  <span
                    className="font-medium"
                    style={{ color: "var(--secondary)" }}
                  >
                    Created:
                  </span>{" "}
                  {formatDate(
                    (
                      questionnaire.createdAt?.toDate?.() ||
                      questionnaire.createdAt
                    )?.toISOString?.() || new Date().toISOString()
                  )}
                </div>
                <div>
                  <span
                    className="font-medium"
                    style={{ color: "var(--secondary)" }}
                  >
                    Last Updated:
                  </span>{" "}
                  {formatDate(
                    (
                      questionnaire.updatedAt?.toDate?.() ||
                      questionnaire.updatedAt
                    )?.toISOString?.() || new Date().toISOString()
                  )}
                </div>
                {questionnaire.archivedAt && (
                  <div>
                    <span className="font-medium text-secondary">
                      Archived:
                    </span>{" "}
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
        <div
          style={{
            backgroundColor: "var(--card)",
            borderRadius: "16px",
            boxShadow:
              "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
            border: "1px solid var(--secondary-15)",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              padding: "24px",
              borderBottom: "1px solid var(--secondary-15)",
            }}
          >
            <button
              onClick={() => toggleSection("questions")}
              className="flex items-center justify-between w-full text-left"
            >
              <h2
                className="text-xl font-semibold"
                style={{ color: "var(--secondary)" }}
              >
                Questions ({questionnaire.questions?.length || 0})
              </h2>
              {expandedSections.questions ? (
                <ChevronDownIcon
                  className="w-5 h-5"
                  style={{ color: "var(--secondary-50)" }}
                />
              ) : (
                <ChevronRightIcon
                  className="w-5 h-5"
                  style={{ color: "var(--secondary-50)" }}
                />
              )}
            </button>
          </div>

          {expandedSections.questions && (
            <div style={{ padding: "24px" }}>
              {!questionnaire.questions ||
              questionnaire.questions.length === 0 ? (
                <div
                  className="text-center py-8"
                  style={{ color: "var(--secondary-60)" }}
                >
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
        <div
          style={{
            backgroundColor: "var(--card)",
            borderRadius: "16px",
            boxShadow:
              "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
            border: "1px solid var(--secondary-15)",
          }}
        >
          <div
            style={{
              padding: "24px",
              borderBottom: "1px solid var(--secondary-15)",
            }}
          >
            <button
              onClick={() => toggleSection("assignments")}
              className="flex items-center justify-between w-full text-left"
            >
              <h2
                className="text-xl font-semibold"
                style={{ color: "var(--secondary)" }}
              >
                Course Assignments ({assignments.length})
              </h2>
              {expandedSections.assignments ? (
                <ChevronDownIcon
                  className="w-5 h-5"
                  style={{ color: "var(--secondary-50)" }}
                />
              ) : (
                <ChevronRightIcon
                  className="w-5 h-5"
                  style={{ color: "var(--secondary-50)" }}
                />
              )}
            </button>
          </div>

          {expandedSections.assignments && (
            <div style={{ padding: "24px" }}>
              {assignments.length === 0 ? (
                <div
                  className="text-center py-8"
                  style={{ color: "var(--secondary-60)" }}
                >
                  No assignments created yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      style={{
                        border: "1px solid var(--secondary-15)",
                        borderRadius: "12px",
                        padding: "16px",
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3
                            className="font-medium"
                            style={{ color: "var(--secondary)" }}
                          >
                            {assignment.scope.type === "course"
                              ? "Course Assignment"
                              : "Module Assignment"}
                          </h3>
                          <p
                            className=" mt-1"
                            style={{ color: "var(--secondary-70)" }}
                          >
                            {assignment.timing === "pre" ? "Pre-" : "Post-"}
                            {assignment.scope.type} questionnaire
                          </p>
                          <div
                            className="flex items-center gap-4 mt-2 "
                            style={{ color: "var(--secondary-60)" }}
                          >
                            <span>Course ID: {assignment.scope.courseId}</span>
                            {assignment.scope.moduleId && (
                              <span>
                                Module ID: {assignment.scope.moduleId}
                              </span>
                            )}
                            <span
                              className="px-2 py-1 rounded-full text-xs"
                              style={{
                                backgroundColor: assignment.active
                                  ? "var(--primary-10)"
                                  : "var(--secondary-10)",
                                color: assignment.active
                                  ? "var(--primary)"
                                  : "var(--secondary)",
                                border: `1px solid ${
                                  assignment.active
                                    ? "var(--primary-20)"
                                    : "var(--secondary-20)"
                                }`,
                              }}
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
