"use client";

import { Download, FileText, Table, BarChart3 } from "lucide-react";

interface ArtifactViewerProps {
  artifact: {
    type: string;
    filename: string;
    path: string;
  };
}

export function ArtifactViewer({ artifact }: ArtifactViewerProps) {
  const icons: Record<string, React.ReactNode> = {
    docx: <FileText size={20} className="text-blue-500" />,
    xlsx: <Table size={20} className="text-green-500" />,
    pptx: <BarChart3 size={20} className="text-orange-500" />,
    pdf: <FileText size={20} className="text-red-500" />,
  };

  const handleDownload = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/files/download?path=${encodeURIComponent(artifact.path)}`
    );
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = artifact.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
      {icons[artifact.type] || <FileText size={20} />}
      <div className="flex-1">
        <p className="text-sm font-medium dark:text-white">{artifact.filename}</p>
        <p className="text-xs text-gray-500">{artifact.type.toUpperCase()} document</p>
      </div>
      <button
        onClick={handleDownload}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
      >
        <Download size={16} className="text-gray-600 dark:text-gray-400" />
      </button>
    </div>
  );
}
