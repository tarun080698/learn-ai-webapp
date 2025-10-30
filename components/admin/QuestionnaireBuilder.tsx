/**
 * QuestionnaireBuilder component
 * Advanced interface for creating and editing questionnaire templates
 */
"use client";

import React, { useState, useCallback } from "react";
import { QuestionnaireDoc, Question } from "@/types/models";

export interface QuestionnaireBuilderProps {
  questionnaire?: QuestionnaireDoc & { id: string };
  onSave?: (questionnaire: Partial<QuestionnaireDoc>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function QuestionnaireBuilder({
  questionnaire,
  onSave,
  onCancel,
  isLoading = false,
}: QuestionnaireBuilderProps) {
  const [formData, setFormData] = useState({
    title: questionnaire?.title || "",
    purpose:
      questionnaire?.purpose || ("survey" as "survey" | "quiz" | "assessment"),
  });

  const [questions, setQuestions] = useState<Question[]>(
    questionnaire?.questions || []
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Add new question
  const addQuestion = useCallback(() => {
    const newQuestion: Question = {
      id: `q${Date.now()}`,
      type: "single",
      prompt: "",
      options: [
        { id: "opt1", label: "" },
        { id: "opt2", label: "" },
      ],
      required: true,
    };
    setQuestions((prev) => [...prev, newQuestion]);
  }, []);

  // Update question
  const updateQuestion = useCallback(
    (index: number, updates: Partial<Question>) => {
      setQuestions((prev) =>
        prev.map((q, i) => (i === index ? { ...q, ...updates } : q))
      );
    },
    []
  );

  // Remove question
  const removeQuestion = useCallback((index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Add option to question
  const addOption = useCallback((questionIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i === questionIndex && q.options) {
          const newOption = {
            id: `opt${q.options.length + 1}`,
            label: "",
          };
          return { ...q, options: [...q.options, newOption] };
        }
        return q;
      })
    );
  }, []);

  // Remove option from question
  const removeOption = useCallback(
    (questionIndex: number, optionIndex: number) => {
      setQuestions((prev) =>
        prev.map((q, i) => {
          if (i === questionIndex && q.options) {
            return {
              ...q,
              options: q.options.filter((_, oi) => oi !== optionIndex),
            };
          }
          return q;
        })
      );
    },
    []
  );

  // Update option
  const updateOption = useCallback(
    (questionIndex: number, optionIndex: number, label: string) => {
      setQuestions((prev) =>
        prev.map((q, i) => {
          if (i === questionIndex && q.options) {
            return {
              ...q,
              options: q.options.map((opt, oi) =>
                oi === optionIndex ? { ...opt, label } : opt
              ),
            };
          }
          return q;
        })
      );
    },
    []
  );

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (questions.length === 0) {
      newErrors.questions = "At least one question is required";
    }

    questions.forEach((question, index) => {
      if (!question.prompt.trim()) {
        newErrors[`question-${index}-prompt`] = "Question prompt is required";
      }

      if (
        question.type !== "text" &&
        (!question.options || question.options.length < 2)
      ) {
        newErrors[`question-${index}-options`] =
          "At least 2 options are required";
      }

      question.options?.forEach((option, optIndex) => {
        if (!option.label.trim()) {
          newErrors[`question-${index}-option-${optIndex}`] =
            "Option label is required";
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, questions]);

  // Handle save
  const handleSave = useCallback(() => {
    if (!validateForm()) return;

    const questionnaireData: Partial<QuestionnaireDoc> = {
      ...formData,
      questions,
    };

    onSave?.(questionnaireData);
  }, [formData, questions, validateForm, onSave]);

  // Question type options
  const questionTypes = [
    { value: "single", label: "Single Choice" },
    { value: "multiple", label: "Multiple Choice" },
    { value: "text", label: "Text Input" },
    { value: "number", label: "Number Input" },
    { value: "scale", label: "Rating Scale" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {questionnaire ? "Edit Questionnaire" : "Create New Questionnaire"}
        </h1>
        <p className="text-gray-600 mt-1">
          Build interactive questionnaires for surveys, quizzes, and assessments
        </p>
      </div>

      {/* Basic Information */}
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Basic Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block  font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter questionnaire title..."
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? "border-red-300" : "border-gray-300"
              }`}
            />
            {errors.title && (
              <p className="text-red-600 text-xs mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block  font-medium text-gray-700 mb-1">
              Purpose
            </label>
            <select
              value={formData.purpose}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  purpose: e.target.value as "survey" | "quiz" | "assessment",
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="survey">Survey</option>
              <option value="quiz">Quiz</option>
              <option value="assessment">Assessment</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="bg-white border rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
          <button
            onClick={addQuestion}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ➕ Add Question
          </button>
        </div>

        {errors.questions && (
          <p className="text-red-600 ">{errors.questions}</p>
        )}

        <div className="space-y-6">
          {questions.map((question, questionIndex) => (
            <div
              key={question.id}
              className="border border-gray-200 rounded-lg p-4 space-y-4"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">
                  Question {questionIndex + 1}
                </h3>
                <button
                  onClick={() => removeQuestion(questionIndex)}
                  className="text-red-600 hover:text-red-800 "
                >
                  🗑️ Remove
                </button>
              </div>

              {/* Question Type and Required */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block  font-medium text-gray-700 mb-1">
                    Question Type
                  </label>
                  <select
                    value={question.type}
                    onChange={(e) =>
                      updateQuestion(questionIndex, {
                        type: e.target.value as Question["type"],
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    {questionTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`required-${questionIndex}`}
                    checked={question.required}
                    onChange={(e) =>
                      updateQuestion(questionIndex, {
                        required: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`required-${questionIndex}`}
                    className="ml-2  text-gray-700"
                  >
                    Required
                  </label>
                </div>
              </div>

              {/* Question Prompt */}
              <div>
                <label className="block  font-medium text-gray-700 mb-1">
                  Question Prompt *
                </label>
                <textarea
                  value={question.prompt}
                  onChange={(e) =>
                    updateQuestion(questionIndex, { prompt: e.target.value })
                  }
                  placeholder="Enter your question..."
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors[`question-${questionIndex}-prompt`]
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                />
                {errors[`question-${questionIndex}-prompt`] && (
                  <p className="text-red-600 text-xs mt-1">
                    {errors[`question-${questionIndex}-prompt`]}
                  </p>
                )}
              </div>

              {/* Options (for non-text questions) */}
              {question.type !== "text" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block  font-medium text-gray-700">
                      Answer Options
                    </label>
                    <button
                      onClick={() => addOption(questionIndex)}
                      className="text-blue-600 hover:text-blue-800 "
                    >
                      ➕ Add Option
                    </button>
                  </div>

                  {errors[`question-${questionIndex}-options`] && (
                    <p className="text-red-600 text-xs mb-2">
                      {errors[`question-${questionIndex}-options`]}
                    </p>
                  )}

                  <div className="space-y-2">
                    {question.options?.map((option, optionIndex) => (
                      <div key={option.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={option.label}
                          onChange={(e) =>
                            updateOption(
                              questionIndex,
                              optionIndex,
                              e.target.value
                            )
                          }
                          placeholder={`Option ${optionIndex + 1}`}
                          className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                            errors[
                              `question-${questionIndex}-option-${optionIndex}`
                            ]
                              ? "border-red-300"
                              : "border-gray-300"
                          }`}
                        />
                        {question.options && question.options.length > 2 && (
                          <button
                            onClick={() =>
                              removeOption(questionIndex, optionIndex)
                            }
                            className="text-red-600 hover:text-red-800  px-2"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading
            ? "Saving..."
            : questionnaire
            ? "Update Questionnaire"
            : "Create Questionnaire"}
        </button>
      </div>
    </div>
  );
}
