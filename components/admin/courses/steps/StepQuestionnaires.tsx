"use client";

import React, { useState, useCallback } from "react";
import { QuestionnaireSelector } from "../QuestionnaireSelector";
import type { WizardStepProps } from "../../../../lib/types";

interface QuestionnaireAssignment {
  questionnaireId: string;
  questionnaire?: {
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
  };
  type: "pre-course" | "post-course" | "pre-module" | "post-module";
  moduleId?: string;
  moduleTitle?: string;
}

export function StepQuestionnaires({
  wizardState,
  onUpdate,
  onNext,
  onPrevious,
}: WizardStepProps) {
  const [assignments, setAssignments] = useState<QuestionnaireAssignment[]>(
    () => {
      // Convert existing wizard state assignments to QuestionnaireAssignment format
      const initialAssignments: QuestionnaireAssignment[] = [];

      // Course-level assignments
      if (wizardState.assignments.course.pre?.questionnaireId) {
        initialAssignments.push({
          questionnaireId: wizardState.assignments.course.pre.questionnaireId,
          type: "pre-course",
        });
      }
      if (wizardState.assignments.course.post?.questionnaireId) {
        initialAssignments.push({
          questionnaireId: wizardState.assignments.course.post.questionnaireId,
          type: "post-course",
        });
      }

      // Module-level assignments
      Object.entries(wizardState.assignments.modules).forEach(
        ([moduleId, moduleAssignments]) => {
          const moduleData = wizardState.modules.find((m) => m.id === moduleId);
          const moduleTitle = moduleData?.title || "Unknown Module";

          if (moduleAssignments.pre?.questionnaireId) {
            initialAssignments.push({
              questionnaireId: moduleAssignments.pre.questionnaireId,
              type: "pre-module",
              moduleId,
              moduleTitle,
            });
          }
          if (moduleAssignments.post?.questionnaireId) {
            initialAssignments.push({
              questionnaireId: moduleAssignments.post.questionnaireId,
              type: "post-module",
              moduleId,
              moduleTitle,
            });
          }
        }
      );

      return initialAssignments;
    }
  );

  // Available modules for assignment
  const availableModules = wizardState.modules.map((module, index) => ({
    id: module.id || `temp-${index}`,
    title: module.title || `Module ${index + 1}`,
    order: index,
  }));

  const handleAssignmentsChange = useCallback(
    (newAssignments: QuestionnaireAssignment[]) => {
      setAssignments(newAssignments);
    },
    []
  );

  const handleNext = useCallback(() => {
    // Convert QuestionnaireAssignment back to wizard state format
    const updatedAssignments = {
      course: {
        pre: undefined as
          | { questionnaireId: string; active: boolean }
          | undefined,
        post: undefined as
          | { questionnaireId: string; active: boolean }
          | undefined,
      },
      modules: {} as Record<
        string,
        {
          pre?: { questionnaireId: string; active: boolean };
          post?: { questionnaireId: string; active: boolean };
        }
      >,
    };

    assignments.forEach((assignment) => {
      if (assignment.type === "pre-course") {
        updatedAssignments.course.pre = {
          questionnaireId: assignment.questionnaireId,
          active: true,
        };
      } else if (assignment.type === "post-course") {
        updatedAssignments.course.post = {
          questionnaireId: assignment.questionnaireId,
          active: true,
        };
      } else if (assignment.type === "pre-module" && assignment.moduleId) {
        if (!updatedAssignments.modules[assignment.moduleId]) {
          updatedAssignments.modules[assignment.moduleId] = {};
        }
        updatedAssignments.modules[assignment.moduleId].pre = {
          questionnaireId: assignment.questionnaireId,
          active: true,
        };
      } else if (assignment.type === "post-module" && assignment.moduleId) {
        if (!updatedAssignments.modules[assignment.moduleId]) {
          updatedAssignments.modules[assignment.moduleId] = {};
        }
        updatedAssignments.modules[assignment.moduleId].post = {
          questionnaireId: assignment.questionnaireId,
          active: true,
        };
      }
    });

    onUpdate({ assignments: updatedAssignments });
    onNext();
  }, [assignments, onUpdate, onNext]);

  return (
    <div className="bg-white rounded-2xl p-8 shadow-[0_1px_2px_rgba(38,70,83,0.06),0_8px_24px_rgba(38,70,83,0.08)]">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Assessment & Questionnaires
        </h2>
        <p className="text-gray-600 text-lg">
          Assign questionnaires to evaluate learner knowledge and progress
          throughout your course.
        </p>
      </div>

      {/* Enhanced Questionnaire Selector */}
      <div className="mb-8">
        <QuestionnaireSelector
          assignments={assignments}
          onChange={handleAssignmentsChange}
          disabled={false}
          availableModules={availableModules}
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onPrevious}
          className="px-6 py-3 border border-gray-300 rounded-md shadow-sm  font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="px-6 py-3 border border-transparent rounded-md shadow-sm  font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          {assignments.length === 0
            ? "Skip Assessments"
            : "Next: Review & Create"}
        </button>
      </div>

      {/* Progress Indicator */}
      {assignments.length > 0 && (
        <div className="mt-4 text-center">
          <p className=" text-gray-600">
            {assignments.length} assessment{assignments.length !== 1 ? "s" : ""}{" "}
            configured
            {" • "}
            {assignments.filter((a) => a.type.includes("course")).length}{" "}
            course-level
            {" • "}
            {assignments.filter((a) => a.type.includes("module")).length}{" "}
            module-level
          </p>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className=" font-medium text-blue-900 mb-2">
          Assessment Strategy Tips
        </h4>
        <ul className=" text-blue-800 space-y-1">
          <li>
            • <strong>Pre-Course:</strong> Test baseline knowledge and set
            expectations
          </li>
          <li>
            • <strong>Post-Course:</strong> Evaluate overall learning outcomes
            and satisfaction
          </li>
          <li>
            • <strong>Pre-Module:</strong> Assess readiness for specific module
            content
          </li>
          <li>
            • <strong>Post-Module:</strong> Check understanding before moving to
            next module
          </li>
        </ul>
      </div>
    </div>
  );
}
