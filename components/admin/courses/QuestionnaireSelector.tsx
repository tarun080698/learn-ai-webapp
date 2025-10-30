"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";

interface Questionnaire {
  id: string;
  title: string;
  description?: string;
  questions: Array<{
    id: string;
    text: string;
    type: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface QuestionnaireAssignment {
  questionnaireId: string;
  questionnaire?: Questionnaire;
  type: "pre-course" | "post-course" | "pre-module" | "post-module";
  moduleId?: string; // Required for module-specific assignments
  moduleTitle?: string; // For display purposes
}

interface QuestionnaireSelectorProps {
  assignments: QuestionnaireAssignment[];
  onChange: (assignments: QuestionnaireAssignment[]) => void;
  disabled?: boolean;
  availableModules?: Array<{ id: string; title: string; order: number }>;
}

export function QuestionnaireSelector({
  assignments,
  onChange,
  disabled,
  availableModules = [],
}: QuestionnaireSelectorProps) {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchQuestionnaires = useAuthenticatedFetch();

  // Load questionnaires
  useEffect(() => {
    const loadQuestionnaires = async () => {
      try {
        setLoading(true);
        const response = await fetchQuestionnaires("/api/admin/questionnaires");
        if (response.ok) {
          const data = await response.json();
          setQuestionnaires(data.questionnaires || []);
        }
      } catch (error) {
        console.error("Failed to load questionnaires:", error);
      } finally {
        setLoading(false);
      }
    };

    loadQuestionnaires();
  }, [fetchQuestionnaires]);

  const addAssignment = useCallback(
    (
      questionnaireId: string,
      type: QuestionnaireAssignment["type"],
      moduleId?: string
    ) => {
      const questionnaire = questionnaires.find(
        (q) => q.id === questionnaireId
      );
      const moduleData = availableModules.find((m) => m.id === moduleId);

      const newAssignment: QuestionnaireAssignment = {
        questionnaireId,
        questionnaire,
        type,
        moduleId,
        moduleTitle: moduleData?.title,
      };

      // Check for duplicates
      const exists = assignments.some(
        (assignment) =>
          assignment.questionnaireId === questionnaireId &&
          assignment.type === type &&
          assignment.moduleId === moduleId
      );

      if (!exists) {
        onChange([...assignments, newAssignment]);
      }
    },
    [questionnaires, availableModules, assignments, onChange]
  );

  const removeAssignment = useCallback(
    (index: number) => {
      const newAssignments = assignments.filter((_, i) => i !== index);
      onChange(newAssignments);
    },
    [assignments, onChange]
  );

  const getAssignmentsByType = (type: QuestionnaireAssignment["type"]) => {
    return assignments.filter((assignment) => assignment.type === type);
  };

  const getAvailableQuestionnaires = (
    type: QuestionnaireAssignment["type"],
    moduleId?: string
  ) => {
    const assignedIds = assignments
      .filter(
        (assignment) =>
          assignment.type === type && assignment.moduleId === moduleId
      )
      .map((assignment) => assignment.questionnaireId);

    return questionnaires.filter((q) => !assignedIds.includes(q.id));
  };

  const AssignmentSection = ({
    type,
    title,
    description,
    moduleId,
    moduleTitle,
  }: {
    type: QuestionnaireAssignment["type"];
    title: string;
    description: string;
    moduleId?: string;
    moduleTitle?: string;
  }) => {
    const sectionAssignments = getAssignmentsByType(type).filter(
      (assignment) => assignment.moduleId === moduleId
    );
    const availableQuestionnaires = getAvailableQuestionnaires(type, moduleId);
    const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState("");

    const handleAdd = () => {
      if (selectedQuestionnaireId) {
        addAssignment(selectedQuestionnaireId, type, moduleId);
        setSelectedQuestionnaireId("");
      }
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-medium text-gray-900">
              {moduleTitle ? `${title} - ${moduleTitle}` : title}
            </h4>
            <p className=" text-gray-600">{description}</p>
          </div>
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
            {sectionAssignments.length} assigned
          </span>
        </div>

        {/* Assigned Questionnaires */}
        {sectionAssignments.length > 0 && (
          <div className="space-y-2 mb-4">
            {sectionAssignments.map((assignment) => {
              const globalIndex = assignments.indexOf(assignment);
              return (
                <div
                  key={`${assignment.questionnaireId}-${assignment.type}-${assignment.moduleId}`}
                  className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md"
                >
                  <div className="flex-1">
                    <h5 className="font-medium text-green-900">
                      {assignment.questionnaire?.title ||
                        "Unknown Questionnaire"}
                    </h5>
                    <p className=" text-green-700">
                      {assignment.questionnaire?.description ||
                        "No description"}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {assignment.questionnaire?.questions?.length || 0}{" "}
                      questions
                    </p>
                  </div>
                  <button
                    onClick={() => removeAssignment(globalIndex)}
                    disabled={disabled}
                    className="ml-3 text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add New Assignment */}
        {availableQuestionnaires.length > 0 && (
          <div className="flex items-center space-x-2">
            <select
              value={selectedQuestionnaireId}
              onChange={(e) => setSelectedQuestionnaireId(e.target.value)}
              disabled={disabled}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select questionnaire to assign...</option>
              {availableQuestionnaires.map((questionnaire) => (
                <option key={questionnaire.id} value={questionnaire.id}>
                  {questionnaire.title} ({questionnaire.questions?.length || 0}{" "}
                  questions)
                </option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              disabled={disabled || !selectedQuestionnaireId}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed "
            >
              Assign
            </button>
          </div>
        )}

        {availableQuestionnaires.length === 0 &&
          sectionAssignments.length === 0 && (
            <div className="text-center py-4 text-gray-500 ">
              No questionnaires available for assignment
            </div>
          )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading questionnaires...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Questionnaire Assignments ({assignments.length})
          </h2>
          <p className=" text-gray-600 mt-1">
            Assign assessments to evaluate learner progress before and after
            course/module completion
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={disabled}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Create New
        </button>
      </div>

      {questionnaires.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No questionnaires available
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first questionnaire to add assessments to your course
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={disabled}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create First Questionnaire
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Course-Level Assignments */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Course-Level Assessments
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AssignmentSection
                type="pre-course"
                title="Pre-Course Assessment"
                description="Evaluate learner knowledge before starting the course"
              />
              <AssignmentSection
                type="post-course"
                title="Post-Course Assessment"
                description="Evaluate learner knowledge after completing the course"
              />
            </div>
          </div>

          {/* Module-Level Assignments */}
          {availableModules.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Module-Level Assessments
              </h3>
              <div className="space-y-4">
                {availableModules
                  .sort((a, b) => a.order - b.order)
                  .map((module) => (
                    <div
                      key={module.id}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <h4 className="font-medium text-gray-900 mb-3">
                        Module {module.order + 1}: {module.title}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AssignmentSection
                          type="pre-module"
                          title="Pre-Module Assessment"
                          description="Evaluate readiness before this module"
                          moduleId={module.id}
                          moduleTitle={module.title}
                        />
                        <AssignmentSection
                          type="post-module"
                          title="Post-Module Assessment"
                          description="Evaluate understanding after this module"
                          moduleId={module.id}
                          moduleTitle={module.title}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assignment Summary */}
      {assignments.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className=" font-medium text-blue-900 mb-2">
            Assignment Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ">
            <div className="text-blue-800">
              <span className="font-medium">Pre-Course:</span>{" "}
              {getAssignmentsByType("pre-course").length}
            </div>
            <div className="text-blue-800">
              <span className="font-medium">Post-Course:</span>{" "}
              {getAssignmentsByType("post-course").length}
            </div>
            <div className="text-blue-800">
              <span className="font-medium">Pre-Module:</span>{" "}
              {getAssignmentsByType("pre-module").length}
            </div>
            <div className="text-blue-800">
              <span className="font-medium">Post-Module:</span>{" "}
              {getAssignmentsByType("post-module").length}
            </div>
          </div>
        </div>
      )}

      {/* Quick Create Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create New Questionnaire
            </h3>
            <p className="text-gray-600 mb-4">
              This will redirect you to the questionnaire builder. You can
              return to continue creating your course.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  // Navigate to questionnaire builder
                  window.open("/admin/questionnaires/new", "_blank");
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Open Builder
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
