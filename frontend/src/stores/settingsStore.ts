import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  selectedModel: string;
  selectedProvider: string;
  theme: "light" | "dark" | "system";
  setModel: (model: string) => void;
  setProvider: (provider: string) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      selectedModel: "gpt-4o",
      selectedProvider: "openai",
      theme: "dark",
      setModel: (model) => set({ selectedModel: model }),
      setProvider: (provider) => set({ selectedProvider: provider }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "mallika-settings",
    }
  )
);
