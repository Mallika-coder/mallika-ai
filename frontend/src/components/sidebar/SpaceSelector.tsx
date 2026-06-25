"use client";

import { useState, useEffect } from "react";
import { FolderOpen } from "lucide-react";
import { api } from "@/lib/api";

interface Space {
  id: string;
  name: string;
}

interface SpaceSelectorProps {
  selectedSpace: string | null;
  onSelect: (spaceId: string | null) => void;
}

export function SpaceSelector({ selectedSpace, onSelect }: SpaceSelectorProps) {
  const [spaces, setSpaces] = useState<Space[]>([]);

  useEffect(() => {
    loadSpaces();
  }, []);

  const loadSpaces = async () => {
    try {
      const data = await api.get("/spaces");
      setSpaces(data);
    } catch (e) {}
  };

  return (
    <div className="flex items-center gap-2">
      <FolderOpen size={14} className="text-gray-500" />
      <select
        value={selectedSpace || ""}
        onChange={(e) => onSelect(e.target.value || null)}
        className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
      >
        <option value="">No space</option>
        {spaces.map((space) => (
          <option key={space.id} value={space.id}>
            {space.name}
          </option>
        ))}
      </select>
    </div>
  );
}
