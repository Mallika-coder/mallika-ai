"use client";

import { MessageSquare, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  onDelete: (id: string) => void;
}

export function ConversationList({ conversations, onDelete }: ConversationListProps) {
  const router = useRouter();

  return (
    <div className="space-y-1">
      {conversations.map((conv) => (
        <div
          key={conv.id}
          onClick={() => router.push(`/chat/${conv.id}`)}
          className="group flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-800 cursor-pointer transition"
        >
          <MessageSquare size={16} className="text-gray-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate text-white">{conv.title}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(conv.id);
            }}
            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
