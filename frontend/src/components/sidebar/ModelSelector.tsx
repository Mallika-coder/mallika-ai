"use client";

import { useSettingsStore } from "@/stores/settingsStore";

const MODELS = [
  { id: "llama-3.3-70b-versatile", name: "LLaMA 3.3 70B (Free)", provider: "groq", icon: "⚡" },
  { id: "llama-3.1-8b-instant", name: "LLaMA 3.1 8B (Free)", provider: "groq", icon: "⚡" },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B (Free)", provider: "groq", icon: "⚡" },
  { id: "gpt-4o", name: "GPT-4o", provider: "openai", icon: "🟢" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", icon: "🟢" },
  { id: "claude-sonnet-4-20250514", name: "Claude Sonnet", provider: "anthropic", icon: "🟠" },
  { id: "llama3:8b", name: "LLaMA 3 (Local)", provider: "ollama", icon: "🦙" },
  { id: "mistral:7b", name: "Mistral (Local)", provider: "ollama", icon: "🌀" },
];

export function ModelSelector() {
  const { selectedModel, setModel, setProvider } = useSettingsStore();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const model = MODELS.find((m) => m.id === e.target.value);
    if (model) {
      setModel(model.id);
      setProvider(model.provider);
    }
  };

  return (
    <select
      value={selectedModel}
      onChange={handleChange}
      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-600"
    >
      {MODELS.map((model) => (
        <option key={model.id} value={model.id}>
          {model.icon} {model.name}
        </option>
      ))}
    </select>
  );
}
