"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { useSettingsStore } from "@/stores/settingsStore";
import { Save, Loader2, Check } from "lucide-react";

export default function SettingsPage() {
  const {
    selectedModel,
    selectedProvider,
    setModel,
    setProvider,
    theme,
    setTheme,
    temperature,
    setTemperature,
    maxTokens,
    setMaxTokens,
    topP,
    setTopP,
    customInstructions,
    setCustomInstructions,
    apiKeys,
    setApiKeys,
  } = useSettingsStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [localInstructions, setLocalInstructions] = useState(customInstructions);

  // Load settings from backend on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.custom_instructions) {
            setCustomInstructions(data.custom_instructions);
            setLocalInstructions(data.custom_instructions);
          }
          if (data.temperature !== undefined) setTemperature(data.temperature);
          if (data.max_tokens !== undefined) setMaxTokens(data.max_tokens);
          if (data.top_p !== undefined) setTopP(data.top_p);
        }
      } catch (e) {
        // Use local state
      }
    };
    loadSettings();
  }, []);

  const saveSettings = async () => {
    setIsSaving(true);
    setSaved(false);
    try {
      setCustomInstructions(localInstructions);
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          custom_instructions: localInstructions,
          temperature,
          max_tokens: maxTokens,
          top_p: topP,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      // Settings saved locally regardless
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold dark:text-white mb-8">Settings</h1>

          {/* Custom Instructions */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold dark:text-white mb-2">Custom Instructions</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              These instructions will be included with every message you send.
            </p>
            <textarea
              value={localInstructions}
              onChange={(e) => setLocalInstructions(e.target.value)}
              placeholder="e.g., Always respond in a concise manner. Use code examples when explaining technical concepts..."
              rows={5}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </section>

          {/* Model Parameters */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold dark:text-white mb-4">Model Parameters</h2>
            <div className="space-y-5">
              {/* Temperature */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium dark:text-gray-300">
                    Temperature
                  </label>
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {temperature.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Precise (0)</span>
                  <span>Creative (2)</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div>
                <label className="block text-sm font-medium dark:text-gray-300 mb-1">
                  Max Tokens
                </label>
                <input
                  type="number"
                  min="1"
                  max="128000"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value) || 4096)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Maximum number of tokens in the response (1 - 128,000)
                </p>
              </div>

              {/* Top-P */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium dark:text-gray-300">
                    Top-P (Nucleus Sampling)
                  </label>
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {topP.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={topP}
                  onChange={(e) => setTopP(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Focused (0)</span>
                  <span>Diverse (1)</span>
                </div>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="mb-8">
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : saved ? (
                <Check size={16} />
              ) : (
                <Save size={16} />
              )}
              {isSaving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
            </button>
          </div>

          {/* Model Selection */}
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
                  <option value="groq">Groq (Free)</option>
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
                  {selectedProvider === "groq" && (
                    <>
                      <option value="llama-3.3-70b-versatile">LLaMA 3.3 70B Versatile</option>
                      <option value="llama-3.1-70b-specdec">LLaMA 3.1 70B Versatile</option>
                      <option value="llama-3.2-90b-vision-preview">LLaMA 3.2 90B Vision</option>
                      <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
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

          {/* Appearance */}
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

          {/* API Keys */}
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
                  onChange={(e) => setApiKeys({ openai: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-gray-300 mb-1">Anthropic API Key</label>
                <input
                  type="password"
                  value={apiKeys.anthropic}
                  onChange={(e) => setApiKeys({ anthropic: e.target.value })}
                  placeholder="sk-ant-..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-gray-300 mb-1">Groq API Key</label>
                <input
                  type="password"
                  value={apiKeys.groq}
                  onChange={(e) => setApiKeys({ groq: e.target.value })}
                  placeholder="gsk_..."
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
