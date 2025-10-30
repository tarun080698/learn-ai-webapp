"use client";

import React, { useState, useCallback } from "react";
import MDEditor from "@uiw/react-md-editor";
import { AssetManager } from "./AssetManager";
import { AssetFormData } from "@/lib/types";

interface ModuleData {
  title: string;
  description: string;
  body: string;
  assets: AssetFormData[];
  order: number;
}

interface ModuleEditorProps {
  module: ModuleData;
  onUpdate: (updates: Partial<ModuleData>) => void;
  onRemove: () => void;
  disabled?: boolean;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

export function ModuleEditor({
  module,
  onUpdate,
  onRemove,
  disabled,
  isExpanded = false,
  onToggleExpanded,
}: ModuleEditorProps) {
  const [activeTab, setActiveTab] = useState<"content" | "assets">("content");

  const handleAssetChange = useCallback(
    (assets: AssetFormData[]) => {
      onUpdate({ assets });
    },
    [onUpdate]
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Module Header */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <input
              type="text"
              value={module.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Module title..."
              disabled={disabled}
              className="w-full text-lg font-semibold text-gray-900 bg-transparent border-0 focus:ring-0 focus:outline-none placeholder-gray-400"
            />
            <input
              type="text"
              value={module.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Brief description of this module..."
              disabled={disabled}
              className="w-full  text-gray-600 bg-transparent border-0 focus:ring-0 focus:outline-none placeholder-gray-400 mt-1"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              {module.assets.length} assets
            </span>
            {onToggleExpanded && (
              <button
                onClick={onToggleExpanded}
                className="px-3 py-1  text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-white"
                disabled={disabled}
              >
                {isExpanded ? "Collapse" : "Expand"}
              </button>
            )}
            <button
              onClick={onRemove}
              className="px-3 py-1  text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50"
              disabled={disabled}
            >
              Remove
            </button>
          </div>
        </div>
      </div>

      {/* Module Content (when expanded) */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setActiveTab("content")}
              className={`px-6 py-3  font-medium border-b-2 transition-colors ${
                activeTab === "content"
                  ? "border-blue-500 text-blue-600 bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              disabled={disabled}
            >
              Content
            </button>
            <button
              onClick={() => setActiveTab("assets")}
              className={`px-6 py-3  font-medium border-b-2 transition-colors ${
                activeTab === "assets"
                  ? "border-blue-500 text-blue-600 bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              disabled={disabled}
            >
              Assets ({module.assets.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "content" && (
              <div className="space-y-4">
                <div>
                  <label className="block  font-medium text-gray-700 mb-2">
                    Module Content
                  </label>
                  <div className="prose max-w-none">
                    <MDEditor
                      value={module.body}
                      onChange={(value) => onUpdate({ body: value || "" })}
                      preview="edit"
                      hideToolbar={disabled}
                      height={400}
                      data-color-mode="light"
                      textareaProps={{
                        placeholder:
                          "Write your module content using Markdown...\n\n" +
                          "You can include:\n" +
                          "- Learning objectives\n" +
                          "- Detailed explanations\n" +
                          "- Code examples\n" +
                          "- Instructions\n" +
                          "- References\n\n" +
                          "Use the Assets tab to add supporting files, images, videos, and links.",
                        disabled,
                      }}
                    />
                  </div>
                </div>

                {/* Content Guidelines */}
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                  <h4 className=" font-medium text-amber-800 mb-2">
                    Content Guidelines
                  </h4>
                  <ul className=" text-amber-700 space-y-1">
                    <li>• Use clear headings to structure your content</li>
                    <li>• Include learning objectives at the beginning</li>
                    <li>• Add code examples with syntax highlighting</li>
                    <li>• Reference assets using descriptive text</li>
                    <li>• Include practical exercises or examples</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "assets" && (
              <AssetManager
                assets={module.assets}
                onChange={handleAssetChange}
                disabled={disabled}
              />
            )}
          </div>
        </div>
      )}

      {/* Collapsed Summary */}
      {!isExpanded && (
        <div className="px-4 py-3 bg-gray-50">
          <div className="flex items-center justify-between  text-gray-600">
            <div className="flex items-center space-x-4">
              <span>
                Content:{" "}
                {module.body ? `${module.body.length} characters` : "Empty"}
              </span>
              <span>Assets: {module.assets.length}</span>
            </div>
            {onToggleExpanded && (
              <button
                onClick={onToggleExpanded}
                className="text-blue-600 hover:text-blue-800"
                disabled={disabled}
              >
                Edit →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Multi-Module Manager Component
interface ModuleManagerProps {
  modules: ModuleData[];
  onChange: (modules: ModuleData[]) => void;
  disabled?: boolean;
}

export function ModuleManager({
  modules,
  onChange,
  disabled,
}: ModuleManagerProps) {
  const [expandedModules, setExpandedModules] = useState<Set<number>>(
    new Set()
  );

  const addModule = useCallback(() => {
    const newModule: ModuleData = {
      title: "",
      description: "",
      body: "",
      assets: [],
      order: modules.length,
    };
    const updatedModules = [...modules, newModule];
    onChange(updatedModules);

    // Auto-expand the new module
    setExpandedModules((prev) => new Set([...prev, modules.length]));
  }, [modules, onChange]);

  const updateModule = useCallback(
    (index: number, updates: Partial<ModuleData>) => {
      const updatedModules = modules.map((module, i) =>
        i === index ? { ...module, ...updates } : module
      );
      onChange(updatedModules);
    },
    [modules, onChange]
  );

  const removeModule = useCallback(
    (index: number) => {
      const updatedModules = modules
        .filter((_, i) => i !== index)
        .map((module, i) => ({ ...module, order: i }));
      onChange(updatedModules);

      // Remove from expanded set
      setExpandedModules((prev) => {
        const next = new Set(prev);
        next.delete(index);
        // Adjust indices for remaining modules
        const adjusted = new Set<number>();
        next.forEach((idx) => {
          if (idx < index) adjusted.add(idx);
          else if (idx > index) adjusted.add(idx - 1);
        });
        return adjusted;
      });
    },
    [modules, onChange]
  );

  const toggleExpanded = useCallback((index: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Course Modules ({modules.length})
          </h2>
          <p className=" text-gray-600 mt-1">
            Create engaging modules with rich content and supporting assets
          </p>
        </div>
        <button
          onClick={addModule}
          disabled={disabled}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Add Module
        </button>
      </div>

      {/* Modules List */}
      {modules.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No modules yet
          </h3>
          <p className="text-gray-600 mb-4">
            Start building your course by adding your first module
          </p>
          <button
            onClick={addModule}
            disabled={disabled}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create First Module
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((module, index) => (
            <div key={index} className="relative">
              {/* Module Order Badge */}
              <div className="absolute -left-3 top-4 z-10 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                {index + 1}
              </div>

              <ModuleEditor
                module={module}
                onUpdate={(updates) => updateModule(index, updates)}
                onRemove={() => removeModule(index)}
                disabled={disabled}
                isExpanded={expandedModules.has(index)}
                onToggleExpanded={() => toggleExpanded(index)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      {modules.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className=" font-medium text-blue-900 mb-2">Module Tips</h4>
          <ul className=" text-blue-800 space-y-1">
            <li>• Keep modules focused on specific learning objectives</li>
            <li>
              • Use a mix of content types: text, images, videos, and files
            </li>
            <li>• Consider the logical flow between modules</li>
            <li>• Add assessments after key modules using questionnaires</li>
          </ul>
        </div>
      )}
    </div>
  );
}
