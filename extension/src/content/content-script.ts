chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EXTRACT_CONTENT") {
    const content = extractPageContent();
    sendResponse({ content });
  }
  return true;
});

function extractPageContent(): string {
  const title = document.title;
  const url = window.location.href;

  const mainContent =
    document.querySelector("main") ||
    document.querySelector("article") ||
    document.querySelector('[role="main"]') ||
    document.body;

  const textContent = mainContent?.innerText || "";
  const truncated = textContent.slice(0, 5000);

  return `Title: ${title}\nURL: ${url}\n\nContent:\n${truncated}`;
}

function getSelectedText(): string {
  return window.getSelection()?.toString() || "";
}
