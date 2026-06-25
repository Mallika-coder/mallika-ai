export const MODELS = [
  { id: "gpt-4o", name: "GPT-4o", provider: "openai", icon: "🟢" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", icon: "🟢" },
  { id: "claude-sonnet-4-20250514", name: "Claude Sonnet", provider: "anthropic", icon: "🟠" },
  { id: "claude-haiku-4-5-20251001", name: "Claude Haiku", provider: "anthropic", icon: "🟠" },
  { id: "llama3:8b", name: "LLaMA 3 8B", provider: "ollama", icon: "🦙" },
  { id: "llama3:70b", name: "LLaMA 3 70B", provider: "ollama", icon: "🦙" },
  { id: "mistral:7b", name: "Mistral 7B", provider: "ollama", icon: "🌀" },
] as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const ACCEPTED_FILE_TYPES = [
  ".pdf", ".docx", ".doc", ".csv", ".xlsx", ".xls",
  ".txt", ".md", ".py", ".js", ".ts", ".html", ".css", ".json",
  ".png", ".jpg", ".jpeg", ".gif", ".webp",
];

export const SUGGESTIONS = [
  "Explain quantum computing in simple terms",
  "Write a Python function to sort a linked list",
  "Analyze the pros and cons of microservices",
  "Help me debug this code",
  "Search for the latest AI research papers",
  "Create a presentation about machine learning",
];
