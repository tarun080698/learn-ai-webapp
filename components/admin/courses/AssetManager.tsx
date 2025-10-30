"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import MDEditor from "@uiw/react-md-editor";
import { useFileUpload } from "@/hooks/useFileUpload";
import { AssetFormData } from "@/lib/types";

interface AssetMeta {
  originalName?: string;
  size?: number;
  [key: string]: unknown;
}

interface AssetManagerProps {
  assets: AssetFormData[];
  onChange: (assets: AssetFormData[]) => void;
  disabled?: boolean;
}

interface SortableAssetItemProps {
  asset: AssetFormData;
  index: number;
  onUpdate: (index: number, updates: Partial<AssetFormData>) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

function SortableAssetItem({
  asset,
  index,
  onUpdate,
  onRemove,
  disabled,
}: SortableAssetItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { uploadFile } = useFileUpload();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: asset.order.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      alert("File size must not exceed 100MB");
      return;
    }

    // Validate file type
    const allowedTypes = {
      pdf: ["application/pdf"],
      image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      video: ["video/mp4", "video/webm", "video/ogg"],
    };

    if (
      asset.type !== "link" &&
      !allowedTypes[asset.type as keyof typeof allowedTypes]?.includes(
        file.type
      )
    ) {
      alert(`Please select a valid ${asset.type} file`);
      return;
    }

