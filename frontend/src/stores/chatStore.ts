import { create } from "zustand";
import { Message } from "@/types/chat";

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  currentConversationId: string | null;
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;
  setStreaming: (streaming: boolean) => void;
  setConversationId: (id: string | null) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  currentConversationId: null,
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateLastMessage: (content) =>
    set((state) => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          content: messages[messages.length - 1].content + content,
        };
      }
      return { messages };
    }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setConversationId: (id) => set({ currentConversationId: id }),
  clearMessages: () => set({ messages: [] }),
}));
