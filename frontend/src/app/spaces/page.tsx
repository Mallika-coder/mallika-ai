"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Plus, FolderOpen, Trash2, Upload } from "lucide-react";
import { api } from "@/lib/api";

interface Space {
  id: string;
  name: string;
  description: string;
  icon: string;
  created_at: string;
}

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    loadSpaces();
  }, []);

  const loadSpaces = async () => {
    const data = await api.get("/spaces");
    setSpaces(data);
  };

  const createSpace = async () => {
    if (!newName.trim()) return;
    await api.post("/spaces", { name: newName, description: newDesc });
    setNewName("");
    setNewDesc("");
    setShowCreate(false);
    loadSpaces();
  };

  const deleteSpace = async (id: string) => {
    await api.delete(`/spaces/${id}`);
    loadSpaces();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold dark:text-white">Knowledge Spaces</h1>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={18} />
              New Space
            </button>
          </div>

          {showCreate && (
            <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <input
                type="text"
                placeholder="Space name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full mb-3 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full mb-3 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-white"
              />
              <div className="flex gap-2">
                <button onClick={createSpace} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  Create
                </button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {spaces.map((space) => (
              <div
                key={space.id}
                className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <FolderOpen size={24} className="text-blue-500" />
                    <div>
                      <h3 className="font-medium dark:text-white">{space.name}</h3>
                      <p className="text-sm text-gray-500">{space.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSpace(space.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {spaces.length === 0 && !showCreate && (
            <div className="text-center py-12 text-gray-500">
              <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
              <p>No knowledge spaces yet. Create one to get started.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
