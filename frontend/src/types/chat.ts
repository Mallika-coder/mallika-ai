export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  files?: FileAttachment[];
  toolCalls?: ToolCall[];
  timestamp: Date;
}

export interface ToolCall {
  name: string;
  args: Record<string, any>;
  result?: any;
  status: "running" | "complete" | "error";
}

export interface FileAttachment {
  name: string;
  type: string;
  size: number;
  url?: string;
}

export interface StreamEvent {
  type: "stream" | "tool_start" | "tool_result" | "tool_error" | "done" | "error";
  content?: string;
  tool?: string;
  args?: Record<string, any>;
  result?: any;
  message?: string;
}
