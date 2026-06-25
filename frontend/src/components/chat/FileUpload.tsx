"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";

interface FileUploadProps {
  onFiles: (files: File[]) => void;
}

export function FileUpload({ onFiles }: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFiles(acceptedFiles);
    },
    [onFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/plain": [".txt", ".md"],
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "application/json": [".json"],
    },
    maxSize: 50 * 1024 * 1024,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
        isDragActive
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10"
          : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
      }`}
    >
      <input {...getInputProps()} />
      <Upload size={32} className="mx-auto mb-3 text-gray-400" />
      {isDragActive ? (
        <p className="text-blue-600 dark:text-blue-400">Drop files here...</p>
      ) : (
        <div>
          <p className="text-gray-600 dark:text-gray-400">
            Drag & drop files or click to browse
          </p>
          <p className="text-xs text-gray-400 mt-1">
            PDF, DOCX, CSV, XLSX, TXT, images, code files (max 50MB)
          </p>
        </div>
      )}
    </div>
  );
}
