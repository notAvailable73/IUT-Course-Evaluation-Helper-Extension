chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (!request || request.type !== "IUT_EVALUATION_COMMAND") {
    return false;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];
    if (!tab || !tab.id) {
      sendResponse({ ok: false, error: "No active tab found." });
      return;
    }

    chrome.tabs.sendMessage(tab.id, request, function (response) {
      if (chrome.runtime.lastError) {
        sendResponse({
          ok: false,
          error: "Open an IUT SIS evaluation page or reload the current SIS tab."
        });
        return;
      }

      sendResponse(response || { ok: false, error: "No response from the page." });
    });
  });

  return true;
});
