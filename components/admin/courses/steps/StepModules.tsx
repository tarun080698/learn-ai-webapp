"use client";

import React, { useState, useCallback } from "react";
import { ModuleManager } from "../ModuleEditor";
import type { WizardStepProps } from "../../../../lib/types";

interface ModuleData {
  title: string;
  description: string;
  body: string;
  assets: Array<{
    type: "pdf" | "video" | "image" | "link";
    title: string;
    body?: string;
    url: string;
    order: number;
    meta?: Record<string, unknown>;
  }>;
  order: number;
}

export function StepModules({
  wizardState,
  onUpdate,
  onNext,
  onPrevious,
}: WizardStepProps) {
  const [modules, setModules] = useState<ModuleData[]>(() => {
    // Convert existing wizard state modules to ModuleData format
    if (wizardState.modules.length > 0) {
      return wizardState.modules.map((m, index) => ({
        title: m.title || "",
        description: m.description || "",
        body: m.body || "",
        assets: m.assets || [],
        order: index,
      }));
    }
    return [];
  });

  const [isValid, setIsValid] = useState(false);

  // Validate modules
  const validateModules = useCallback((moduleList: ModuleData[]) => {
    const hasModules = moduleList.length > 0;
    const allModulesHaveTitle = moduleList.every(
      (m) => m.title.trim().length > 0
    );
    const isFormValid = hasModules && allModulesHaveTitle;
    setIsValid(isFormValid);
    return isFormValid;
  }, []);

  const handleModulesChange = useCallback(
    (newModules: ModuleData[]) => {
      setModules(newModules);
      validateModules(newModules);
    },
    [validateModules]
  );

  const handleNext = useCallback(() => {
    if (!validateModules(modules)) {
      alert("Please ensure all modules have titles before proceeding.");
      return;
    }

    // Convert ModuleData back to wizard state format
    const wizardModules = modules.map((module, index) => ({
      title: module.title,
      description: module.description,
      body: module.body,
      assets: module.assets,
      id: wizardState.modules[index]?.id,
      order: index,
    }));

    onUpdate({ modules: wizardModules });
    onNext();
  }, [modules, validateModules, wizardState.modules, onUpdate, onNext]);

  // Initial validation
  React.useEffect(() => {
    validateModules(modules);
  }, [modules, validateModules]);

  return (
    <div className="bg-white rounded-2xl p-8 shadow-[0_1px_2px_rgba(38,70,83,0.06),0_8px_24px_rgba(38,70,83,0.08)]">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Course Modules
        </h2>
        <p className="text-gray-600 text-lg">
          Create engaging modules with rich content, multiple assets, and
          interactive elements.
        </p>
      </div>

      {/* Enhanced Module Manager */}
      <div className="mb-8">
        <ModuleManager
          modules={modules}
          onChange={handleModulesChange}
          disabled={false}
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
          disabled={!isValid}
          className="px-6 py-3 border border-transparent rounded-md shadow-sm  font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {modules.length === 0 ? "Skip Modules" : "Next: Questionnaires"}
        </button>
      </div>

      {/* Progress Indicator */}
      {modules.length > 0 && (
        <div className="mt-4 text-center">
          <p className=" text-gray-600">
            {modules.length} module{modules.length !== 1 ? "s" : ""} created
            {" • "}
            {modules.reduce(
              (total, module) => total + module.assets.length,
              0
            )}{" "}
            total assets
          </p>
        </div>
      )}
    </div>
  );
}
