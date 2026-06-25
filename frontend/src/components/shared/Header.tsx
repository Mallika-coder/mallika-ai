"use client";

import { Menu } from "lucide-react";

interface HeaderProps {
  title?: string;
  onToggleSidebar?: () => void;
}

export function Header({ title = "MallikaAI", onToggleSidebar }: HeaderProps) {
  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center px-4 gap-3">
      {onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <Menu size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
      )}
      <h1 className="text-lg font-semibold dark:text-white">{title}</h1>
    </header>
  );
}
