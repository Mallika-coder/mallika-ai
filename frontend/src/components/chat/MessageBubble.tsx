"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, User, Bot } from "lucide-react";
import { useState } from "react";
import { Message } from "@/types/chat";

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
          <Bot size={16} className="text-white" />
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
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
                📎 {file.name}
              </span>
            ))}
          </div>
        )}

        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
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
    <div className="relative group my-4 rounded-lg overflow-hidden">
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
