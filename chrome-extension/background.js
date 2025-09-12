// background.js
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && tab.url.includes('arxiv.org/abs/')) {
    chrome.storage.local.get({arxivTabs: []}, (result) => {
      let arxivTabs = result.arxivTabs;
      if (!arxivTabs.some(t => t.id === tabId)) {
        arxivTabs.push({id: tabId, url: tab.url, title: tab.title || tab.url});
        chrome.storage.local.set({arxivTabs});
      }
    });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.get({arxivTabs: []}, (result) => {
    let arxivTabs = result.arxivTabs.filter(t => t.id !== tabId);
    chrome.storage.local.set({arxivTabs});
  });
});
