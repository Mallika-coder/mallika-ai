const DEFAULT_API_URL = "http://localhost:8000";

export async function getApiUrl(): Promise<string> {
  const result = await chrome.storage.local.get(["apiUrl"]);
  return result.apiUrl || DEFAULT_API_URL;
}

export async function sendChatMessage(
  content: string,
  model: string = "gpt-4o",
  provider: string = "openai"
): Promise<string> {
  const apiUrl = await getApiUrl();

  const formData = new FormData();
  formData.append("message", content);
  formData.append("model", model);
  formData.append("provider", provider);

  const response = await fetch(`${apiUrl}/api/chat/quick`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "stream") {
              fullText += data.content;
            }
          } catch {}
        }
      }
    }
  }

  return fullText;
}
