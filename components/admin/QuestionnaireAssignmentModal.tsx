/**
 * Questionnaire Assignment Modal
 * Modal for assigning questionnaires to courses or modules with pre/post timing
 */
"use client";

import React, { useState, useEffect } from "react";
import {
  useAuthenticatedFetch,
  useAuthenticatedMutation,
} from "@/hooks/useAuthenticatedFetch";
import { QuestionnaireDoc } from "@/types/models";

interface Questionnaire extends QuestionnaireDoc {
  id: string;
}

interface QuestionnaireAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courseId: string;
  moduleId?: string;
  existingAssignments?: Array<{
    id: string;
    questionnaireId: string;
    timing: "pre" | "post";
    active: boolean;
  }>;
}

export function QuestionnaireAssignmentModal({
  isOpen,
  onClose,
  onSuccess,
  courseId,
  moduleId,
  existingAssignments = [],
}: QuestionnaireAssignmentModalProps) {
  const authenticatedFetch = useAuthenticatedFetch();
  const createAssignmentApi = useAuthenticatedMutation();
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState("");
  const [timing, setTiming] = useState<"pre" | "post">("pre");

  // Load questionnaires when modal opens
  useEffect(() => {
    const loadQuestionnaires = async () => {
      if (!isOpen) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch(
          "/api/admin/questionnaires.mine?limit=100"
        );
        const data = await response.json();
        setQuestionnaires(data.questionnaires || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load questionnaires"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadQuestionnaires();
    }
  }, [isOpen, authenticatedFetch]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedQuestionnaireId("");
      setTiming("pre");
      setError(null);
    }
  }, [isOpen]);

  // Check if assignment already exists
  const isAssignmentExists = (
    questionnaireId: string,
    timingValue: "pre" | "post"
  ) => {
    return existingAssignments.some(
      (assignment) =>
        assignment.questionnaireId === questionnaireId &&
        assignment.timing === timingValue
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedQuestionnaireId) {
      setError("Please select a questionnaire");
      return;
    }

    if (isAssignmentExists(selectedQuestionnaireId, timing)) {
      setError(
        `A ${timing}-${
          moduleId ? "module" : "course"
        } assignment already exists for this questionnaire`
      );
      return;
    }

    try {
      const payload = {
        questionnaireId: selectedQuestionnaireId,
        scope: {
          type: moduleId ? "module" : "course",
          courseId,
          ...(moduleId && { moduleId }),
        },
        timing,
        active: true,
      };

      await createAssignmentApi.mutate("/api/admin/assignment.upsert", payload);

      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create assignment"
      );
    }
  };

  const handleClose = () => {
    setSelectedQuestionnaireId("");
    setTiming("pre");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 border border-black">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-black">
              Assign Questionnaire
            </h2>
            <button
              onClick={handleClose}
              className="text-black hover:text-black"
            >
              ✕
            </button>
          </div>

          {/* Scope Info */}
          <div className="mb-4 p-3 bg-white border border-black rounded-lg">
            <div className=" text-black">
              Assigning to:{" "}
              <span className="font-medium capitalize">
                {moduleId ? "module" : "course"}
              </span>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-white border border-black text-black rounded-lg ">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8 text-black">
              Loading questionnaires...
            </div>
          )}

          {/* Form */}
          {!isLoading && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Questionnaire Selection */}
              <div>
                <label
                  htmlFor="questionnaire"
                  className="block  font-medium text-black mb-1"
                >
                  Select Questionnaire
                </label>
                <select
                  id="questionnaire"
                  value={selectedQuestionnaireId}
                  onChange={(e) => setSelectedQuestionnaireId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                >
                  <option value="">Choose a questionnaire...</option>
                  {questionnaires.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title} ({q.purpose})
                    </option>
                  ))}
                </select>
              </div>

              {/* Timing Selection */}
              <div>
                <label className="block  font-medium text-black mb-2">
                  Timing
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="timing"
                      value="pre"
                      checked={timing === "pre"}
                      onChange={(e) =>
                        setTiming(e.target.value as "pre" | "post")
                      }
                      className="mr-2"
                    />
                    <span className=" text-black">
                      Pre-{moduleId ? "Module" : "Course"}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="timing"
                      value="post"
                      checked={timing === "post"}
                      onChange={(e) =>
                        setTiming(e.target.value as "pre" | "post")
                      }
                      className="mr-2"
                    />
                    <span className=" text-black">
                      Post-{moduleId ? "Module" : "Course"}
                    </span>
                  </label>
                </div>
              </div>

              {questionnaires.length === 0 && !isLoading && (
                <div className="text-center py-4 text-black">
                  <div className="mb-2">No questionnaires available</div>
                  <div className="">Create a questionnaire first</div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 text-black bg-white border border-black rounded-lg hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createAssignmentApi.loading || !selectedQuestionnaireId
                  }
                  className="flex-1 px-4 py-2 bg-white text-black border border-black rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {createAssignmentApi.loading ? "Assigning..." : "Assign"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
