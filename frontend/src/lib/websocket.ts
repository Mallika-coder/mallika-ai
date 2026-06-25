const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export function createChatWebSocket(conversationId: string) {
  return new WebSocket(`${WS_URL}/ws/chat/${conversationId}`);
}
