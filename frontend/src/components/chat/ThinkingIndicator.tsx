"use client";

export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 px-4 py-2">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
      </div>
      <span className="text-sm">Thinking...</span>
    </div>
  );
}
