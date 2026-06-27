"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, MessageSquare, Settings, Trash2, Search, FolderOpen, Sun, Moon, Brain } from "lucide-react";
import { useRouter } from "next/navigation";
import { ModelSelector } from "./ModelSelector";
import { useSettingsStore } from "@/stores/settingsStore";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  model: string;
}

export function Sidebar() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Conversation[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, setTheme } = useSettingsStore();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchConversations();
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else if (theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      // system
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [theme]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversations`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (e) {
      // Not logged in or server down
    }
  };

  const searchConversations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/conversations/search?q=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (e) {
      // Fall back to local filter
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    // Debounce the search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchConversations(value);
    }, 300);
  };

  const createNewChat = () => {
    router.push("/chat");
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {}
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Use search results if available, otherwise filter locally
  const displayedConversations = searchResults !== null
    ? searchResults
    : conversations.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className="w-72 h-full bg-gray-900 text-white flex flex-col border-r border-gray-800">
      <div className="p-4">
        <button
          onClick={createNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition font-medium"
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      <div className="px-4 mb-3">
        <ModelSelector />
      </div>

      <div className="px-4 mb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:border-gray-600"
          />
          {isSearching && (
            <div className="absolute right-3 top-2.5">
              <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {displayedConversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => router.push(`/chat/${conv.id}`)}
            className="group flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-800 cursor-pointer transition"
          >
            <MessageSquare size={16} className="text-gray-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{conv.title}</p>
            </div>
            <button
              onClick={(e) => deleteConversation(conv.id, e)}
              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {searchQuery && displayedConversations.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-4">
            No conversations found
          </p>
        )}
      </div>

      <div className="p-4 border-t border-gray-800 space-y-2">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white w-full px-2 py-1.5 rounded hover:bg-gray-800 transition"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          onClick={() => router.push("/memories")}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white w-full px-2 py-1.5 rounded hover:bg-gray-800 transition"
        >
          <Brain size={16} />
          Memory
        </button>
        <button
          onClick={() => router.push("/spaces")}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white w-full px-2 py-1.5 rounded hover:bg-gray-800 transition"
        >
          <FolderOpen size={16} />
          Knowledge Spaces
        </button>
        <button
          onClick={() => router.push("/settings")}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white w-full px-2 py-1.5 rounded hover:bg-gray-800 transition"
        >
          <Settings size={16} />
          Settings
        </button>
      </div>
    </div>
  );
}
