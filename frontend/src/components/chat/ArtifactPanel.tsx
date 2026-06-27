"use client";

import { useState, useMemo } from "react";
import { X, Code2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Artifact } from "@/types/chat";

interface ArtifactPanelProps {
  artifacts: Artifact[];
  onClose: () => void;
}

export function ArtifactPanel({ artifacts, onClose }: ArtifactPanelProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");

  const currentArtifact = artifacts[activeTab];

  const iframeContent = useMemo(() => {
    if (!currentArtifact) return "";

    if (currentArtifact.type === "html") {
      return currentArtifact.content;
    }

    if (currentArtifact.type === "svg") {
      return `<!DOCTYPE html><html><head><style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#1a1a2e;}</style></head><body>${currentArtifact.content}</body></html>`;
    }

    if (currentArtifact.type === "markdown") {
      // Simple markdown to HTML for preview
      const html = currentArtifact.content
        .replace(/^### (.*$)/gim, "<h3>$1</h3>")
        .replace(/^## (.*$)/gim, "<h2>$1</h2>")
        .replace(/^# (.*$)/gim, "<h1>$1</h1>")
        .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
        .replace(/\*(.*)\*/gim, "<em>$1</em>")
        .replace(/\n/gim, "<br>");
      return `<!DOCTYPE html><html><head><style>body{font-family:system-ui;padding:2rem;color:#e2e8f0;background:#1e293b;line-height:1.6;}h1,h2,h3{color:#f1f5f9;}code{background:#334155;padding:2px 6px;border-radius:4px;}</style></head><body>${html}</body></html>`;
    }

    // Code type - wrap in pre/code
    return `<!DOCTYPE html><html><head><style>body{margin:0;padding:1rem;background:#1e293b;color:#e2e8f0;font-family:monospace;font-size:14px;white-space:pre-wrap;word-wrap:break-word;}</style></head><body><pre><code>${currentArtifact.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre></body></html>`;
  }, [currentArtifact, viewMode]);

  if (artifacts.length === 0) return null;

  return (
    <div className="w-[500px] h-full flex flex-col border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Code2 size={16} className="text-blue-500" />
          <h3 className="text-sm font-medium dark:text-white truncate max-w-[200px]">
            {currentArtifact?.title || "Artifact"}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode("preview")}
            className={`p-1.5 rounded text-xs ${
              viewMode === "preview"
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            title="Preview"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => setViewMode("code")}
            className={`p-1.5 rounded text-xs ${
              viewMode === "code"
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            title="Source"
          >
            <Code2 size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      {artifacts.length > 1 && (
        <div className="flex items-center border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {artifacts.map((artifact, i) => (
            <button
              key={artifact.id}
              onClick={() => setActiveTab(i)}
              className={`px-3 py-2 text-xs whitespace-nowrap border-b-2 transition ${
                i === activeTab
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {artifact.title || `Artifact ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "preview" ? (
          <iframe
            srcDoc={iframeContent}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
            title="Artifact Preview"
          />
        ) : (
          <pre className="p-4 text-sm text-gray-300 overflow-auto h-full font-mono bg-gray-950">
            <code>{currentArtifact?.content}</code>
          </pre>
        )}
      </div>

      {/* Navigation for multiple artifacts */}
      {artifacts.length > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab(Math.max(0, activeTab - 1))}
            disabled={activeTab === 0}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-gray-500">
            {activeTab + 1} / {artifacts.length}
          </span>
          <button
            onClick={() => setActiveTab(Math.min(artifacts.length - 1, activeTab + 1))}
            disabled={activeTab === artifacts.length - 1}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Extracts artifacts (code blocks) from message content.
 * Detects HTML, SVG, CSS, JS, and Markdown code blocks.
 */
export function extractArtifacts(content: string): Artifact[] {
  const artifacts: Artifact[] = [];
  const codeBlockRegex = /```(html|svg|css|javascript|js|typescript|ts|markdown|md|python|py)([\s\S]*?)```/gi;

  let match;
  let index = 0;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1].toLowerCase();
    const code = match[2].trim();

    // Only auto-display as artifact for renderable types
    let type: Artifact["type"] = "code";
    if (language === "html") type = "html";
    else if (language === "svg") type = "svg";
    else if (language === "markdown" || language === "md") type = "markdown";

    // Only create artifacts for renderable types
    if (type !== "code") {
      artifacts.push({
        id: `artifact-${index}`,
        type,
        title: `${language.toUpperCase()} ${type === "html" ? "Preview" : "Document"}`,
        content: code,
        language,
      });
      index++;
    }
  }

  return artifacts;
}
