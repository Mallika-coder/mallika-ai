"use client";

import { Wrench, Check, AlertCircle, Loader2 } from "lucide-react";
import { ToolCall } from "@/types/chat";

export function ToolCallDisplay({ toolCall }: { toolCall: ToolCall }) {
  const statusIcon = {
    running: <Loader2 size={14} className="animate-spin text-blue-500" />,
    complete: <Check size={14} className="text-green-500" />,
    error: <AlertCircle size={14} className="text-red-500" />,
  };

  const toolLabels: Record<string, string> = {
    web_search: "Searching the web",
    code_executor: "Running code",
    file_reader: "Reading file",
    document_generator: "Generating document",
    data_analyzer: "Analyzing data",
    chart_generator: "Creating chart",
    calculator: "Calculating",
    image_analyzer: "Analyzing image",
  };

  return (
    <div className="flex items-start gap-3 px-4 py-2">
      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
        <Wrench size={16} className="text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          {statusIcon[toolCall.status]}
          <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {toolLabels[toolCall.name] || toolCall.name}
          </span>
        </div>
        {toolCall.args && (
          <p className="text-xs text-amber-700 dark:text-amber-400 opacity-75">
            {toolCall.name === "web_search" && `"${toolCall.args.query}"`}
            {toolCall.name === "code_executor" && "Executing code..."}
            {toolCall.name === "file_reader" && toolCall.args.file_path}
            {toolCall.name === "calculator" && toolCall.args.expression}
          </p>
        )}
        {toolCall.status === "complete" && toolCall.result && (
          <div className="mt-2 text-xs text-green-700 dark:text-green-400">
            Done
          </div>
        )}
      </div>
    </div>
  );
}
