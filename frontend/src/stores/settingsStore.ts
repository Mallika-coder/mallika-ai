import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ApiKeys {
  openai: string;
  anthropic: string;
  groq: string;
}

interface SettingsState {
  selectedModel: string;
  selectedProvider: string;
  theme: "light" | "dark" | "system";
  temperature: number;
  maxTokens: number;
  topP: number;
  customInstructions: string;
  apiKeys: ApiKeys;
  setModel: (model: string) => void;
  setProvider: (provider: string) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setTemperature: (temperature: number) => void;
  setMaxTokens: (maxTokens: number) => void;
  setTopP: (topP: number) => void;
  setCustomInstructions: (instructions: string) => void;
  setApiKeys: (keys: Partial<ApiKeys>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      selectedModel: "llama-3.1-70b-versatile",
      selectedProvider: "groq",
      theme: "dark",
      temperature: 0.7,
      maxTokens: 4096,
      topP: 1.0,
      customInstructions: "",
      apiKeys: { openai: "", anthropic: "", groq: "" },
      setModel: (model) => set({ selectedModel: model }),
      setProvider: (provider) => set({ selectedProvider: provider }),
      setTheme: (theme) => set({ theme }),
      setTemperature: (temperature) => set({ temperature }),
      setMaxTokens: (maxTokens) => set({ maxTokens }),
      setTopP: (topP) => set({ topP }),
      setCustomInstructions: (instructions) => set({ customInstructions: instructions }),
      setApiKeys: (keys) => set({ apiKeys: { ...get().apiKeys, ...keys } }),
    }),
    {
      name: "mallika-settings",
    }
  )
);
