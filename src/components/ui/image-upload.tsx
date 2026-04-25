"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { getImageUrl } from "@/lib/requestHandlers";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

interface ImageUploadProps {
  entity: string;
  entityId: number | undefined;
  onImageChange: (file: File | null) => void;
  onImageDelete?: () => void;
}

export default function ImageUpload({
  entity,
  entityId,
  onImageChange,
  onImageDelete,
}: ImageUploadProps) {
  const tc = useTranslations("common");
  const [preview, setPreview] = useState<string | null>(null);
  const [hasExisting, setHasExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Load existing image when entityId is available
  useEffect(() => {
    if (entityId) {
      // Use cache-busting to ensure we always get the latest image
      const url = getImageUrl(entity, entityId, true);
      // Check if image exists by trying to load it
      const img = new Image();
      img.onload = () => {
        setPreview(url);
        setHasExisting(true);
      };
      img.onerror = () => {
        setPreview(null);
        setHasExisting(false);
      };
      img.src = url;
    }

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [entity, entityId]);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      if (!file.type.startsWith("image/")) {
        setError(tc("invalidFileType"));
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(tc("fileTooLarge"));
        return;
      }

      // Revoke previous object URL
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setPreview(url);
      setHasExisting(false);
      onImageChange(file);
    },
    [onImageChange, tc]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDelete = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPreview(null);
    setHasExisting(false);
    setError(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onImageDelete?.();
  };

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt=""
            className="h-32 w-32 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
          />
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="absolute -top-2 -right-2 h-7 w-7 p-0 rounded-full"
            onClick={handleDelete}
            title={tc("deleteImage")}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center h-32 w-full rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          }`}
        >
          <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {tc("dragAndDrop")}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <Upload className="w-3.5 h-3.5 mr-1" />
            {tc("uploadImage")}
          </Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
      />

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
