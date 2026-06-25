"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, Play } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language: string;
  showRunButton?: boolean;
  onRun?: (code: string) => void;
}

export function CodeBlock({ code, language, showRunButton, onRun }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden border border-gray-700">
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 text-xs text-gray-400">
        <span>{language}</span>
        <div className="flex items-center gap-2">
          {showRunButton && onRun && (
            <button
              onClick={() => onRun(code)}
              className="flex items-center gap-1 hover:text-green-400 transition"
            >
              <Play size={12} />
              Run
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-white transition"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{ margin: 0, borderRadius: 0 }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
