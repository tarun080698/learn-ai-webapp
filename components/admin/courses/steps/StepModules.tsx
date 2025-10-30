"use client";

import React, { useState } from "react";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

import type { WizardStepProps } from "../../../../lib/types";

const moduleSchema = z.object({
  title: z.string().min(1, "Module title is required"),
  description: z.string().optional(),
  primaryContentType: z.enum(["text", "video", "file"]).optional(),
  primaryContentText: z.string().optional(),
  primaryContentVideoUrl: z.string().url().optional().or(z.literal("")),
  primaryContentFileUrl: z.string().url().optional().or(z.literal("")),
});

const stepModulesSchema = z.object({
  modules: z.array(moduleSchema).min(1, "At least one module is required"),
});

type StepModulesFormData = z.infer<typeof stepModulesSchema>;

export function StepModules({
  wizardState,
  onUpdate,
  onNext,
  onPrevious,
}: WizardStepProps) {
  const [isCollapsed, setIsCollapsed] = useState<Record<number, boolean>>({});

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<StepModulesFormData>({
    resolver: zodResolver(stepModulesSchema),
    defaultValues: {
      modules:
        wizardState.modules.length > 0
          ? wizardState.modules.map((m) => ({
              title: m.title || "",
              description: m.description || "",
              primaryContentType: undefined,
              primaryContentText: "",
              primaryContentVideoUrl: "",
              primaryContentFileUrl: "",
            }))
          : [
              {
                title: "",
                description: "",
                primaryContentType: undefined,
                primaryContentText: "",
                primaryContentVideoUrl: "",
                primaryContentFileUrl: "",
              },
            ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "modules",
  });

  const watchedModules = useWatch({
    control,
    name: "modules",
  });

  const addModule = () => {
    append({
      title: "",
      description: "",
      primaryContentType: undefined,
      primaryContentText: "",
      primaryContentVideoUrl: "",
      primaryContentFileUrl: "",
    });
  };

  const removeModule = (index: number) => {
    remove(index);
  };

  const toggleCollapsed = (index: number) => {
    setIsCollapsed((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const onSubmit = async (data: StepModulesFormData) => {
    // Update wizard state
    onUpdate({
      modules: data.modules.map((module, index) => ({
        ...module,
        id: wizardState.modules[index]?.id,
        order: index,
      })),
    });

    // Move to next step
    onNext();
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-[0_1px_2px_rgba(38,70,83,0.06),0_8px_24px_rgba(38,70,83,0.08)]">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Course Modules
        </h2>
        <p className="text-gray-600 text-lg">
          Add modules to structure your course content. Each module can have
          primary content and additional assets.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm"
            >
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <span className="text-sm font-medium text-gray-700">
                      Module {index + 1}
                    </span>

                    <Controller
                      name={`modules.${index}.title`}
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="Module title..."
                          className="flex-1 border-0 bg-transparent text-lg font-medium text-gray-900 placeholder-gray-400 focus:ring-0 focus:outline-none"
                        />
                      )}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => toggleCollapsed(index)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      {isCollapsed[index] ? "▼" : "▲"}
                    </button>

                    <button
                      type="button"
                      onClick={() => removeModule(index)}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {errors.modules?.[index]?.title && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.modules[index]?.title?.message}
                  </p>
                )}
              </div>

              {!isCollapsed[index] && (
                <div className="p-4 space-y-4">
                  {/* Module Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <Controller
                      name={`modules.${index}.description`}
                      control={control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          rows={2}
                          placeholder="Brief description of this module..."
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 shadow-sm sm:text-sm"
                        />
                      )}
                    />
                  </div>

                  {/* Primary Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Content
                    </label>

                    <div className="space-y-3">
                      {/* Content Type Selection */}
                      <Controller
                        name={`modules.${index}.primaryContentType`}
                        control={control}
                        render={({ field }) => (
                          <div className="flex space-x-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                {...field}
                                value="text"
                                checked={field.value === "text"}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                Text
                              </span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                {...field}
                                value="video"
                                checked={field.value === "video"}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                Video
                              </span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                {...field}
                                value="file"
                                checked={field.value === "file"}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                File
                              </span>
                            </label>
                          </div>
                        )}
                      />

                      {/* Content Input Based on Type */}
                      {watchedModules[index]?.primaryContentType === "text" && (
                        <Controller
                          name={`modules.${index}.primaryContentText`}
                          control={control}
                          render={({ field }) => (
                            <textarea
                              {...field}
                              rows={4}
                              placeholder="Enter your module content..."
                              className="w-full bg-input border rounded-xl px-4 py-3 text-secondary focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-150 block border-gray-300  shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          )}
                        />
                      )}

                      {watchedModules[index]?.primaryContentType ===
                        "video" && (
                        <Controller
                          name={`modules.${index}.primaryContentVideoUrl`}
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="url"
                              placeholder="https://youtube.com/watch?v=..."
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          )}
                        />
                      )}

                      {watchedModules[index]?.primaryContentType === "file" && (
                        <div>
                          <input
                            type="file"
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Upload a file for this module (PDF, images,
                            documents, etc.)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addModule}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Module
        </button>

        {errors.modules?.root && (
          <p className="text-sm text-red-600">{errors.modules.root.message}</p>
        )}

        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={onPrevious}
            className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Previous
          </button>

          <button
            type="submit"
            disabled={!isValid}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next: Configure Gating
          </button>
        </div>
      </form>
    </div>
  );
}
