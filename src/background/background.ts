chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchHTML") {
    fetch(message.link)
      .then((response) => response.text())
      .then((html) => {
        sendResponse({ success: true, data: html });
        chrome.runtime.sendMessage({
          action: "privacyPolicyHTMLFound",
          html: html,
        });
      })
      .catch((error) => {
        console.error(
          "Error fetching privacy policy: " + message.link + " ",
          error
        );
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});
