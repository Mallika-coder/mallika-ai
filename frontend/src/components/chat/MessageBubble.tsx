"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, User, Bot, ThumbsUp, ThumbsDown, Pencil } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Message } from "@/types/chat";

interface MessageBubbleProps {
  message: Message;
  onEdit?: (messageId: string, newContent: string) => void;
  onFeedback?: (messageId: string, feedback: "up" | "down") => void;
}

export function MessageBubble({ message, onEdit, onFeedback }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [isEditing]);

  const handleEditSubmit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit?.(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  return (
    <div className={`group flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
          <Bot size={16} className="text-white" />
        </div>
      )}

      <div className="relative max-w-[80%]">
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-blue-600 text-white"
              : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          }`}
        >
          {message.files && message.files.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {message.files.map((file, i) => (
                <span
                  key={i}
                  className={`text-xs rounded px-2 py-0.5 ${
                    isUser ? "bg-blue-500/30" : "bg-gray-100 dark:bg-gray-700"
                  }`}
                >
                  {file.name}
                </span>
              ))}
            </div>
          )}

          {isUser ? (
            isEditing ? (
              <div className="space-y-2">
                <textarea
                  ref={textareaRef}
                  value={editContent}
                  onChange={(e) => {
                    setEditContent(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleEditSubmit();
                    }
                    if (e.key === "Escape") {
                      handleEditCancel();
                    }
                  }}
                  className="w-full bg-blue-700/50 text-white rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-300 min-h-[40px]"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleEditCancel}
                    className="px-3 py-1 text-xs rounded-lg bg-blue-700/50 hover:bg-blue-700 text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditSubmit}
                    className="px-3 py-1 text-xs rounded-lg bg-white text-blue-600 hover:bg-gray-100 font-medium transition"
                  >
                    Save & Submit
                  </button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )
          ) : (
            <div className="prose dark:prose-invert prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    if (!inline && match) {
                      return (
                        <CodeBlockWithCopy language={match[1]}>
                          {String(children).replace(/\n$/, "")}
                        </CodeBlockWithCopy>
                      );
                    }
                    return (
                      <code
                        className="bg-gray-100 dark:bg-gray-700 rounded px-1 py-0.5 text-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                          {children}
                        </table>
                      </div>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {isUser && !isEditing && message.id !== "streaming" && (
          <div className="absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
              title="Edit message"
            >
              <Pencil size={13} />
            </button>
          </div>
        )}

        {!isUser && message.id !== "streaming" && (
          <div className="absolute -bottom-6 left-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onFeedback?.(message.id, "up")}
              className={`p-1 rounded transition ${
                message.feedback === "up"
                  ? "text-green-500"
                  : "text-gray-400 hover:text-green-500"
              }`}
              title="Good response"
            >
              <ThumbsUp size={13} />
            </button>
            <button
              onClick={() => onFeedback?.(message.id, "down")}
              className={`p-1 rounded transition ${
                message.feedback === "down"
                  ? "text-red-500"
                  : "text-gray-400 hover:text-red-500"
              }`}
              title="Bad response"
            >
              <ThumbsDown size={13} />
            </button>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-gray-300 dark:bg-gray-600 flex items-center justify-center shrink-0">
          <User size={16} className="text-gray-600 dark:text-gray-300" />
        </div>
      )}
    </div>
  );
}

function CodeBlockWithCopy({
  language,
  children,
}: {
  language: string;
  children: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group/code my-4 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 text-xs text-gray-400">
        <span>{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{ margin: 0, borderRadius: 0 }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}
