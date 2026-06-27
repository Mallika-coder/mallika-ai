"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { MessageBubble } from "./MessageBubble";
import { InputBar } from "./InputBar";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { ToolCallDisplay } from "./ToolCallDisplay";
import { ArtifactPanel, extractArtifacts } from "./ArtifactPanel";
import { ExportDropdown } from "./ExportDropdown";
import { ShareModal } from "./ShareModal";
import { Message, ToolCall, Artifact, TokenUsage } from "@/types/chat";
import { PanelRightOpen, PanelRightClose, Download, Share2 } from "lucide-react";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";

export function ChatWindow({ conversationId }: { conversationId?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentToolCall, setCurrentToolCall] = useState<ToolCall | null>(null);
  const [suggestedFollowUps, setSuggestedFollowUps] = useState<string[]>([]);
  const [conversationTitle, setConversationTitle] = useState<string>("");
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [showArtifactPanel, setShowArtifactPanel] = useState(false);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [showExport, setShowExport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage, stopGeneration, ws } = useChat(conversationId);

  // Extract artifacts whenever messages change
  useEffect(() => {
    const allArtifacts: Artifact[] = [];
    messages.forEach((msg) => {
      if (msg.role === "assistant") {
        const extracted = extractArtifacts(msg.content);
        allArtifacts.push(...extracted);
      }
    });
    setArtifacts(allArtifacts);
    if (allArtifacts.length > 0 && !showArtifactPanel) {
      setShowArtifactPanel(true);
    }
  }, [messages]);

  useEffect(() => {
    if (!ws) return;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "stream":
          setIsStreaming(true);
          setSuggestedFollowUps([]);
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
                { ...last, id: data.message_id || crypto.randomUUID() },
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

        case "suggested_follow_ups":
          setSuggestedFollowUps(data.suggestions || []);
          break;

        case "title_generated":
          setConversationTitle(data.title || "");
          // Update page title
          if (data.title) {
            document.title = `${data.title} - MallikaAI`;
          }
          break;

        case "token_usage":
        case "token_usage_total":
          setTokenUsage(data.usage || data.total || null);
          break;
      }
    };
  }, [ws]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentToolCall]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && e.key === "k") {
        e.preventDefault();
        window.location.href = "/chat";
      }
      if (isMod && e.key === "/") {
        e.preventDefault();
        setShowShortcuts(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSend = async (content: string, files?: File[]) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      files: files?.map((f) => ({ name: f.name, type: f.type, size: f.size })),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setSuggestedFollowUps([]);
    await sendMessage(content, files);
  };

  const handleEdit = async (messageId: string, newContent: string) => {
    // Find the index of the message being edited
    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    // Remove all messages after this one and resend
    setMessages((prev) => prev.slice(0, msgIndex));
    setSuggestedFollowUps([]);

    // Send the edited message as new
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: newContent,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    await sendMessage(newContent);
  };

  const handleFeedback = async (messageId: string, feedback: "up" | "down") => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messages/${messageId}/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ feedback }),
        }
      );
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, feedback } : m))
      );
    } catch (e) {
      // Silently fail
    }
  };

  return (
    <div className="flex h-full">
      <div className="flex flex-col flex-1 bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        {(conversationId || conversationTitle) && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h2 className="text-sm font-medium dark:text-white truncate">
              {conversationTitle || "New Conversation"}
            </h2>
            <div className="flex items-center gap-1">
              {conversationId && (
                <>
                  <div className="relative">
                    <button
                      onClick={() => setShowExport(!showExport)}
                      className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      title="Export"
                    >
                      <Download size={16} />
                    </button>
                    {showExport && (
                      <ExportDropdown
                        conversationId={conversationId}
                        onClose={() => setShowExport(false)}
                      />
                    )}
                  </div>
                  <button
                    onClick={() => setShowShare(true)}
                    className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    title="Share"
                  >
                    <Share2 size={16} />
                  </button>
                </>
              )}
              <button
                onClick={() => setShowArtifactPanel(!showArtifactPanel)}
                className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                  artifacts.length > 0
                    ? "text-blue-500"
                    : "text-gray-400 opacity-50 cursor-not-allowed"
                }`}
                disabled={artifacts.length === 0}
                title="Toggle artifacts panel"
              >
                {showArtifactPanel ? (
                  <PanelRightClose size={16} />
                ) : (
                  <PanelRightOpen size={16} />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
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
            <MessageBubble
              key={msg.id}
              message={msg}
              onEdit={handleEdit}
              onFeedback={handleFeedback}
            />
          ))}

          {currentToolCall && <ToolCallDisplay toolCall={currentToolCall} />}
          {isStreaming && !currentToolCall && <ThinkingIndicator />}

          {/* Suggested Follow-ups */}
          {suggestedFollowUps.length > 0 && !isStreaming && (
            <div className="flex flex-wrap gap-2 mt-3">
              {suggestedFollowUps.slice(0, 3).map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(suggestion)}
                  className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Token Usage Badge */}
        {tokenUsage && (
          <div className="flex justify-center pb-1">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              Tokens: {tokenUsage.total_tokens.toLocaleString()} (prompt: {tokenUsage.prompt_tokens.toLocaleString()} + completion: {tokenUsage.completion_tokens.toLocaleString()})
            </span>
          </div>
        )}

        <InputBar
          onSend={handleSend}
          onStop={stopGeneration}
          isStreaming={isStreaming}
          disabled={isStreaming}
        />
      </div>

      {/* Artifact Panel */}
      {showArtifactPanel && artifacts.length > 0 && (
        <ArtifactPanel
          artifacts={artifacts}
          onClose={() => setShowArtifactPanel(false)}
        />
      )}

      {/* Share Modal */}
      {showShare && conversationId && (
        <ShareModal
          conversationId={conversationId}
          onClose={() => setShowShare(false)}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}
    </div>
  );
}
