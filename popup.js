// Popup script: connects UI to content script and CSV export

document.addEventListener("DOMContentLoaded", () => {
  const btnScrapePage = document.getElementById("btn-scrape-page");
  const btnScrapeAll = document.getElementById("btn-scrape-all");
  const btnExport = document.getElementById("btn-export");
  const btnClear = document.getElementById("btn-clear");
  const statusEl = document.getElementById("status");
  const productCountEl = document.getElementById("product-count");
  const productListEl = document.getElementById("product-list");

  let scrapedProducts = [];

  // Load previously scraped products from session storage
  chrome.storage.session.get("products", (data) => {
    if (data.products && data.products.length > 0) {
      scrapedProducts = data.products;
      updateUI();
    }
  });

  // Listen for crawl progress
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "crawl_progress") {
      showStatus(`Scraping product ${message.done} of ${message.total}...`, "info");
    }
  });

  btnScrapePage.addEventListener("click", async () => {
    btnScrapePage.disabled = true;
    showStatus("Scraping current page...", "info");

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Inject content script if not already present
      await injectContentScript(tab.id);

      const response = await chrome.tabs.sendMessage(tab.id, { action: "scrape_page" });

      if (response.type === "single" && response.products.length > 0) {
        addProducts(response.products);
        showStatus(`Scraped 1 product successfully!`, "success");
      } else if (response.type === "list" && response.products.length > 0) {
        // For listing pages, visit each product for full details
        showStatus(`Found ${response.products.length} products, fetching details...`, "info");
        await scrapeProductDetails(tab.id, response.products);
      } else {
        showStatus("No WooCommerce products found on this page.", "error");
      }
    } catch (err) {
      showStatus("Error: " + err.message, "error");
    }

    btnScrapePage.disabled = false;
  });

  btnScrapeAll.addEventListener("click", async () => {
    btnScrapeAll.disabled = true;
    showStatus("Starting full site scrape...", "info");

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      await injectContentScript(tab.id);

      const response = await chrome.runtime.sendMessage({
        action: "crawl_all_pages",
        tabId: tab.id,
        startUrl: tab.url,
      });

      if (response.error) {
        showStatus("Error: " + response.error, "error");
      } else if (response.products && response.products.length > 0) {
        addProducts(response.products);
        showStatus(`Scraped ${response.products.length} products from all pages!`, "success");
      } else {
        showStatus("No products found.", "error");
      }
    } catch (err) {
      showStatus("Error: " + err.message, "error");
    }

    btnScrapeAll.disabled = false;
  });

  btnExport.addEventListener("click", () => {
    if (scrapedProducts.length === 0) return;

    showStatus("Generating Shopify CSV...", "info");

    const csv = ShopifyCSV.toCSV(scrapedProducts);
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `shopify_import_${timestamp}.csv`;

    // Download via background
    chrome.runtime.sendMessage({
      action: "download_csv",
      csv,
      filename,
    });

    showStatus(`CSV exported: ${filename}`, "success");
  });

  btnClear.addEventListener("click", () => {
    scrapedProducts = [];
    chrome.storage.session.set({ products: [] });
    updateUI();
    showStatus("All products cleared.", "info");
  });

  /**
   * Visit each product URL from a listing page to get full details.
   */
  async function scrapeProductDetails(tabId, listProducts) {
    const detailed = [];

    for (let i = 0; i < listProducts.length; i++) {
      const p = listProducts[i];
      if (!p.url) continue;

      showStatus(`Scraping product ${i + 1} of ${listProducts.length}...`, "info");

      try {
        await chrome.tabs.update(tabId, { url: p.url });
        await waitForTabLoad(tabId);
        await injectContentScript(tabId);

        const result = await chrome.tabs.sendMessage(tabId, { action: "scrape_single" });
        if (result.products && result.products.length > 0) {
          detailed.push(result.products[0]);
        }
      } catch (e) {
        // Use basic info from listing if detail scrape fails
        detailed.push({
          title: p.title,
          price: p.price,
          images: p.image ? [p.image] : [],
          url: p.url,
          body_html: "",
          vendor: "",
          sku: "",
          categories: [],
          tags: [],
          variants: [],
        });
      }
    }

    addProducts(detailed);
    showStatus(`Scraped ${detailed.length} products!`, "success");
  }

  function waitForTabLoad(tabId) {
    return new Promise((resolve) => {
      const listener = (id, info) => {
        if (id === tabId && info.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          setTimeout(resolve, 1500);
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    });
  }

  async function injectContentScript(tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"],
      });
    } catch (e) {
      // Content script may already be injected
    }
  }

  function addProducts(products) {
    // Deduplicate by URL or title
    products.forEach((p) => {
      const exists = scrapedProducts.some(
        (existing) =>
          (p.url && existing.url === p.url) ||
          (p.title && existing.title === p.title)
      );
      if (!exists) {
        scrapedProducts.push(p);
      }
    });

    chrome.storage.session.set({ products: scrapedProducts });
    updateUI();
  }

  function updateUI() {
    const count = scrapedProducts.length;
    productCountEl.textContent = `${count} product${count !== 1 ? "s" : ""} scraped`;

    btnExport.disabled = count === 0;
    btnClear.disabled = count === 0;

    productListEl.innerHTML = "";
    scrapedProducts.forEach((p) => {
      const div = document.createElement("div");
      div.className = "product-item";
      div.innerHTML = `
        <span class="product-title" title="${escapeHTML(p.title || "")}">${escapeHTML(p.title || "Untitled")}</span>
        <span class="product-price">${escapeHTML(p.price ? "$" + p.price : "")}</span>
      `;
      productListEl.appendChild(div);
    });
  }

  function showStatus(text, type) {
    statusEl.textContent = text;
    statusEl.className = `status ${type}`;
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
});
