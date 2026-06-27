"use client";

import { useState, useRef, useCallback } from "react";
import {
  X,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Code,
  Copy,
  Download,
  Check,
  FileText,
} from "lucide-react";
import { Document } from "@/types/chat";

interface DocumentPanelProps {
  documents: Document[];
  activeDocument: Document | null;
  onClose: () => void;
  onUpdateDocument: (id: string, content: string) => void;
  onSelectDocument: (doc: Document) => void;
}

export function DocumentPanel({
  documents,
  activeDocument,
  onClose,
  onUpdateDocument,
  onSelectDocument,
}: DocumentPanelProps) {
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleFormat = (format: string) => {
    switch (format) {
      case "bold":
        execCommand("bold");
        break;
      case "italic":
        execCommand("italic");
        break;
      case "h1":
        execCommand("formatBlock", "h1");
        break;
      case "h2":
        execCommand("formatBlock", "h2");
        break;
      case "ul":
        execCommand("insertUnorderedList");
        break;
      case "ol":
        execCommand("insertOrderedList");
        break;
      case "code":
        execCommand("formatBlock", "pre");
        break;
    }
  };

  const handleCopy = async () => {
    if (!activeDocument) return;
    try {
      await navigator.clipboard.writeText(activeDocument.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = window.document.createElement("textarea");
      textarea.value = activeDocument.content;
      window.document.body.appendChild(textarea);
      textarea.select();
      window.document.execCommand("copy");
      window.document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!activeDocument) return;
    const blob = new Blob([activeDocument.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${activeDocument.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleInput = () => {
    if (editorRef.current && activeDocument) {
      onUpdateDocument(activeDocument.id, editorRef.current.innerText);
    }
  };

  if (!activeDocument) return null;

  return (
    <div className="w-[500px] h-full flex flex-col border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-purple-500" />
          <h3 className="text-sm font-medium dark:text-white truncate max-w-[200px]">
            {activeDocument.title || "Document"}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            title="Copy content"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            title="Download as Markdown"
          >
            <Download size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Document Tabs */}
      {documents.length > 1 && (
        <div className="flex items-center border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => onSelectDocument(doc)}
              className={`px-3 py-2 text-xs whitespace-nowrap border-b-2 transition ${
                doc.id === activeDocument.id
                  ? "border-purple-500 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {doc.title || "Untitled"}
            </button>
          ))}
        </div>
      )}

      {/* Formatting Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <button
          onClick={() => handleFormat("bold")}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          title="Bold (Ctrl+B)"
        >
          <Bold size={14} />
        </button>
        <button
          onClick={() => handleFormat("italic")}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          title="Italic (Ctrl+I)"
        >
          <Italic size={14} />
        </button>
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
        <button
          onClick={() => handleFormat("h1")}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          title="Heading 1"
        >
          <Heading1 size={14} />
        </button>
        <button
          onClick={() => handleFormat("h2")}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          title="Heading 2"
        >
          <Heading2 size={14} />
        </button>
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
        <button
          onClick={() => handleFormat("ul")}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          title="Bullet List"
        >
          <List size={14} />
        </button>
        <button
          onClick={() => handleFormat("ol")}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          title="Numbered List"
        >
          <ListOrdered size={14} />
        </button>
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
        <button
          onClick={() => handleFormat("code")}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          title="Code Block"
        >
          <Code size={14} />
        </button>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          className="min-h-full p-6 text-sm text-gray-800 dark:text-gray-200 leading-relaxed outline-none prose prose-sm dark:prose-invert max-w-none
            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:text-gray-900 [&_h1]:dark:text-white
            [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:text-gray-900 [&_h2]:dark:text-white
            [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:text-gray-900 [&_h3]:dark:text-white
            [&_p]:mb-2
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2
            [&_li]:mb-1
            [&_pre]:bg-gray-100 [&_pre]:dark:bg-gray-800 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-xs [&_pre]:overflow-x-auto
            [&_code]:bg-gray-100 [&_code]:dark:bg-gray-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs
            [&_strong]:font-bold
            [&_em]:italic"
          dangerouslySetInnerHTML={{ __html: formatContentToHtml(activeDocument.content) }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
        <span>Last modified: {new Date(activeDocument.lastModified).toLocaleTimeString()}</span>
        <span>{activeDocument.content.split(/\s+/).filter(Boolean).length} words</span>
      </div>
    </div>
  );
}

/**
 * Converts plain text/markdown content to simple HTML for contentEditable display.
 */
function formatContentToHtml(content: string): string {
  if (!content) return "<p></p>";

  // Convert markdown-like syntax to HTML
  let html = content
    // Headings
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    // Bold and italic
    .replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Lists
    .replace(/^- (.*)$/gm, "<li>$1</li>")
    .replace(/^(\d+)\. (.*)$/gm, "<li>$2</li>");

  // Wrap consecutive <li> items in <ul>
  html = html.replace(/((<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");

  // Convert remaining newlines to paragraphs
  const lines = html.split("\n");
  const result: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      result.push("<p><br></p>");
    } else if (
      trimmed.startsWith("<h") ||
      trimmed.startsWith("<ul") ||
      trimmed.startsWith("<ol") ||
      trimmed.startsWith("<li") ||
      trimmed.startsWith("<pre")
    ) {
      result.push(trimmed);
    } else {
      result.push(`<p>${trimmed}</p>`);
    }
  }

  return result.join("");
}

/**
 * Extracts documents from message content.
 * Looks for <document title="...">content</document> blocks.
 */
export function extractDocuments(content: string): Document[] {
  const documents: Document[] = [];
  const docRegex = /<document\s+title="([^"]*)">([\s\S]*?)<\/document>/gi;

  let match;
  let index = 0;
  while ((match = docRegex.exec(content)) !== null) {
    documents.push({
      id: `doc-${Date.now()}-${index}`,
      title: match[1],
      content: match[2].trim(),
      lastModified: new Date(),
    });
    index++;
  }

  return documents;
}