    try {
      setIsUploading(true);
      const result = await uploadFile(
        file,
        "asset",
        `${asset.title || "Asset"} for module`
      );

      onUpdate(index, {
        url: result.url,
        title: asset.title || file.name,
        meta: {
          ...asset.meta,
          originalName: file.name,
          size: file.size,
          type: file.type,
        },
      });
    } catch (error) {
      console.error("File upload failed:", error);
      alert("File upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const getAssetTypeIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return "📄";
      case "video":
        return "🎥";
      case "image":
        return "🖼️";
      case "link":
        return "🔗";
      default:
        return "📎";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-lg shadow-sm"
    >
      {/* Asset Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600 p-1"
              disabled={disabled}
            >
              ⋮⋮
            </button>
            <span className="text-xl">{getAssetTypeIcon(asset.type)}</span>
            <div className="flex-1">
              <input
                type="text"
                value={asset.title || ""}
                onChange={(e) => onUpdate(index, { title: e.target.value })}
                placeholder="Asset title..."
                disabled={disabled}
                className="w-full bg-transparent text-lg font-medium text-gray-900 placeholder-gray-400 border-0 focus:ring-0 focus:outline-none"
              />
              <p className=" text-gray-500 capitalize">{asset.type} Asset</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1  text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={disabled}
            >
              {isExpanded ? "Collapse" : "Expand"}
            </button>
            <button
              onClick={() => onRemove(index)}
              className="px-3 py-1  text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50"
              disabled={disabled}
            >
              Remove
            </button>
          </div>
        </div>
      </div>

      {/* Asset Details (Expandable) */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* URL/File Upload */}
          <div>
            <label className="block  font-medium text-gray-700 mb-1">
              {asset.type === "link" ? "URL" : "File"}
            </label>
            {asset.type === "link" ? (
              <input
                type="url"
                value={asset.url || ""}
                onChange={(e) => onUpdate(index, { url: e.target.value })}
                placeholder="https://example.com/resource"
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <div className="space-y-2">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept={
                    asset.type === "pdf"
                      ? ".pdf"
                      : asset.type === "image"
                      ? ".jpg,.jpeg,.png,.gif,.webp"
                      : asset.type === "video"
                      ? ".mp4,.webm,.ogg"
                      : "*"
                  }
                  disabled={disabled || isUploading}
                  className="block w-full  text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file: file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                />
                {asset.url && (
                  <div className="flex items-center space-x-2  text-green-600">
                    <span>✓</span>
                    <span>
                      File uploaded:{" "}
                      {(asset.meta as AssetMeta)?.originalName || "Unknown"}
                    </span>
                    {(asset.meta as AssetMeta)?.size && (
                      <span className="text-gray-500">
                        (
                        {Math.round(
                          ((asset.meta as AssetMeta).size as number) / 1024
                        )}{" "}
                        KB)
                      </span>
                    )}
                  </div>
                )}
                {isUploading && (
                  <div className=" text-blue-600">Uploading...</div>
                )}
              </div>
            )}
          </div>

          {/* Asset Description (Rich Text) */}
          <div>
            <label className="block  font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <MDEditor
              value={asset.body || ""}
              onChange={(value) => onUpdate(index, { body: value || "" })}
              preview="edit"
              hideToolbar={false}
              height={200}
              data-color-mode="light"
            />
          </div>

          {/* Asset Preview */}
          {asset.url && (
            <div>
              <label className="block  font-medium text-gray-700 mb-1">
                Preview
              </label>
              <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                {asset.type === "image" && (
                  <div className="relative w-32 h-32">
                    <Image
                      src={asset.url}
                      alt={asset.title || "Asset image"}
                      fill
                      className="object-contain rounded"
                      sizes="(max-width: 768px) 100vw, 128px"
                    />
                  </div>
                )}
                {asset.type === "video" && (
                  <video
                    src={asset.url}
                    controls
                    className="max-w-xs max-h-32 rounded"
                  />
                )}
                {(asset.type === "pdf" || asset.type === "link") && (
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">
                      {getAssetTypeIcon(asset.type)}
                    </span>
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {asset.title || "View Asset"}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AssetManager({
  assets,
  onChange,
  disabled,
}: AssetManagerProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAssetType, setNewAssetType] = useState<
    "pdf" | "video" | "image" | "link"
  >("pdf");

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      if (active.id !== over.id) {
        const oldIndex = assets.findIndex(
          (asset) => asset.order.toString() === active.id
        );
        const newIndex = assets.findIndex(
          (asset) => asset.order.toString() === over.id
        );

        if (oldIndex !== -1 && newIndex !== -1) {
          const newAssets = arrayMove(assets, oldIndex, newIndex);
          // Update order values
          const updatedAssets = newAssets.map((asset, index) => ({
            ...asset,
            order: index,
          }));
          onChange(updatedAssets);
        }
      }
    },
    [assets, onChange]
  );

  const addAsset = useCallback(() => {
    const newAsset: AssetFormData = {
      type: newAssetType,
      title: "",
      body: "",
      url: "",
      order: assets.length,
      meta: {},
    };
    onChange([...assets, newAsset]);
    setShowAddForm(false);
  }, [assets, newAssetType, onChange]);

  const updateAsset = useCallback(
    (index: number, updates: Partial<AssetFormData>) => {
      const newAssets = assets.map((asset, i) =>
        i === index ? { ...asset, ...updates } : asset
      );
      onChange(newAssets);
    },
    [assets, onChange]
  );

  const removeAsset = useCallback(
    (index: number) => {
      const newAssets = assets
        .filter((_, i) => i !== index)
        .map((asset, i) => ({ ...asset, order: i }));
      onChange(newAssets);
    },
    [assets, onChange]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Module Assets ({assets.length})
        </h3>
        <button
          onClick={() => setShowAddForm(true)}
          disabled={disabled}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Add Asset
        </button>
      </div>

      {/* Add Asset Form */}
      {showAddForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Add New Asset</h4>
          <div className="flex items-center space-x-3">
            <select
              value={newAssetType}
              onChange={(e) =>
                setNewAssetType(
                  e.target.value as "pdf" | "video" | "image" | "link"
                )
              }
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="pdf">PDF Document</option>
              <option value="video">Video File</option>
              <option value="image">Image File</option>
              <option value="link">External Link</option>
            </select>
            <button
              onClick={addAsset}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Assets List */}
      {assets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📎</div>
          <p>No assets added yet</p>
          <p className="">Add assets to supplement your module content</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={assets.map((asset) => asset.order.toString())}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {assets.map((asset, index) => (
                <SortableAssetItem
                  key={asset.order}
                  asset={asset}
                  index={index}
                  onUpdate={updateAsset}
                  onRemove={removeAsset}
                  disabled={disabled}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Help Text */}
      <div className=" text-gray-500 bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="font-medium text-blue-900 mb-1">Asset Guidelines:</p>
        <ul className="space-y-1 text-blue-800">
          <li>• Maximum file size: 100MB per asset</li>
          <li>• Drag and drop to reorder assets</li>
          <li>• Add rich text descriptions to provide context</li>
          <li>• Use external links for large video files</li>
        </ul>
      </div>
    </div>
  );
}
