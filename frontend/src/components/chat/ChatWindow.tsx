"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { MessageBubble } from "./MessageBubble";
import { InputBar } from "./InputBar";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { ToolCallDisplay } from "./ToolCallDisplay";
import { Message, ToolCall } from "@/types/chat";

export function ChatWindow({ conversationId }: { conversationId?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentToolCall, setCurrentToolCall] = useState<ToolCall | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage, stopGeneration, ws } = useChat(conversationId);

  useEffect(() => {
    if (!ws) return;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "stream":
          setIsStreaming(true);
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.id === "streaming") {
              return [
                ...prev.slice(0, -1),
                { ...last, content: last.content + data.content },
              ];
            }
            return [
              ...prev,
              {
                id: "streaming",
                role: "assistant",
                content: data.content,
                timestamp: new Date(),
              },
            ];
          });
          break;

        case "tool_start":
          setCurrentToolCall({
            name: data.tool,
            args: data.args,
            status: "running",
          });
          break;

        case "tool_result":
          setCurrentToolCall((prev) =>
            prev ? { ...prev, result: data.result, status: "complete" } : null
          );
          setTimeout(() => setCurrentToolCall(null), 1500);
          break;

        case "tool_error":
          setCurrentToolCall((prev) =>
            prev ? { ...prev, result: { error: data.error }, status: "error" } : null
          );
          setTimeout(() => setCurrentToolCall(null), 2000);
          break;

        case "done":
          setIsStreaming(false);
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.id === "streaming") {
              return [
                ...prev.slice(0, -1),
                { ...last, id: crypto.randomUUID() },
              ];
            }
            return prev;
          });
          break;

        case "error":
          setIsStreaming(false);
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: `Error: ${data.message}`,
              timestamp: new Date(),
            },
          ]);
          break;
      }
    };
  }, [ws]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentToolCall]);

  const handleSend = async (content: string, files?: File[]) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      files: files?.map((f) => ({ name: f.name, type: f.type, size: f.size })),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    await sendMessage(content, files);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">M</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              MallikaAI
            </h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Your personal AI assistant with deep reasoning, code execution,
              file analysis, and web search capabilities.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 max-w-lg">
              {[
                "Explain quantum computing",
                "Write a Python web scraper",
                "Analyze this CSV data",
                "Search for latest AI news",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="px-4 py-3 text-sm text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 transition"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {currentToolCall && <ToolCallDisplay toolCall={currentToolCall} />}
        {isStreaming && !currentToolCall && <ThinkingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      <InputBar
        onSend={handleSend}
        onStop={stopGeneration}
        isStreaming={isStreaming}
        disabled={isStreaming}
      />
    </div>
  );
}
