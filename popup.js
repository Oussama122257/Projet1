// Popup script: full-featured UI with search, filters, selection, multi-format export

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const btnScrapePage = document.getElementById("btn-scrape-page");
  const btnScrapeAll = document.getElementById("btn-scrape-all");
  const btnClear = document.getElementById("btn-clear");
  const btnExportShopify = document.getElementById("btn-export-shopify");
  const btnExportWoo = document.getElementById("btn-export-woo");
  const btnExportExcel = document.getElementById("btn-export-excel");
  const btnExportAll = document.getElementById("btn-export-all");
  const statusEl = document.getElementById("status");
  const productCountEl = document.getElementById("product-count");
  const selectedCountEl = document.getElementById("selected-count");
  const productTbody = document.getElementById("product-tbody");
  const emptyState = document.getElementById("empty-state");
  const selectAllCb = document.getElementById("select-all");
  const searchInput = document.getElementById("search-input");
  const filterCategory = document.getElementById("filter-category");
  const filterType = document.getElementById("filter-type");
  const siteStatusEl = document.getElementById("site-status");
  const footerInfo = document.getElementById("footer-info");

  let allProducts = [];
  let selectedIndices = new Set();
  let currentFilter = { search: "", category: "", type: "" };

  // Load saved products
  chrome.storage.session.get("products", (data) => {
    if (data.products && data.products.length > 0) {
      allProducts = data.products;
      selectAll();
      updateUI();
    }
  });

  // Detect WooCommerce on active tab
  detectSite();

  // Listen for crawl progress
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "crawl_progress") {
      showStatus(
        `Scraping product ${message.done} of ${message.total}...`,
        "progress",
        true
      );
    }
  });

  // --- Event listeners ---

  btnScrapePage.addEventListener("click", async () => {
    btnScrapePage.disabled = true;
    showStatus("Scraping current page...", "info", true);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await injectContentScript(tab.id);

      const response = await chrome.tabs.sendMessage(tab.id, { action: "scrape_page" });

      if (response.type === "api" && response.products.length > 0) {
        addProducts(response.products);
        showStatus(`Scraped ${response.products.length} products via API`, "success");
      } else if (response.type === "single" && response.products.length > 0) {
        addProducts(response.products);
        showStatus("Scraped 1 product", "success");
      } else if (response.type === "list" && response.products.length > 0) {
        showStatus(`Found ${response.products.length} products, fetching details...`, "info", true);
        await scrapeProductDetails(tab.id, response.products);
      } else {
        showStatus("No WooCommerce products found on this page", "error");
      }
    } catch (err) {
      showStatus("Error: " + err.message, "error");
    }

    btnScrapePage.disabled = false;
  });

  btnScrapeAll.addEventListener("click", async () => {
    btnScrapeAll.disabled = true;
    showStatus("Starting full site scrape...", "info", true);

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
        showStatus(`Scraped ${response.products.length} products from all pages`, "success");
      } else {
        // Fallback: try API
        showStatus("Trying WC Store API...", "info", true);
        try {
          const apiResponse = await chrome.tabs.sendMessage(tab.id, { action: "scrape_via_api" });
          if (apiResponse.products && apiResponse.products.length > 0) {
            addProducts(apiResponse.products);
            showStatus(`Scraped ${apiResponse.products.length} products via API`, "success");
          } else {
            showStatus("No products found", "error");
          }
        } catch (apiErr) {
          showStatus("No products found", "error");
        }
      }
    } catch (err) {
      showStatus("Error: " + err.message, "error");
    }

    btnScrapeAll.disabled = false;
  });

  btnClear.addEventListener("click", () => {
    allProducts = [];
    selectedIndices.clear();
    chrome.storage.session.set({ products: [] });
    updateUI();
    showStatus("All products cleared", "info");
  });

  // Export buttons
  btnExportShopify.addEventListener("click", () => exportCSV("shopify"));
  btnExportWoo.addEventListener("click", () => exportCSV("woocommerce"));
  btnExportExcel.addEventListener("click", () => exportCSV("excel"));
  btnExportAll.addEventListener("click", () => exportCSV("shopify", true));

  // Select all checkbox
  selectAllCb.addEventListener("change", () => {
    const visible = getVisibleProducts();
    if (selectAllCb.checked) {
      visible.forEach((_, i) => selectedIndices.add(getActualIndex(visible, i)));
    } else {
      visible.forEach((_, i) => selectedIndices.delete(getActualIndex(visible, i)));
    }
    updateUI();
  });

  // Search
  searchInput.addEventListener("input", () => {
    currentFilter.search = searchInput.value.toLowerCase().trim();
    updateUI();
  });

  // Filters
  filterCategory.addEventListener("change", () => {
    currentFilter.category = filterCategory.value;
    updateUI();
  });

  filterType.addEventListener("change", () => {
    currentFilter.type = filterType.value;
    updateUI();
  });

  // --- Core functions ---

  async function detectSite() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await injectContentScript(tab.id);
      const response = await chrome.tabs.sendMessage(tab.id, { action: "check_page" });
      if (response.isWooCommerce) {
        siteStatusEl.textContent = "WooCommerce";
        siteStatusEl.classList.add("detected");
      } else {
        siteStatusEl.textContent = "Not WooCommerce";
      }
    } catch (e) {
      siteStatusEl.textContent = "Unknown";
    }
  }

  async function scrapeProductDetails(tabId, listProducts) {
    const detailed = [];

    for (let i = 0; i < listProducts.length; i++) {
      const p = listProducts[i];
      if (!p.url) continue;

      showStatus(
        `Scraping product ${i + 1} of ${listProducts.length}...`,
        "progress",
        true
      );

      try {
        await chrome.tabs.update(tabId, { url: p.url });
        await waitForTabLoad(tabId);
        await injectContentScript(tabId);

        const result = await chrome.tabs.sendMessage(tabId, { action: "scrape_single" });
        if (result.products && result.products.length > 0) {
          detailed.push(result.products[0]);
        }
      } catch (e) {
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
    showStatus(`Scraped ${detailed.length} products`, "success");
  }

  function addProducts(products) {
    products.forEach((p) => {
      const exists = allProducts.some(
        (existing) =>
          (p.url && existing.url === p.url) ||
          (p.title && existing.title === p.title)
      );
      if (!exists) {
        const idx = allProducts.length;
        allProducts.push(p);
        selectedIndices.add(idx);
      }
    });

    chrome.storage.session.set({ products: allProducts });
    rebuildCategoryFilter();
    updateUI();
  }

  function getProductType(product) {
    if (product.variants && product.variants.length > 0) return "variable";
    return "simple";
  }

  function getVisibleProducts() {
    return allProducts.filter((p, i) => {
      if (currentFilter.search) {
        const haystack = (p.title || "").toLowerCase();
        if (!haystack.includes(currentFilter.search)) return false;
      }
      if (currentFilter.category) {
        const cats = (p.categories || []).map((c) => c.toLowerCase());
        if (!cats.includes(currentFilter.category.toLowerCase())) return false;
      }
      if (currentFilter.type) {
        if (getProductType(p) !== currentFilter.type) return false;
      }
      return true;
    });
  }

  function getActualIndex(visibleProducts, visibleIdx) {
    const product = visibleProducts[visibleIdx];
    return allProducts.indexOf(product);
  }

  function getSelectedProducts() {
    return allProducts.filter((_, i) => selectedIndices.has(i));
  }

  function selectAll() {
    allProducts.forEach((_, i) => selectedIndices.add(i));
  }

  function rebuildCategoryFilter() {
    const cats = new Set();
    allProducts.forEach((p) => {
      (p.categories || []).forEach((c) => cats.add(c));
    });

    const current = filterCategory.value;
    filterCategory.innerHTML = '<option value="">All Categories</option>';
    [...cats].sort().forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      filterCategory.appendChild(opt);
    });
    filterCategory.value = current;
  }

  function updateUI() {
    const visible = getVisibleProducts();
    const total = allProducts.length;
    const selected = getSelectedProducts().length;

    productCountEl.textContent = `${total} product${total !== 1 ? "s" : ""}`;
    selectedCountEl.textContent = selected > 0 ? `${selected} selected` : "";

    const hasProducts = total > 0;
    btnClear.disabled = !hasProducts;
    btnExportShopify.disabled = selected === 0;
    btnExportWoo.disabled = selected === 0;
    btnExportExcel.disabled = selected === 0;
    btnExportAll.disabled = selected === 0;

    // Toggle empty state
    emptyState.classList.toggle("hidden", hasProducts);
    document.getElementById("product-table").style.display = hasProducts ? "" : "none";

    // Render table rows
    productTbody.innerHTML = "";
    visible.forEach((p, visibleIdx) => {
      const actualIdx = getActualIndex(visible, visibleIdx);
      const tr = document.createElement("tr");

      const type = getProductType(p);
      const price = p.price || "";
      const cat = (p.categories || [])[0] || "";
      const imgSrc = (p.images || [])[0] || "";
      const isChecked = selectedIndices.has(actualIdx);

      tr.innerHTML = `
        <td class="col-check">
          <input type="checkbox" data-idx="${actualIdx}" ${isChecked ? "checked" : ""}>
        </td>
        <td class="col-img">
          ${imgSrc
            ? `<img class="product-img" src="${escapeAttr(imgSrc)}" alt="" loading="lazy">`
            : `<div class="product-img-placeholder">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>`
          }
        </td>
        <td class="col-name">
          <span class="product-name" title="${escapeAttr(p.title || "")}">
            ${p.url
              ? `<a href="${escapeAttr(p.url)}" target="_blank">${escapeHTML(p.title || "Untitled")}</a>`
              : escapeHTML(p.title || "Untitled")
            }
          </span>
        </td>
        <td class="col-type">
          <span class="product-type-badge type-${type}">${type}</span>
        </td>
        <td class="col-price">${price ? "$" + escapeHTML(price) : ""}</td>
        <td class="col-cat">
          <span class="product-category" title="${escapeAttr(cat)}">${escapeHTML(cat)}</span>
        </td>
      `;

      // Handle checkbox toggle
      const cb = tr.querySelector('input[type="checkbox"]');
      cb.addEventListener("change", () => {
        if (cb.checked) {
          selectedIndices.add(actualIdx);
        } else {
          selectedIndices.delete(actualIdx);
        }
        updateSelectionCount();
      });

      productTbody.appendChild(tr);
    });

    // Update select-all state
    const allVisibleSelected = visible.length > 0 &&
      visible.every((_, i) => selectedIndices.has(getActualIndex(visible, i)));
    selectAllCb.checked = allVisibleSelected;

    footerInfo.textContent = total > 0
      ? `${total} products loaded from ${new URL(allProducts[0].url || "https://unknown").hostname}`
      : "Ready";
  }

  function updateSelectionCount() {
    const selected = getSelectedProducts().length;
    selectedCountEl.textContent = selected > 0 ? `${selected} selected` : "";
    btnExportShopify.disabled = selected === 0;
    btnExportWoo.disabled = selected === 0;
    btnExportExcel.disabled = selected === 0;
    btnExportAll.disabled = selected === 0;
  }

  function exportCSV(format, all = false) {
    const products = all ? allProducts : getSelectedProducts();
    if (products.length === 0) return;

    showStatus(`Exporting ${products.length} products...`, "info", true);

    let csv, filename;
    const timestamp = new Date().toISOString().slice(0, 10);

    switch (format) {
      case "shopify":
        csv = ShopifyCSV.toCSV(products);
        filename = `shopify_import_${timestamp}.csv`;
        break;
      case "woocommerce":
        csv = WooCommerceCSV.toCSV(products);
        filename = `woocommerce_import_${timestamp}.csv`;
        break;
      case "excel":
        csv = generateExcelCSV(products);
        filename = `products_${timestamp}.csv`;
        break;
      default:
        csv = ShopifyCSV.toCSV(products);
        filename = `shopify_import_${timestamp}.csv`;
    }

    chrome.runtime.sendMessage({
      action: "download_csv",
      csv,
      filename,
    });

    showStatus(`Exported ${products.length} products as ${filename}`, "success");
  }

  function generateExcelCSV(products) {
    const headers = [
      "Title", "SKU", "Type", "Price", "Sale Price", "Regular Price",
      "Categories", "Tags", "Description", "Short Description",
      "Images", "In Stock", "Stock Qty", "Weight", "URL", "Vendor"
    ];

    const escCSV = (v) => {
      if (v == null) return "";
      const str = String(v);
      if (str.includes('"') || str.includes(",") || str.includes("\n")) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    const lines = [headers.map(escCSV).join(",")];

    products.forEach((p) => {
      const type = getProductType(p);
      const line = [
        p.title || "",
        p.sku || "",
        type,
        p.price || "",
        p.compare_at_price ? (p.price || "") : "",
        p.compare_at_price || p.price || "",
        (p.categories || []).join("; "),
        (p.tags || []).join("; "),
        (p.body_html || "").replace(/<[^>]*>/g, "").substring(0, 500),
        (p.short_description || "").replace(/<[^>]*>/g, "").substring(0, 300),
        (p.images || []).join("; "),
        p.in_stock !== false ? "Yes" : "No",
        p.inventory_qty || "",
        p.weight || "",
        p.url || "",
        p.vendor || "",
      ].map(escCSV).join(",");
      lines.push(line);
    });

    return lines.join("\n");
  }

  // --- Utilities ---

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

  function showStatus(text, type, showSpinner = false) {
    statusEl.innerHTML = showSpinner
      ? `<span class="spinner"></span>${escapeHTML(text)}`
      : escapeHTML(text);
    statusEl.className = `status ${type}`;
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return (str || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
});
