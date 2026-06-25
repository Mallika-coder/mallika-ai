import React, { useState } from "react";
import { createRoot } from "react-dom/client";

function Popup() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setResponse("");

    try {
      const result = await chrome.runtime.sendMessage({
        type: "CHAT_MESSAGE",
        content: input,
        model: "gpt-4o",
        provider: "openai",
      });
      setResponse(result?.text || result?.error || "No response");
    } catch (err: any) {
      setResponse(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const openSidePanel = () => {
    chrome.sidePanel.open({});
  };

  return (
    <div className="p-4 bg-gray-900 text-white h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          MallikaAI
        </h1>
        <button
          onClick={openSidePanel}
          className="text-xs text-gray-400 hover:text-white"
        >
          Open Panel
        </button>
      </div>

      <div className="flex-1 overflow-y-auto mb-3">
        {response && (
          <div className="p-3 bg-gray-800 rounded-xl text-sm whitespace-pre-wrap border border-gray-700">
            {response}
          </div>
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
            Thinking...
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder="Quick question..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleAsk}
          disabled={isLoading || !input.trim()}
          className="px-3 py-2 bg-blue-600 rounded-lg text-sm disabled:opacity-50"
        >
          Ask
        </button>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<Popup />);
