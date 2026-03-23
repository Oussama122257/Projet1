// Background service worker: handles multi-page crawling and CSV download

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "crawl_all_pages") {
    crawlAllPages(message.tabId, message.startUrl)
      .then((products) => sendResponse({ products }))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (message.action === "download_csv") {
    downloadCSV(message.csv, message.filename);
    sendResponse({ ok: true });
  }
});

/**
 * Crawl product listing pages, following pagination,
 * then visit each product page to scrape full details.
 */
async function crawlAllPages(tabId, startUrl) {
  const allProductUrls = [];
  let currentUrl = startUrl;
  let pageCount = 0;
  const maxPages = 50;

  // Phase 1: Collect product URLs from listing pages
  while (currentUrl && pageCount < maxPages) {
    pageCount++;

    await navigateTab(tabId, currentUrl);
    await waitForLoad(tabId);

    const result = await sendMessageToTab(tabId, { action: "scrape_page" });

    if (result.type === "single") {
      // Already on a single product page — just return it
      return result.products;
    }

    if (result.type === "api") {
      // Products came fully formed from the WC Store API
      return result.products;
    }

    result.products.forEach((p) => {
      if (p.url && !allProductUrls.includes(p.url)) {
        allProductUrls.push(p.url);
      }
    });

    currentUrl = result.nextPage || null;
  }

  // Phase 2: Visit each product page for full details
  const fullProducts = [];
  for (const url of allProductUrls) {
    try {
      await navigateTab(tabId, url);
      await waitForLoad(tabId);
      const detail = await sendMessageToTab(tabId, { action: "scrape_single" });
      if (detail.products && detail.products.length > 0) {
        fullProducts.push(detail.products[0]);
      }
    } catch (e) {
      // Skip products that fail
    }

    // Notify popup of progress
    chrome.runtime.sendMessage({
      action: "crawl_progress",
      done: fullProducts.length,
      total: allProductUrls.length,
    }).catch(() => {});
  }

  return fullProducts;
}

function navigateTab(tabId, url) {
  return chrome.tabs.update(tabId, { url });
}

function waitForLoad(tabId) {
  return new Promise((resolve) => {
    const listener = (id, info) => {
      if (id === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        // Extra delay for JS-rendered content
        setTimeout(resolve, 1500);
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}

function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  chrome.downloads.download({
    url,
    filename: filename || "shopify_products.csv",
    saveAs: true,
  });
}
