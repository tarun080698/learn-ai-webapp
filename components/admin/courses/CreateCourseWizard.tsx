"use client";

import { useState, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import type { WizardState } from "@/lib/types";

/*
TESTING NOTES:
- Manual test: Fill out Step 1, ensure draft is created immediately on Next
- Manual test: Add modules in Step 2, verify they persist with stable IDs
- Manual test: Reorder modules and assets, verify persistence
- Manual test: Upload files via hero image and asset uploads
- Manual test: Toggle assessments in Step 3, verify assignment creation
- Manual test: Complete flow in Step 4, verify final course creation
- Manual test: Form validation - try invalid data at each step
- Manual test: Error handling - simulate API failures and verify rollback
- Manual test: Auto-save functionality - verify debounced saves
*/

const TOTAL_STEPS = 4;

const STEP_NAMES = {
  1: "Details",
  2: "Modules",
  3: "Gating",
  4: "Review & Create",
};

// Import actual step components
import { StepDetails } from "./steps/StepDetails";
import { StepModules } from "./steps/StepModules";
import { StepGating } from "./steps/StepGating";
import { StepReview } from "./steps/StepReview";

function CreateCourseWizardContent() {
  const { addToast } = useToast();

  const [wizardState, setWizardState] = useState<WizardState>({
    currentStep: 1,
    courseId: undefined,
    courseData: {},
    modules: [],
    assignments: {
      course: {},
      modules: {},
    },
  });

  const updateWizardState = useCallback((updates: Partial<WizardState>) => {
    setWizardState((prev) => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    if (wizardState.currentStep < TOTAL_STEPS) {
      updateWizardState({ currentStep: wizardState.currentStep + 1 });
    }
  }, [wizardState.currentStep, updateWizardState]);

  const prevStep = useCallback(() => {
    if (wizardState.currentStep > 1) {
      updateWizardState({ currentStep: wizardState.currentStep - 1 });
    }
  }, [wizardState.currentStep, updateWizardState]);

  const showToast = useCallback(
    (type: "success" | "error" | "info", message: string) => {
      addToast({ type, message });
    },
    [addToast]
  );

  // Handle step navigation
  const goToStep = useCallback(
    (targetStep: number) => {
      if (targetStep <= wizardState.currentStep && targetStep >= 1) {
        updateWizardState({ currentStep: targetStep });
      }
    },
    [wizardState.currentStep, updateWizardState]
  );

  // Render progress bar
  const renderProgressBar = () => (
    <div className="bg-white border-b border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-8">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center space-x-2">
                <div
                  onClick={() => goToStep(step)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-150 ${
                    step <= wizardState.currentStep
                      ? "bg-blue-600 text-white cursor-pointer hover:bg-blue-700"
                      : "border-2 border-gray-300 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {step}
                </div>
                <span
                  className={`font-medium ${
                    step <= wizardState.currentStep
                      ? "text-gray-900"
                      : "text-gray-400"
                  }`}
                >
                  {STEP_NAMES[step as keyof typeof STEP_NAMES]}
                </span>
                {step < 4 && (
                  <div
                    className={`w-16 h-0.5 ml-8 ${
                      step < wizardState.currentStep
                        ? "bg-blue-600"
                        : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Handle save draft functionality
  const handleSaveDraft = useCallback(async () => {
    try {
      showToast("info", "Saving draft...");

      if (!wizardState.courseId && wizardState.courseData.title) {
        // Create course draft if it doesn't exist but has data
        const { createCourse } = await import("@/lib/api/admin");
        const result = await createCourse({
          title: wizardState.courseData.title,
          description: wizardState.courseData.description || "",
          durationMinutes: Math.round(
            (wizardState.courseData.durationHours || 1) * 60
          ),
          level: wizardState.courseData.level || "beginner",
          heroImageUrl: wizardState.courseData.heroImageUrl,
        });

        updateWizardState({ courseId: result.id });
        showToast("success", "Draft saved successfully!");
      } else if (wizardState.courseId) {
        // Update existing course
        const { updateCourse } = await import("@/lib/api/admin");
        await updateCourse(wizardState.courseId, {
          title: wizardState.courseData.title,
          description: wizardState.courseData.description,
          durationMinutes: Math.round(
            (wizardState.courseData.durationHours || 1) * 60
          ),
          level: wizardState.courseData.level,
          heroImageUrl: wizardState.courseData.heroImageUrl,
        });
        showToast("success", "Draft updated successfully!");
      } else {
        showToast(
          "error",
          "No data to save. Please fill in the course details first."
        );
      }
    } catch (error) {
      console.error("Save draft failed:", error);
      showToast("error", "Failed to save draft");
    }
  }, [
    wizardState.courseId,
    wizardState.courseData,
    updateWizardState,
    showToast,
  ]);

  // Render course summary sidebar
  const renderCourseSummary = () => (
    <div className="w-80 shrink-0">
      <div className="sticky top-24">
        <div className="bg-white rounded-2xl p-6 shadow-[0_1px_2px_rgba(38,70,83,0.06),0_8px_24px_rgba(38,70,83,0.08)]">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Course Summary
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="font-medium text-gray-900 mb-2">Course Title</h4>
              <p className="text-gray-600 text-sm">
                {wizardState.courseData.title || "Untitled Course"}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="font-medium text-gray-900 mb-2">Status</h4>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-xs font-medium">
                {wizardState.courseId ? "Draft" : "Not Created"}
              </span>
            </div>

            <div className="hidden p-4 bg-gray-50 rounded-xl">
              <h4 className="font-medium text-gray-900 mb-2">Progress</h4>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">
                      {STEP_NAMES[step as keyof typeof STEP_NAMES]}
                    </span>
                    {step <= wizardState.currentStep ? (
                      <i className="fa-solid fa-check text-green-500"></i>
                    ) : (
                      <i className="fa-solid fa-clock text-gray-400"></i>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="font-medium text-gray-900 mb-2">Quick Stats</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Modules</span>
                  <span className="text-gray-900 font-medium">
                    {wizardState.modules.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Assets</span>
                  <span className="text-gray-900 font-medium">
                    {wizardState.modules.reduce(
                      (acc, module) => acc + (module.assets?.length || 0),
                      0
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Assessments</span>
                  <span className="text-gray-900 font-medium">
                    {(() => {
                      let count = 0;
                      // Count course-level assignments
                      if (wizardState.assignments.course.pre) count++;
                      if (wizardState.assignments.course.post) count++;
                      // Count module-level assignments
                      Object.values(wizardState.assignments.modules).forEach(
                        (moduleAssignments) => {
                          if (moduleAssignments.pre) count++;
                          if (moduleAssignments.post) count++;
                        }
                      );
                      return count;
                    })()}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleSaveDraft}
                className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-150 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <i className="fa-solid fa-save"></i>
                <span>Save Draft</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render current step
  const renderCurrentStep = () => {
    switch (wizardState.currentStep) {
      case 1:
        return (
          <StepDetails
            wizardState={wizardState}
            updateWizardState={updateWizardState}
            nextStep={nextStep}
            showToast={showToast}
          />
        );
      case 2:
        return (
          <StepModules
            courseId={wizardState.courseId}
            wizardState={wizardState}
            onUpdate={updateWizardState}
            onNext={nextStep}
            onPrevious={prevStep}
          />
        );
      case 3:
        return (
          <StepGating
            courseId={wizardState.courseId}
            wizardState={wizardState}
            onUpdate={updateWizardState}
            onNext={nextStep}
            onPrevious={prevStep}
          />
        );
      case 4:
        return (
          <StepReview
            courseId={wizardState.courseId}
            wizardState={wizardState}
            onUpdate={updateWizardState}
            onNext={nextStep}
            onPrevious={prevStep}
          />
        );
      default:
        return (
          <StepDetails
            wizardState={wizardState}
            updateWizardState={updateWizardState}
            nextStep={nextStep}
            showToast={showToast}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="hidden sticky top-0 z-50 bg-card border-b border-secondary/15 h-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-secondary">
                Learn AI — Admin
              </h1>
              <nav className="hidden md:flex items-center space-x-6">
                <a
                  href="/admin"
                  className="text-secondary hover:text-accent hover:border-b-2 hover:border-accent px-2 py-1 transition-all duration-150"
                >
                  Dashboard
                </a>
                <span className="text-secondary border-b-2 border-accent px-2 py-1">
                  Create Course
                </span>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent/10 transition-colors duration-150">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                    A
                  </div>
                  <i className="fa-solid fa-chevron-down text-secondary text-xs"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {renderProgressBar()}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Left Column - Main Content */}
          <div className="flex-1 max-w-4xl">{renderCurrentStep()}</div>

          {/* Right Column - Summary Panel */}
          {renderCourseSummary()}
        </div>
      </main>
    </div>
  );
}

export function CreateCourseWizard() {
  // Create a new QueryClient instance for this wizard
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <CreateCourseWizardContent />
      </ToastProvider>
    </QueryClientProvider>
  );
}
