function findPrivacyPolicyLink() {
  const links = document.querySelectorAll("a");
  let primaryMatch = null; // For "Privacy" AND "Policy"
  let secondaryMatch = null; // For "Privacy" OR "Policy"

  for (let link of links) {
    const href = (link.getAttribute("href") || "").toLowerCase();
    const text = (link.textContent || "").toLowerCase();

    //check for "Privacy" AND "Policy" in either href or text
    if (
      (href.includes("privacy") && href.includes("policy")) ||
      (text.includes("privacy") && text.includes("policy"))
    ) {
      primaryMatch = link.href;
      break; //prioritize primary match
    }

    //check for "Privacy" OR "Policy" if no primary match
    if (
      href.includes("privacy") ||
      href.includes("policy") ||
      text.includes("privacy") ||
      text.includes("policy")
    ) {
      if (!secondaryMatch) {
        secondaryMatch = link.href;
      }
    }
  }

  if (primaryMatch) {
    console.log(primaryMatch);
    chrome.runtime.sendMessage({
      action: "privacyPolicyFound",
      link: primaryMatch,
    });
    chrome.runtime.sendMessage({ action: "fetchHTML", link: primaryMatch });
    return;
  }

  if (secondaryMatch) {
    console.log(secondaryMatch);
    chrome.runtime.sendMessage({
      action: "privacyPolicyFound",
      link: secondaryMatch,
    });
    chrome.runtime.sendMessage({ action: "fetchHTML", link: secondaryMatch });
    return;
  }

  chrome.runtime.sendMessage({ action: "privacyPolicyNotFound" });
  return;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "findPrivacyPolicy") {
    findPrivacyPolicyLink();
  }
});
