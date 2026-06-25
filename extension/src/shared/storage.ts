export interface StorageData {
  apiUrl: string;
  model: string;
  provider: string;
  history: ChatHistoryItem[];
}

export interface ChatHistoryItem {
  id: string;
  question: string;
  answer: string;
  timestamp: number;
}

export async function getSettings(): Promise<Partial<StorageData>> {
  return chrome.storage.local.get(["apiUrl", "model", "provider"]);
}

export async function saveSettings(settings: Partial<StorageData>): Promise<void> {
  await chrome.storage.local.set(settings);
}

export async function getHistory(): Promise<ChatHistoryItem[]> {
  const result = await chrome.storage.local.get(["history"]);
  return result.history || [];
}

export async function addToHistory(item: ChatHistoryItem): Promise<void> {
  const history = await getHistory();
  history.unshift(item);
  const trimmed = history.slice(0, 100);
  await chrome.storage.local.set({ history: trimmed });
}

export async function clearHistory(): Promise<void> {
  await chrome.storage.local.set({ history: [] });
}
