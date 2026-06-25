chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.contextMenus.create({
  id: "mallika-ai-ask",
  title: "Ask MallikaAI about this",
  contexts: ["selection"],
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "mallika-ai-ask" && info.selectionText) {
    chrome.sidePanel.open({ tabId: tab?.id });
    setTimeout(() => {
      chrome.runtime.sendMessage({
        type: "ASK_ABOUT_SELECTION",
        text: info.selectionText,
      });
    }, 500);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_PAGE_CONTENT") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "EXTRACT_CONTENT" }, (response) => {
          sendResponse(response);
        });
      }
    });
    return true;
  }

  if (message.type === "CHAT_MESSAGE") {
    handleChatMessage(message.content, message.model, message.provider)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }
});

async function handleChatMessage(content: string, model: string, provider: string) {
  const settings = await chrome.storage.local.get(["apiUrl"]);
  const apiUrl = settings.apiUrl || "http://localhost:8000";

  const formData = new FormData();
  formData.append("message", content);
  formData.append("model", model);
  formData.append("provider", provider);

  const response = await fetch(`${apiUrl}/api/chat/quick`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("Chat request failed");

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

  return { text: fullText };
}
