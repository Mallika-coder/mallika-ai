export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  files?: FileAttachment[];
  toolCalls?: ToolCall[];
  timestamp: Date;
  feedback?: "up" | "down" | null;
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
  type:
    | "stream"
    | "tool_start"
    | "tool_result"
    | "tool_error"
    | "done"
    | "error"
    | "suggested_follow_ups"
    | "title_generated"
    | "token_usage"
    | "token_usage_total";
  content?: string;
  tool?: string;
  args?: Record<string, any>;
  result?: any;
  message?: string;
  suggestions?: string[];
  title?: string;
  usage?: TokenUsage;
  total?: TokenUsage;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface Artifact {
  id: string;
  type: "html" | "markdown" | "svg" | "code";
  title: string;
  content: string;
  language?: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  lastModified: Date;
}
