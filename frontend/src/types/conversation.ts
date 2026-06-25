export interface Conversation {
  id: string;
  title: string;
  model: string;
  provider: string;
  space_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: {
    id: string;
    role: string;
    content: string;
    tool_calls: any;
    files: any;
    created_at: string;
  }[];
}
