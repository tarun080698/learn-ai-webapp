/**
 * Admin Questionnaires Page
 * Lists and manages questionnaire templates
 */
"use client";

import React, { useState } from "react";
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Questionnaires</h1>
          <p className="text-gray-600 mt-1">
            Manage your surveys, quizzes, and assessments
          </p>
        </div>
        <button
          onClick={() => setView("create")}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          ➕ Create Questionnaire
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div className="text-red-800">
              <strong>Error:</strong> {error}
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <span className=" font-medium text-gray-700">Filter by purpose:</span>
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
              className={`px-3 py-1 rounded-md  font-medium ${
                filter === value
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="text-gray-600">Loading questionnaires...</div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredQuestionnaires.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-600 mb-4">
            {filter === "all"
              ? "No questionnaires found. Create your first one!"
              : `No ${filter}s found.`}
          </div>
          {filter === "all" && (
            <button
              onClick={() => setView("create")}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
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
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {questionnaire.title}
                  </h3>
                  <div className="flex items-center gap-2  text-gray-600">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        questionnaire.purpose === "quiz"
                          ? "bg-blue-100 text-blue-700"
                          : questionnaire.purpose === "assessment"
                          ? "bg-green-100 text-green-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {questionnaire.purpose}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mb-4">
                <div className=" text-gray-600">
                  {questionnaire.questions.length} question
                  {questionnaire.questions.length !== 1 ? "s" : ""}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Updated {formatDate(questionnaire.updatedAt)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(questionnaire.id)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-200  font-medium"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement assignment modal
                    console.log("Assign questionnaire:", questionnaire.id);
                  }}
                  className="flex-1 bg-blue-100 text-blue-700 py-2 px-3 rounded-md hover:bg-blue-200  font-medium"
                >
                  📋 Assign
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
