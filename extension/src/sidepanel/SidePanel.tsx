import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function SidePanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState("gpt-4o");
  const [provider, setProvider] = useState("openai");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "ASK_ABOUT_SELECTION") {
        setInput(message.text);
        handleSend(message.text);
      }
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const content = text || input;
    if (!content.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chrome.runtime.sendMessage({
        type: "CHAT_MESSAGE",
        content,
        model,
        provider,
      });

      if (response?.text) {
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "assistant", content: response.text },
        ]);
      } else if (response?.error) {
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "assistant", content: `Error: ${response.error}` },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: `Error: ${err.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="flex items-center justify-between p-3 border-b border-gray-700">
        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          MallikaAI
        </h1>
        <select
          value={model}
          onChange={(e) => {
            setModel(e.target.value);
            const m = e.target.value;
            if (m.startsWith("gpt")) setProvider("openai");
            else if (m.startsWith("claude")) setProvider("anthropic");
            else setProvider("ollama");
          }}
          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs"
        >
          <option value="gpt-4o">GPT-4o</option>
          <option value="claude-sonnet-4-20250514">Claude Sonnet</option>
          <option value="llama3:8b">LLaMA 3</option>
        </select>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-sm">Ask me anything or select text on a page.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-xl text-sm ${
              msg.role === "user"
                ? "bg-blue-600 ml-8"
                : "bg-gray-800 mr-4 border border-gray-700"
            }`}
          >
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-1 p-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.15s]" />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.3s]" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-gray-700">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows={1}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="px-3 py-2 bg-blue-600 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<SidePanel />);
