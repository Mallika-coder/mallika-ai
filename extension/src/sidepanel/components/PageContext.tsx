import React, { useState } from "react";

export function PageContext({ onUseContext }: { onUseContext: (context: string) => void }) {
  const [pageContent, setPageContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const extractPage = async () => {
    setIsLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({ type: "GET_PAGE_CONTENT" });
      if (response?.content) {
        setPageContent(response.content);
      }
    } catch (err) {
      console.error("Failed to extract page content:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-2 border-b border-gray-700">
      <button
        onClick={extractPage}
        disabled={isLoading}
        className="text-xs text-blue-400 hover:text-blue-300"
      >
        {isLoading ? "Extracting..." : "Use page context"}
      </button>
      {pageContent && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 truncate">{pageContent.slice(0, 100)}...</p>
          <button
            onClick={() => onUseContext(pageContent)}
            className="text-xs text-green-400 hover:text-green-300 mt-1"
          >
            Add to message
          </button>
        </div>
      )}
    </div>
  );
}
