import React from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatProps {
  messages: Message[];
  isLoading: boolean;
}

export function Chat({ messages, isLoading }: ChatProps) {
  return (
    <div className="space-y-3">
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
    </div>
  );
}
