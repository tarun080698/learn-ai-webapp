"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { XMarkIcon } from "@heroicons/react/24/outline";

import type { WizardStepProps } from "../../../../lib/types";
import { getQuestionnaires } from "../../../../lib/api/admin";

const gatingSchema = z.object({
  coursePreAssessment: z.string().optional(),
  coursePostAssessment: z.string().optional(),
  moduleGating: z
    .record(
      z.string(),
      z.object({
        preAssessment: z.string().optional(),
        postAssessment: z.string().optional(),
      })
    )
    .optional(),
});

type StepGatingFormData = z.infer<typeof gatingSchema>;

export function StepGating({
  wizardState,
  onUpdate,
  onNext,
  onPrevious,
}: WizardStepProps) {
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  // Fetch available questionnaires
  const { data: questionnairesResponse, isLoading } = useQuery({
    queryKey: ["questionnaires"],
    queryFn: getQuestionnaires,
  });

  const questionnaires = questionnairesResponse?.items || [];

  const { control, handleSubmit } = useForm<StepGatingFormData>({
    resolver: zodResolver(gatingSchema),
    defaultValues: {
      coursePreAssessment:
        wizardState.assignments.course.pre?.questionnaireId || "",
      coursePostAssessment:
        wizardState.assignments.course.post?.questionnaireId || "",
      moduleGating: Object.fromEntries(
        Object.entries(wizardState.assignments.modules || {}).map(
          ([moduleId, assignments]) => [
            moduleId,
            {
              preAssessment: assignments.pre?.questionnaireId || "",
              postAssessment: assignments.post?.questionnaireId || "",
            },
          ]
        )
      ),
    },
  });

  const addModuleGating = (moduleId: string) => {
    if (!selectedModules.includes(moduleId)) {
      setSelectedModules((prev) => [...prev, moduleId]);
    }
  };

  const removeModuleGating = (moduleId: string) => {
    setSelectedModules((prev) => prev.filter((id) => id !== moduleId));
  };

  const onSubmit = async (data: StepGatingFormData) => {
    // Prepare gating assignments
    const courseAssignments = {
      pre: data.coursePreAssessment
        ? {
            questionnaireId: data.coursePreAssessment,
            active: true,
          }
        : undefined,
      post: data.coursePostAssessment
        ? {
            questionnaireId: data.coursePostAssessment,
            active: true,
          }
        : undefined,
    };

    const moduleAssignments: Record<
      string,
      {
        pre?: { questionnaireId: string; active: boolean };
        post?: { questionnaireId: string; active: boolean };
      }
    > = {};
    selectedModules.forEach((moduleId) => {
      const moduleGating = data.moduleGating?.[moduleId] as
        | { preAssessment?: string; postAssessment?: string }
        | undefined;
      if (moduleGating?.preAssessment || moduleGating?.postAssessment) {
        moduleAssignments[moduleId] = {
          pre: moduleGating.preAssessment
            ? {
                questionnaireId: moduleGating.preAssessment,
                active: true,
              }
            : undefined,
          post: moduleGating.postAssessment
            ? {
                questionnaireId: moduleGating.postAssessment,
                active: true,
              }
            : undefined,
        };
      }
    });

    // Update wizard state
    onUpdate({
      assignments: {
        course: courseAssignments,
        modules: moduleAssignments,
      },
    });

    // Move to next step
    onNext();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-[0_1px_2px_rgba(38,70,83,0.06),0_8px_24px_rgba(38,70,83,0.08)]">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Assessment Gating
        </h2>
        <p className="text-gray-600 text-lg">
          Configure pre and post assessments for your course and individual
          modules. Assessments help validate learning progress and can gate
          access to content.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Course-Level Assessments */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Course Assessments
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pre-Assessment */}
            <div>
              <label className="block  font-medium text-gray-700 mb-2">
                Pre-Assessment (Before Course Access)
              </label>
              <Controller
                name="coursePreAssessment"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:"
                  >
                    <option value="">No pre-assessment</option>
                    {questionnaires.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title || q.name} ({q.questions?.length || 0}{" "}
                        questions)
                      </option>
                    ))}
                  </select>
                )}
              />
              <p className="text-xs text-gray-500 mt-1">
                Students must complete this before accessing course content
              </p>
            </div>

            {/* Post-Assessment */}
            <div>
              <label className="block  font-medium text-gray-700 mb-2">
                Post-Assessment (After Course Completion)
              </label>
              <Controller
                name="coursePostAssessment"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:"
                  >
                    <option value="">No post-assessment</option>
                    {questionnaires.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title || q.name} ({q.questions?.length || 0}{" "}
                        questions)
                      </option>
                    ))}
                  </select>
                )}
              />
              <p className="text-xs text-gray-500 mt-1">
                Students take this after completing all modules
              </p>
            </div>
          </div>
        </div>

        {/* Module-Level Assessments */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Module Assessments
            </h3>

            {wizardState.modules.length > 0 && (
              <div className="flex items-center space-x-2">
                <label className=" text-gray-700">Add gating for:</label>
                <select
                  onChange={(e) =>
                    e.target.value && addModuleGating(e.target.value)
                  }
                  value=""
                  className="border-gray-300 rounded-md shadow-sm  focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select module...</option>
                  {wizardState.modules.map((module, index) => (
                    <option
                      key={module.id || index}
                      value={module.id || index}
                      disabled={selectedModules.includes(
                        module.id || index.toString()
                      )}
                    >
                      {module.title || `Module ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {selectedModules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No module assessments configured.</p>
              <p className="">
                Use the dropdown above to add gating for specific modules.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {selectedModules.map((moduleId) => {
                const moduleData = wizardState.modules.find(
                  (m) =>
                    (m.id || wizardState.modules.indexOf(m).toString()) ===
                    moduleId
                );
                const moduleIndex = wizardState.modules.findIndex(
                  (m) =>
                    (m.id || wizardState.modules.indexOf(m).toString()) ===
                    moduleId
                );
                const moduleTitle =
                  moduleData?.title || `Module ${moduleIndex + 1}`;

                return (
                  <div
                    key={moduleId}
                    className="border border-gray-100 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">
                        {moduleTitle}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeModuleGating(moduleId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Module Pre-Assessment */}
                      <div>
                        <label className="block  font-medium text-gray-700 mb-1">
                          Pre-Assessment
                        </label>
                        <Controller
                          name={`moduleGating.${moduleId}.preAssessment`}
                          control={control}
                          render={({ field }) => (
                            <select
                              {...field}
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:"
                            >
                              <option value="">No pre-assessment</option>
                              {questionnaires.map((q) => (
                                <option key={q.id} value={q.id}>
                                  {q.title || q.name} (
                                  {q.questions?.length || 0} questions)
                                </option>
                              ))}
                            </select>
                          )}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Required before accessing this module
                        </p>
                      </div>

                      {/* Module Post-Assessment */}
                      <div>
                        <label className="block  font-medium text-gray-700 mb-1">
                          Post-Assessment
                        </label>
                        <Controller
                          name={`moduleGating.${moduleId}.postAssessment`}
                          control={control}
                          render={({ field }) => (
                            <select
                              {...field}
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:"
                            >
                              <option value="">No post-assessment</option>
                              {questionnaires.map((q) => (
                                <option key={q.id} value={q.id}>
                                  {q.title || q.name} (
                                  {q.questions?.length || 0} questions)
                                </option>
                              ))}
                            </select>
                          )}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Required after completing this module
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={onPrevious}
            className="px-6 py-2 border border-gray-300 rounded-md shadow-sm  font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Previous
          </button>

          <button
            type="submit"
            className="px-6 py-2 border border-transparent rounded-md shadow-sm  font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Next: Review & Create
          </button>
        </div>
      </form>
    </div>
  );
}
