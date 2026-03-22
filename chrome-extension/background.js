chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'predict') return;
  fetch(message.url, { method: 'POST' })
    .then(res => res.ok ? res.json() : null)
    .then(data => sendResponse({ data }))
    .catch(() => sendResponse({ data: null }));
  return true; // keep channel open for async sendResponse
});
