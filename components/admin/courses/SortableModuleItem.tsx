"use client";

import React from "react";
import { Control, Controller } from "react-hook-form";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
  Bars3Icon,
  DocumentIcon,
  VideoCameraIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

interface SortableModuleItemProps {
  id: string;
  index: number;
  module: any;
  isCollapsed?: boolean;
  errors?: any;
  uploadingFiles: Record<string, boolean>;
  onToggleCollapsed: () => void;
  onRemove: () => void;
  onFileUpload: (
    file: File,
    moduleIndex: number,
    type: "primary" | "asset"
  ) => Promise<string | undefined>;
  control: Control<any>;
}

export function SortableModuleItem({
  id,
  index,
  module,
  isCollapsed,
  errors,
  uploadingFiles,
  onToggleCollapsed,
  onRemove,
  onFileUpload,
  control,
}: SortableModuleItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const uploadKey = `${index}-primary`;
  const isUploading = uploadingFiles[uploadKey];

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      await onFileUpload(file, index, "primary");
    }
  };

  const getContentTypeIcon = (type?: string) => {
    switch (type) {
      case "text":
        return <DocumentTextIcon className="h-5 w-5 text-gray-400" />;
      case "video":
        return <VideoCameraIcon className="h-5 w-5 text-gray-400" />;
      case "file":
        return <DocumentIcon className="h-5 w-5 text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-lg shadow-sm"
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              className="cursor-grab hover:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
              {...attributes}
              {...listeners}
            >
              <Bars3Icon className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-2">
              <span className=" font-medium text-gray-700">
                Module {index + 1}
              </span>
              {module.primaryContentType &&
                getContentTypeIcon(module.primaryContentType)}
            </div>

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
              onClick={onToggleCollapsed}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              {isCollapsed ? (
                <ChevronDownIcon className="h-5 w-5" />
              ) : (
                <ChevronUpIcon className="h-5 w-5" />
              )}
            </button>

            <button
              type="button"
              onClick={onRemove}
              className="p-1 text-red-400 hover:text-red-600"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {errors?.title && (
          <p className="mt-1  text-red-600">{errors.title.message}</p>
        )}
      </div>

      {!isCollapsed && (
        <div className="p-4 space-y-4">
          {/* Module Description */}
          <div>
            <label className="block  font-medium text-gray-700 mb-1">
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
                  className="block w-full border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm: bg-input border rounded-xl px-4 py-3 text-secondary focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-150"
                />
              )}
            />
          </div>

          {/* Primary Content */}
          <div>
            <label className="block  font-medium text-gray-700 mb-2">
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
                      <span className="ml-2  text-gray-700">Text</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        {...field}
                        value="video"
                        checked={field.value === "video"}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2  text-gray-700">Video</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        {...field}
                        value="file"
                        checked={field.value === "file"}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2  text-gray-700">File</span>
                    </label>
                  </div>
                )}
              />

              {/* Content Input Based on Type */}
              {module.primaryContentType === "text" && (
                <Controller
                  name={`modules.${index}.primaryContentText`}
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={4}
                      placeholder="Enter your module content..."
                      className="w-full bg-input border rounded-xl px-4 py-3 text-secondary focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-150 block border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:"
                    />
                  )}
                />
              )}

              {module.primaryContentType === "video" && (
                <Controller
                  name={`modules.${index}.primaryContentVideoUrl`}
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="url"
                      placeholder="https://youtube.com/watch?v=..."
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:"
                    />
                  )}
                />
              )}

              {module.primaryContentType === "file" && (
                <div>
                  {module.primaryContentFileUrl ? (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-2">
                        <DocumentIcon className="h-5 w-5 text-gray-400" />
                        <span className=" text-gray-700">File uploaded</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          // Clear the file URL
                          const input = document.getElementById(
                            `file-${index}`
                          ) as HTMLInputElement;
                          if (input) input.value = "";
                        }}
                        className=" text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        id={`file-${index}`}
                        type="file"
                        onChange={handleFileChange}
                        disabled={isUploading}
                        className="block w-full  text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file: file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                      />
                      {isUploading && (
                        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
