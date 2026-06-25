"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Paperclip, Send, Square } from "lucide-react";

interface InputBarProps {
  onSend: (content: string, files?: File[]) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled: boolean;
}

export function InputBar({ onSend, onStop, isStreaming, disabled }: InputBarProps) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!input.trim() && files.length === 0) return;
    onSend(input, files.length > 0 ? files : undefined);
    setInput("");
    setFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5 text-sm dark:text-gray-300"
            >
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button
                onClick={() => removeFile(i)}
                className="text-gray-500 hover:text-red-500"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Attach files"
        >
          <Paperclip size={20} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.docx,.doc,.csv,.xlsx,.xls,.txt,.md,.py,.js,.ts,.html,.css,.json,.png,.jpg,.jpeg,.gif,.webp"
        />

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything... (Shift+Enter for new line)"
            rows={1}
            className="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white max-h-[200px] overflow-y-auto"
            style={{ minHeight: "44px" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 200) + "px";
            }}
          />
        </div>

        {isStreaming ? (
          <button
            onClick={onStop}
            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            title="Stop generation"
          >
            <Square size={20} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!input.trim() && files.length === 0}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            title="Send message"
          >
            <Send size={20} />
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center mt-2">
        MallikaAI can make mistakes. Verify important information.
      </p>
    </div>
  );
}
