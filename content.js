// Content script: scrapes WooCommerce product data from the current page
// Supports both DOM-based scraping and WC Store API fallback

(() => {
  "use strict";

  /**
   * Detect the site's base URL for API calls.
   */
  function getSiteBaseUrl() {
    // Try to find the WC REST API URL from inline scripts
    const scripts = document.querySelectorAll("script");
    for (const s of scripts) {
      const text = s.textContent || "";
      // Match patterns like "restApiUrl":"https://..." or wc_cart_params
      const match = text.match(/"restApiUrl"\s*:\s*"([^"]+?)\/wp-json/);
      if (match) return match[1];
    }
    // Check for wp-json link in head
    const apiLink = document.querySelector('link[rel="https://api.w.org/"]');
    if (apiLink) {
      const href = apiLink.getAttribute("href");
      const idx = href.indexOf("/wp-json");
      if (idx !== -1) return href.substring(0, idx);
    }
    return window.location.origin;
  }

  /**
   * Fetch products from WooCommerce Store API (public, no auth needed).
   */
  async function fetchFromStoreAPI() {
    const base = getSiteBaseUrl();
    const allProducts = [];
    let page = 1;
    const perPage = 100;
    const maxPages = 20;

    while (page <= maxPages) {
      const url = `${base}/wp-json/wc/store/v1/products?per_page=${perPage}&page=${page}`;
      try {
        const res = await fetch(url);
        if (!res.ok) break;
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) break;

        for (const item of data) {
          allProducts.push(mapStoreAPIProduct(item, base));
        }

        // Check if there are more pages
        const totalPages = parseInt(res.headers.get("X-WP-TotalPages") || "1", 10);
        if (page >= totalPages) break;
        page++;
      } catch (e) {
        break;
      }
    }

    return allProducts;
  }

  /**
   * Map a WC Store API product object to our internal format.
   */
  function mapStoreAPIProduct(item, baseUrl) {
    const currencyMinorUnit = item.prices?.currency_minor_unit || 2;
    const divisor = Math.pow(10, currencyMinorUnit);

    const parsePrice = (val) => {
      if (!val) return "";
      const num = parseInt(val, 10);
      return isNaN(num) ? "" : (num / divisor).toFixed(2);
    };

    const price = parsePrice(item.prices?.price);
    const regularPrice = parsePrice(item.prices?.regular_price);
    const salePrice = parsePrice(item.prices?.sale_price);

    const product = {
      title: item.name || "",
      body_html: item.description || "",
      short_description: item.short_description || "",
      price: price,
      compare_at_price: item.on_sale ? regularPrice : "",
      images: (item.images || []).map((img) => img.src).filter(Boolean),
      sku: item.sku || "",
      categories: (item.categories || []).map((c) => c.name),
      tags: (item.tags || []).map((t) => t.name),
      weight: "",
      dimensions: "",
      variants: [],
      in_stock: item.is_in_stock !== false,
      inventory_qty: 0,
      inventory_policy: "deny",
      url: item.permalink || "",
      vendor: baseUrl ? new URL(baseUrl).hostname : window.location.hostname,
    };

    return product;
  }

  /**
   * Try fetching a single product from the Store API by slug.
   */
  async function fetchSingleFromAPI(slug) {
    const base = getSiteBaseUrl();
    try {
      const res = await fetch(`${base}/wp-json/wc/store/v1/products?slug=${slug}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return mapStoreAPIProduct(data[0], base);
      }
    } catch (e) {}
    return null;
  }

  /**
   * Scrape a single product from a WooCommerce single-product page (DOM).
   */
  function scrapeSingleProduct() {
    const product = {};

    // Title — broadened selectors for various themes
    product.title =
      document.querySelector(".product_title")?.textContent?.trim() ||
      document.querySelector("h1.entry-title")?.textContent?.trim() ||
      document.querySelector(".entry-summary h1")?.textContent?.trim() ||
      document.querySelector(".summary h1")?.textContent?.trim() ||
      document.querySelector("h1.wp-block-post-title")?.textContent?.trim() ||
      document.querySelector("[itemprop='name']")?.textContent?.trim() ||
      document.querySelector("h1")?.textContent?.trim() ||
      "";

    // Description (full)
    const descTab = document.querySelector("#tab-description");
    product.body_html =
      descTab?.innerHTML?.trim() ||
      document.querySelector(".woocommerce-Tabs-panel--description")?.innerHTML?.trim() ||
      document.querySelector("[itemprop='description']")?.innerHTML?.trim() ||
      document.querySelector(".woocommerce-product-details__short-description")?.innerHTML?.trim() ||
      document.querySelector(".product-description")?.innerHTML?.trim() ||
      "";

    // Short description
    product.short_description =
      document.querySelector(".woocommerce-product-details__short-description")?.innerHTML?.trim() ||
      document.querySelector(".product-short-description")?.innerHTML?.trim() ||
      "";

    // Price — broadened selectors
    const priceEl =
      document.querySelector(".summary .woocommerce-Price-amount") ||
      document.querySelector(".entry-summary .woocommerce-Price-amount") ||
      document.querySelector("p.price .woocommerce-Price-amount") ||
      document.querySelector(".price .woocommerce-Price-amount") ||
      document.querySelector("[itemprop='price']") ||
      document.querySelector(".woocommerce-Price-amount");
    product.price = priceEl?.textContent?.replace(/[^\d.,]/g, "")?.trim() ||
      priceEl?.getAttribute("content") || "";

    // Sale price
    const insEl =
      document.querySelector("p.price ins .woocommerce-Price-amount") ||
      document.querySelector(".price ins .woocommerce-Price-amount");
    const delEl =
      document.querySelector("p.price del .woocommerce-Price-amount") ||
      document.querySelector(".price del .woocommerce-Price-amount");
    if (insEl && delEl) {
      product.compare_at_price = delEl.textContent.replace(/[^\d.,]/g, "").trim();
      product.price = insEl.textContent.replace(/[^\d.,]/g, "").trim();
    }

    // Images — broadened selectors
    product.images = [];
    const imgSelectors = [
      ".woocommerce-product-gallery__image a",
      ".woocommerce-product-gallery__image img",
      ".woocommerce-product-gallery img",
      ".wp-post-image",
      ".product .gallery img",
      ".product-images img",
      "[data-thumb]",
      ".flex-control-thumbs img",
    ];
    document.querySelectorAll(imgSelectors.join(", ")).forEach((el) => {
      const src =
        el.href ||
        el.dataset.largeSrc ||
        el.dataset.large_image ||
        el.dataset.src ||
        el.dataset.thumb ||
        el.getAttribute("data-large_image") ||
        el.src;
      if (src && !src.includes("placeholder") && !product.images.includes(src)) {
        product.images.push(src);
      }
    });

    // SKU
    product.sku =
      document.querySelector(".sku")?.textContent?.trim() ||
      document.querySelector("[itemprop='sku']")?.textContent?.trim() ||
      "";

    // Categories
    product.categories = [];
    document.querySelectorAll(".posted_in a, .product_meta .posted_in a, [rel='tag']").forEach((a) => {
      const cat = a.textContent.trim();
      if (cat && !product.categories.includes(cat)) {
        product.categories.push(cat);
      }
    });

    // Tags
    product.tags = [];
    document.querySelectorAll(".tagged_as a, .product_meta .tagged_as a").forEach((a) => {
      product.tags.push(a.textContent.trim());
    });

    // Weight & dimensions
    const rowData = {};
    document.querySelectorAll(".woocommerce-product-attributes tr, .shop_attributes tr").forEach((tr) => {
      const label = tr.querySelector("th")?.textContent?.trim().toLowerCase() || "";
      const value = tr.querySelector("td")?.textContent?.trim() || "";
      rowData[label] = value;
    });
    product.weight = rowData["weight"] || "";
    product.dimensions = rowData["dimensions"] || "";

    // Variants (variable products)
    product.variants = [];
    const variationData = document.querySelector("form.variations_form");
    if (variationData) {
      try {
        const variations = JSON.parse(variationData.dataset.product_variations || "[]");
        variations.forEach((v) => {
          product.variants.push({
            sku: v.sku || "",
            price: v.display_price?.toString() || "",
            compare_at_price: v.display_regular_price?.toString() || "",
            weight: v.weight || "",
            image: v.image?.full_src || "",
            attributes: v.attributes || {},
          });
        });
      } catch (e) {}
    }

    // Stock
    const stockEl = document.querySelector(".stock");
    product.inventory_policy = "deny";
    if (stockEl) {
      product.in_stock = stockEl.classList.contains("in-stock");
      const qty = stockEl.textContent.match(/(\d+)/);
      product.inventory_qty = qty ? parseInt(qty[1], 10) : (product.in_stock ? 1 : 0);
    } else {
      product.in_stock = true;
      product.inventory_qty = 0;
    }

    // URL
    product.url = window.location.href;

    // Vendor
    product.vendor =
      document.querySelector('meta[property="og:site_name"]')?.content ||
      document.querySelector(".site-title a")?.textContent?.trim() ||
      document.querySelector(".site-title")?.textContent?.trim() ||
      window.location.hostname;

    return product;
  }

  /**
   * Scrape product listing cards from a shop/category/archive page (DOM).
   */
  function scrapeProductList() {
    const products = [];
    const cards = document.querySelectorAll(
      "ul.products li.product, .products .product, .wc-block-grid__product, " +
      ".product-grid .product, .shop-products .product"
    );

    cards.forEach((card) => {
      const link =
        card.querySelector("a.woocommerce-LoopProduct-link") ||
        card.querySelector("a.woocommerce-loop-product__link") ||
        card.querySelector("h2 a") ||
        card.querySelector("h3 a") ||
        card.querySelector("a[href]");
      const titleEl =
        card.querySelector(".woocommerce-loop-product__title") ||
        card.querySelector("h2") ||
        card.querySelector("h3") ||
        card.querySelector(".product-title");
      const priceEl = card.querySelector(".woocommerce-Price-amount");
      const imgEl = card.querySelector("img");

      const url = link?.href || "";
      const title = titleEl?.textContent?.trim() || "";

      if (url || title) {
        products.push({
          title,
          url,
          price: priceEl?.textContent?.replace(/[^\d.,]/g, "")?.trim() || "",
          image: imgEl?.dataset?.src || imgEl?.src || "",
        });
      }
    });

    return products;
  }

  /**
   * Detect next page link for pagination crawling.
   */
  function getNextPageUrl() {
    const nextLink = document.querySelector(
      "a.next.page-numbers, .woocommerce-pagination a.next, .nav-links a.next"
    );
    return nextLink?.href || null;
  }

  /**
   * Detect if current page is a single product page.
   */
  function isSingleProductPage() {
    return (
      document.body.classList.contains("single-product") ||
      !!document.querySelector(".product_title") ||
      !!document.querySelector("form.cart") ||
      !!document.querySelector(".single-product-content") ||
      !!document.querySelector("[itemprop='product']")
    );
  }

  /**
   * Detect if this is a WooCommerce site.
   */
  function isWooCommerceSite() {
    // Check body classes
    const bodyClasses = document.body.className || "";
    if (/woocommerce|woodmart|flavor/.test(bodyClasses)) return true;
    // Check for WC scripts/styles
    if (document.querySelector('script[src*="woocommerce"], link[href*="woocommerce"]')) return true;
    // Check for wp-json API link
    if (document.querySelector('link[rel="https://api.w.org/"]')) return true;
    // Check inline scripts for WC config
    for (const s of document.querySelectorAll("script")) {
      if ((s.textContent || "").includes("wc_cart_params") ||
          (s.textContent || "").includes("woocommerce") ||
          (s.textContent || "").includes("wc-ajax")) {
        return true;
      }
    }
    return false;
  }

  /**
   * Extract product slug from current URL.
   */
  function getProductSlugFromUrl() {
    const path = window.location.pathname.replace(/\/$/, "");
    const parts = path.split("/");
    return parts[parts.length - 1] || "";
  }

  // Listen for messages from the popup / background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "scrape_page") {
      handleScrapePage().then(sendResponse);
      return true;
    }

    if (message.action === "scrape_single") {
      handleScrapeSingle().then(sendResponse);
      return true;
    }

    if (message.action === "scrape_via_api") {
      fetchFromStoreAPI().then((products) => {
        sendResponse({ type: "api", products });
      }).catch(() => {
        sendResponse({ type: "api", products: [] });
      });
      return true;
    }

    if (message.action === "check_page") {
      sendResponse({
        isSingle: isSingleProductPage(),
        hasProducts: document.querySelectorAll(
          "ul.products li.product, .products .product"
        ).length > 0,
        nextPage: getNextPageUrl(),
        url: window.location.href,
        isWooCommerce: isWooCommerceSite(),
      });
      return true;
    }

    return true;
  });

  /**
   * Handle scrape_page: try DOM first, fall back to API.
   */
  async function handleScrapePage() {
    if (isSingleProductPage()) {
      const product = scrapeSingleProduct();
      // If DOM scraping got a title, use it
      if (product.title) {
        return { type: "single", products: [product] };
      }
      // Fallback: try API for single product
      const slug = getProductSlugFromUrl();
      if (slug) {
        const apiProduct = await fetchSingleFromAPI(slug);
        if (apiProduct) {
          return { type: "single", products: [apiProduct] };
        }
      }
    }

    // Try DOM scraping for listing
    const products = scrapeProductList();
    const nextPage = getNextPageUrl();
    if (products.length > 0) {
      return { type: "list", products, nextPage };
    }

    // Fallback: try Store API for all products
    if (isWooCommerceSite()) {
      const apiProducts = await fetchFromStoreAPI();
      if (apiProducts.length > 0) {
        return { type: "api", products: apiProducts };
      }
    }

    return { type: "list", products: [], nextPage: null };
  }

  /**
   * Handle scrape_single: try DOM first, fall back to API.
   */
  async function handleScrapeSingle() {
    const product = scrapeSingleProduct();
    if (product.title) {
      return { type: "single", products: [product] };
    }

    // Fallback: try API
    const slug = getProductSlugFromUrl();
    if (slug) {
      const apiProduct = await fetchSingleFromAPI(slug);
      if (apiProduct) {
        return { type: "single", products: [apiProduct] };
      }
    }

    return { type: "single", products: [product] };
  }
})();
