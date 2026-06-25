import React, { useState, useEffect } from "react";

export function Settings({ onClose }: { onClose: () => void }) {
  const [apiUrl, setApiUrl] = useState("http://localhost:8000");

  useEffect(() => {
    chrome.storage.local.get(["apiUrl"], (result) => {
      if (result.apiUrl) setApiUrl(result.apiUrl);
    });
  }, []);

  const handleSave = () => {
    chrome.storage.local.set({ apiUrl });
    onClose();
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold text-white">Settings</h2>
      <div>
        <label className="block text-sm text-gray-400 mb-1">API URL</label>
        <input
          type="text"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
        />
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 rounded-lg text-sm">
          Save
        </button>
        <button onClick={onClose} className="px-4 py-2 text-gray-400 text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}
