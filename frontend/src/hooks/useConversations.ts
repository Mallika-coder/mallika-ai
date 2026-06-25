import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

interface Conversation {
  id: string;
  title: string;
  model: string;
  provider: string;
  updated_at: string;
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const data = await api.get("/conversations");
      setConversations(data);
    } catch (e) {
      console.error("Failed to fetch conversations:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createConversation = async (title?: string, model?: string, provider?: string) => {
    const data = await api.post("/conversations", { title, model, provider });
    setConversations((prev) => [data, ...prev]);
    return data;
  };

  const deleteConversation = async (id: string) => {
    await api.delete(`/conversations/${id}`);
    setConversations((prev) => prev.filter((c) => c.id !== id));
  };

  return {
    conversations,
    isLoading,
    createConversation,
    deleteConversation,
    refresh: fetchConversations,
  };
}
