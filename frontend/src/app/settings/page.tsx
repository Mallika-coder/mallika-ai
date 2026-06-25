"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { useSettingsStore } from "@/stores/settingsStore";

export default function SettingsPage() {
  const { selectedModel, selectedProvider, setModel, setProvider, theme, setTheme } = useSettingsStore();
  const [apiKeys, setApiKeys] = useState({
    openai: "",
    anthropic: "",
    tavily: "",
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold dark:text-white mb-8">Settings</h1>

          <section className="mb-8">
            <h2 className="text-lg font-semibold dark:text-white mb-4">Model Selection</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium dark:text-gray-300 mb-1">Provider</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-gray-300 mb-1">Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                >
                  {selectedProvider === "openai" && (
                    <>
                      <option value="gpt-4o">GPT-4o</option>
                      <option value="gpt-4o-mini">GPT-4o Mini</option>
                    </>
                  )}
                  {selectedProvider === "anthropic" && (
                    <>
                      <option value="claude-sonnet-4-20250514">Claude Sonnet</option>
                      <option value="claude-haiku-4-5-20251001">Claude Haiku</option>
                    </>
                  )}
                  {selectedProvider === "ollama" && (
                    <>
                      <option value="llama3:8b">LLaMA 3 8B</option>
                      <option value="llama3:70b">LLaMA 3 70B</option>
                      <option value="mistral:7b">Mistral 7B</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold dark:text-white mb-4">Appearance</h2>
            <div>
              <label className="block text-sm font-medium dark:text-gray-300 mb-1">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold dark:text-white mb-4">API Keys</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Keys are stored locally and sent to the backend for API calls.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium dark:text-gray-300 mb-1">OpenAI API Key</label>
                <input
                  type="password"
                  value={apiKeys.openai}
                  onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-gray-300 mb-1">Anthropic API Key</label>
                <input
                  type="password"
                  value={apiKeys.anthropic}
                  onChange={(e) => setApiKeys({ ...apiKeys, anthropic: e.target.value })}
                  placeholder="sk-ant-..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
