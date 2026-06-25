export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ChatRequest {
  type: "CHAT_MESSAGE";
  content: string;
  model: string;
  provider: string;
}

export interface PageContentRequest {
  type: "GET_PAGE_CONTENT";
}

export interface SelectionRequest {
  type: "ASK_ABOUT_SELECTION";
  text: string;
}

export type ExtensionMessage = ChatRequest | PageContentRequest | SelectionRequest;
