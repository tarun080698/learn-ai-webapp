"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { StepDetails } from "./courses/steps/StepDetails";
import { StepModules } from "./courses/steps/StepModules";
import { StepQuestionnaires } from "./courses/steps/StepQuestionnaires";
import { StepReview } from "./courses/steps/StepReviewEnhanced";
import type { WizardState } from "@/lib/types";

const STEPS = [
  {
    id: "details",
    title: "Course Details",
    description: "Basic information and hero image",
    component: StepDetails,
  },
  {
    id: "modules",
    title: "Modules & Content",
    description: "Create modules with rich content and assets",
    component: StepModules,
  },
  {
    id: "questionnaires",
    title: "Assessments",
    description: "Configure pre/post course and module assessments",
    component: StepQuestionnaires,
  },
  {
    id: "review",
    title: "Review & Create",
    description: "Review and finalize your course",
    component: StepReview,
  },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export interface EnhancedCourseWizardProps {
  mode?: "create" | "edit";
  courseId?: string;
  initialData?: Partial<WizardState>;
  onComplete?: (result: { courseId: string; isUpdate: boolean }) => void;
  onCancel?: () => void;
}

export function EnhancedCourseWizard({
  mode = "create",
  courseId,
  initialData,
  onComplete,
  onCancel,
}: EnhancedCourseWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<StepId>("details");

  const [wizardState, setWizardState] = useState<WizardState>({
    currentStep: 1,
    courseId,
    courseData: {
      title: "",
      description: "",
      level: "beginner",
      durationHours: 1,
      heroImageUrl: "",
      ...initialData?.courseData,
    },
    modules: initialData?.modules || [],
    questionnaires: initialData?.questionnaires || [],
    assignments: {
      course: {
        pre: undefined,
        post: undefined,
      },
      modules: {},
      ...initialData?.assignments,
    },
  });

  const showToast = useCallback(
    (type: "success" | "error" | "info", message: string) => {
      // For now, just use console.log - you can integrate with a toast library
      console.log(`Toast ${type}:`, message);
    },
    []
  );

  const updateWizardState = useCallback(
    (updates: Partial<WizardState>) => {
      setWizardState((prev) => ({
        ...prev,
        ...updates,
        currentStep: STEPS.findIndex((s) => s.id === currentStep) + 1,
      }));
    },
    [currentStep]
  );

  const goToStep = (stepId: StepId) => {
    setCurrentStep(stepId);
  };

  const nextStep = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push("/admin/courses");
    }
  };

  // Course creation completion handler
  const handleComplete = (result: { courseId: string; isUpdate: boolean }) => {
    if (onComplete) {
      onComplete(result);
    } else {
      router.push(`/admin/courses/${result.courseId}`);
    }
  };

  const currentStepConfig = STEPS.find((s) => s.id === currentStep);
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  if (!currentStepConfig) {
    return <div>Invalid step</div>;
  }

  const stepProps = {
    courseId,
    wizardState,
    onUpdate: updateWizardState,
    onNext: nextStep,
    onPrevious: prevStep,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {mode === "create" ? "Create New Course" : "Edit Course"}
              </h1>
              <p className="text-gray-600 mt-1">
                Build engaging courses with rich content, interactive modules,
                and comprehensive assessments
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  index < STEPS.length - 1 ? "flex-1" : ""
                }`}
              >
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 cursor-pointer transition-all ${
                    index < currentStepIndex
                      ? "bg-green-600 border-green-600 text-white"
                      : index === currentStepIndex
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-gray-300 text-gray-400 hover:border-gray-400"
                  }`}
                  onClick={() => goToStep(step.id)}
                >
                  {index < currentStepIndex ? (
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className=" font-semibold">{index + 1}</span>
                  )}
                </div>

                <div className="ml-4 min-w-0 flex-1">
                  <p
                    className={` font-semibold ${
                      index <= currentStepIndex
                        ? index < currentStepIndex
                          ? "text-green-600"
                          : "text-blue-600"
                        : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </p>
                </div>

                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 mx-6 h-0.5 transition-colors ${
                      index < currentStepIndex ? "bg-green-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {currentStep === "details" && (
            <StepDetails
              wizardState={wizardState}
              updateWizardState={updateWizardState}
              nextStep={nextStep}
              showToast={showToast}
            />
          )}
          {currentStep === "modules" && <StepModules {...stepProps} />}
          {currentStep === "questionnaires" && (
            <StepQuestionnaires {...stepProps} />
          )}
          {currentStep === "review" && (
            <StepReview {...stepProps} onComplete={handleComplete} />
          )}
        </div>

        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 bg-gray-100 rounded-lg p-4">
            <details>
              <summary className="cursor-pointer  font-medium text-gray-700 mb-2">
                Debug: Wizard State
              </summary>
              <pre className="text-xs text-gray-600 overflow-auto max-h-64">
                {JSON.stringify(wizardState, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Footer */}
        <div className="text-center  text-gray-500 mt-8">
          <p>
            Step {currentStepIndex + 1} of {STEPS.length}
          </p>
        </div>
      </div>
    </div>
  );
}
