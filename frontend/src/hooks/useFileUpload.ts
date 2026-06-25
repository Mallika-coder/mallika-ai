import { useState, useCallback } from "react";
import { api } from "@/lib/api";

interface UploadedFile {
  id: string;
  filename: string;
  mime_type: string;
  size: number;
  path: string;
}

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = useCallback(async (file: File, conversationId?: string, spaceId?: string): Promise<UploadedFile> => {
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    if (conversationId) formData.append("conversation_id", conversationId);
    if (spaceId) formData.append("space_id", spaceId);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/files/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setUploadProgress(100);
      return data;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const uploadFiles = useCallback(async (files: File[], conversationId?: string, spaceId?: string) => {
    const results: UploadedFile[] = [];
    for (const file of files) {
      const result = await uploadFile(file, conversationId, spaceId);
      results.push(result);
    }
    return results;
  }, [uploadFile]);

  return { uploadFile, uploadFiles, isUploading, uploadProgress };
}
