"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Brain, Trash2, Plus, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface Memory {
  id: string;
  content: string;
  source: string;
  category: string | null;
  created_at: string;
}

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMemory, setNewMemory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      const data = await api.get("/memories");
      setMemories(data);
    } catch (e) {
      // Not authenticated
    } finally {
      setLoading(false);
    }
  };

  const addMemory = async () => {
    if (!newMemory.trim()) return;
    try {
      await api.post("/memories", {
        content: newMemory.trim(),
        category: newCategory.trim() || null,
      });
      setNewMemory("");
      setNewCategory("");
      setShowAdd(false);
      loadMemories();
    } catch (e) {}
  };

  const deleteMemory = async (id: string) => {
    try {
      await api.delete(`/memories/${id}`);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {}
  };

  const clearAll = async () => {
    if (!confirm("Are you sure you want to delete all memories? This cannot be undone.")) return;
    setClearing(true);
    try {
      await api.delete("/memories");
      setMemories([]);
    } catch (e) {}
    setClearing(false);
  };

  const groupedMemories = memories.reduce<Record<string, Memory[]>>((acc, m) => {
    const key = m.source === "explicit" ? "Manually Saved" : m.source === "extracted" ? "Auto-Extracted" : "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Brain className="text-purple-500" size={28} />
              <div>
                <h1 className="text-2xl font-bold dark:text-white">Memory</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Facts the AI remembers about you across conversations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus size={16} />
                Add
              </button>
              {memories.length > 0 && (
                <button
                  onClick={clearAll}
                  disabled={clearing}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {clearing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Clear All
                </button>
              )}
            </div>
          </div>

          {showAdd && (
            <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <textarea
                value={newMemory}
                onChange={(e) => setNewMemory(e.target.value)}
                placeholder="e.g., I prefer TypeScript over JavaScript, I work on the payments team..."
                rows={3}
                className="w-full mb-3 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-white text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Category (optional, e.g., preferences, work, personal)"
                className="w-full mb-3 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={addMemory}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Save Memory
                </button>
                <button
                  onClick={() => {
                    setShowAdd(false);
                    setNewMemory("");
                    setNewCategory("");
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                The AI automatically extracts and remembers relevant facts from your conversations.
                You can also manually add memories or say &ldquo;remember that...&rdquo; in chat.
                Delete any memory you don&apos;t want the AI to use.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : memories.length === 0 ? (
            <div className="text-center py-12">
              <Brain size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">
                No memories yet. Start chatting and the AI will remember important details,
                or add them manually.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedMemories).map(([group, items]) => (
                <div key={group}>
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    {group} ({items.length})
                  </h2>
                  <div className="space-y-2">
                    {items.map((memory) => (
                      <div
                        key={memory.id}
                        className="group flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm dark:text-white">{memory.content}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {memory.category && (
                              <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                                {memory.category}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {new Date(memory.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteMemory(memory.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition"
                          title="Delete memory"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
