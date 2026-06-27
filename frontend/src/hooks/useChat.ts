import { useRef, useEffect, useState, useCallback } from "react";
import { useSettingsStore } from "@/stores/settingsStore";

export function useChat(conversationId?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { selectedModel, selectedProvider, temperature, maxTokens, topP, customInstructions } =
    useSettingsStore();

  useEffect(() => {
    const id = conversationId || crypto.randomUUID();
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"}/ws/chat/${id}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [conversationId]);

  const sendMessage = useCallback(
    async (content: string, files?: File[]) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      const userId = localStorage.getItem("userId") || "anonymous";

      wsRef.current.send(
        JSON.stringify({
          type: "message",
          content,
          model: selectedModel,
          provider: selectedProvider,
          user_id: userId,
          temperature,
          max_tokens: maxTokens,
          top_p: topP,
          custom_instructions: customInstructions || undefined,
          files: files
            ? files.map((f) => ({ name: f.name, type: f.type, size: f.size }))
            : [],
        })
      );
    },
    [selectedModel, selectedProvider, temperature, maxTokens, topP, customInstructions]
  );

  const stopGeneration = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "stop" }));
  }, []);

  return {
    sendMessage,
    stopGeneration,
    ws: wsRef.current,
    isConnected,
  };
}
