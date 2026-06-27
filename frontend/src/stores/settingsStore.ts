import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  selectedModel: string;
  selectedProvider: string;
  theme: "light" | "dark" | "system";
  temperature: number;
  maxTokens: number;
  topP: number;
  customInstructions: string;
  setModel: (model: string) => void;
  setProvider: (provider: string) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setTemperature: (temperature: number) => void;
  setMaxTokens: (maxTokens: number) => void;
  setTopP: (topP: number) => void;
  setCustomInstructions: (instructions: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      selectedModel: "gpt-4o",
      selectedProvider: "openai",
      theme: "dark",
      temperature: 0.7,
      maxTokens: 4096,
      topP: 1.0,
      customInstructions: "",
      setModel: (model) => set({ selectedModel: model }),
      setProvider: (provider) => set({ selectedProvider: provider }),
      setTheme: (theme) => set({ theme }),
      setTemperature: (temperature) => set({ temperature }),
      setMaxTokens: (maxTokens) => set({ maxTokens }),
      setTopP: (topP) => set({ topP }),
      setCustomInstructions: (instructions) => set({ customInstructions: instructions }),
    }),
    {
      name: "mallika-settings",
    }
  )
);
