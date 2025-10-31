/**
 * Admin Questionnaires Page
 * Lists and manages questionnaire templates
 */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuestionnaires } from "@/hooks/useQuestionnaires";
import { QuestionnaireBuilder } from "@/components/admin/QuestionnaireBuilder";
import { QuestionnaireDoc } from "@/types/models";
import { formatDate } from "@/utils/dateUtils";

export default function AdminQuestionnairesPage() {
  const {
    questionnaires,
    isLoading,
    error,
    isCreating,
    isUpdating,
    createQuestionnaire,
    updateQuestionnaire,
    getQuestionnaire,
    clearError,
  } = useQuestionnaires();

  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "survey" | "quiz" | "assessment"
  >("all");

  // Filter questionnaires
  const filteredQuestionnaires = questionnaires.filter(
    (q) => filter === "all" || q.purpose === filter
  );

  // Handle create
  const handleCreate = async (data: Partial<QuestionnaireDoc>) => {
    try {
      await createQuestionnaire(data);
      setView("list");
    } catch {
      // Error already handled by hook
    }
  };

  // Handle update
  const handleUpdate = async (data: Partial<QuestionnaireDoc>) => {
    if (!editingId) return;

    try {
      await updateQuestionnaire(editingId, data);
      setView("list");
      setEditingId(null);
    } catch {
      // Error already handled by hook
    }
  };

  // Handle edit
  const handleEdit = (id: string) => {
    setEditingId(id);
    setView("edit");
  };

  // Handle cancel
  const handleCancel = () => {
    setView("list");
    setEditingId(null);
    clearError();
  };

  // Get editing questionnaire
  const editingQuestionnaire = editingId ? getQuestionnaire(editingId) : null;

  if (view === "create") {
    return (
      <QuestionnaireBuilder
        onSave={handleCreate}
        onCancel={handleCancel}
        isLoading={isCreating}
      />
    );
  }

  if (view === "edit" && editingQuestionnaire) {
    return (
      <QuestionnaireBuilder
        questionnaire={editingQuestionnaire}
        onSave={handleUpdate}
        onCancel={handleCancel}
        isLoading={isUpdating}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--secondary)" }}
          >
            Questionnaires
          </h1>
          <p className="mt-1" style={{ color: "var(--secondary-70)" }}>
            Manage your surveys, quizzes, and assessments
          </p>
        </div>
        <button
          onClick={() => setView("create")}
          className="px-4 py-2 rounded-md transition-colors"
          style={{
            backgroundColor: "var(--primary)",
            color: "white",
            boxShadow:
              "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--primary-90)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--primary)";
          }}
        >
          ➕ Create Questionnaire
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div
          className="rounded-md p-4"
          style={{
            backgroundColor: "var(--destructive-10)",
            border: "1px solid var(--destructive-20)",
          }}
        >
          <div className="flex items-center justify-between">
            <div style={{ color: "var(--destructive)" }}>
              <strong>Error:</strong> {error}
            </div>
            <button
              onClick={clearError}
              className="transition-colors"
              style={{ color: "var(--destructive-80)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--destructive)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--destructive-80)";
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <span className="font-medium" style={{ color: "var(--secondary)" }}>
          Filter by purpose:
        </span>
        <div className="flex gap-2">
          {[
            { value: "all", label: "All" },
            { value: "survey", label: "Surveys" },
            { value: "quiz", label: "Quizzes" },
            { value: "assessment", label: "Assessments" },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value as typeof filter)}
              className="px-3 py-1 rounded-md  font-medium transition-colors"
              style={{
                backgroundColor:
                  filter === value ? "var(--primary-10)" : "var(--card)",
                color:
                  filter === value ? "var(--primary)" : "var(--secondary-70)",
                border: `1px solid ${
                  filter === value ? "var(--primary-10)" : "var(--secondary-15)"
                }`,
              }}
              onMouseEnter={(e) => {
                if (filter !== value) {
                  e.currentTarget.style.backgroundColor = "var(--secondary-5)";
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== value) {
                  e.currentTarget.style.backgroundColor = "var(--card)";
                }
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12">
          <div style={{ color: "var(--secondary-70)" }}>
            Loading questionnaires...
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredQuestionnaires.length === 0 && (
        <div className="text-center py-12">
          <div className="mb-4" style={{ color: "var(--secondary-70)" }}>
            {filter === "all"
              ? "No questionnaires found. Create your first one!"
              : `No ${filter}s found.`}
          </div>
          {filter === "all" && (
            <button
              onClick={() => setView("create")}
              className="px-4 py-2 rounded-md transition-colors"
              style={{
                backgroundColor: "var(--primary)",
                color: "white",
                boxShadow:
                  "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--primary-90)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--primary)";
              }}
            >
              ➕ Create Questionnaire
            </button>
          )}
        </div>
      )}

      {/* Questionnaires grid */}
      {!isLoading && filteredQuestionnaires.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuestionnaires.map((questionnaire) => (
            <div
              key={questionnaire.id}
              className="rounded-lg p-6 transition-all duration-200"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--secondary-15)",
                boxShadow:
                  "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 1px 2px rgba(38,70,83,0.06), 0 8px 32px rgba(38,70,83,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)";
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3
                    className="font-semibold mb-1"
                    style={{ color: "var(--secondary)" }}
                  >
                    {questionnaire.title}
                  </h3>
                  <div
                    className="flex items-center gap-2"
                    style={{ color: "var(--secondary-70)" }}
                  >
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
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
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mb-4">
                <div className="" style={{ color: "var(--secondary-70)" }}>
                  {questionnaire.questions.length} question
                  {questionnaire.questions.length !== 1 ? "s" : ""}
                </div>
                <div
                  className="text-xs mt-1"
                  style={{ color: "var(--secondary-50)" }}
                >
                  Updated {formatDate(questionnaire.updatedAt)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/questionnaires/${questionnaire.id}`}
                  className="flex-1 py-2 px-3 rounded-md  font-medium text-center transition-colors"
                  style={{
                    backgroundColor: "var(--primary-10)",
                    color: "var(--primary)",
                    border: "1px solid var(--primary-10)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--primary-10)";
                    e.currentTarget.style.borderColor = "var(--primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--primary-10)";
                    e.currentTarget.style.borderColor = "var(--primary-10)";
                  }}
                >
                  👁️ View
                </Link>
                <button
                  onClick={() => handleEdit(questionnaire.id)}
                  className="flex-1 py-2 px-3 rounded-md  font-medium transition-colors"
                  style={{
                    backgroundColor: "var(--secondary-10)",
                    color: "var(--secondary)",
                    border: "1px solid var(--secondary-15)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--secondary-10)";
                    e.currentTarget.style.borderColor = "var(--secondary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--secondary-10)";
                    e.currentTarget.style.borderColor = "var(--secondary-15)";
                  }}
                >
                  ✏️ Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
