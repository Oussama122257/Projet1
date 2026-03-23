// Content script: scrapes WooCommerce product data from the current page

(() => {
  "use strict";

  /**
   * Scrape a single product from a WooCommerce single-product page.
   */
  function scrapeSingleProduct() {
    const product = {};

    // Title
    product.title =
      document.querySelector(".product_title")?.textContent?.trim() ||
      document.querySelector("h1.entry-title")?.textContent?.trim() ||
      document.querySelector("h1")?.textContent?.trim() ||
      "";

    // Description (full)
    const descTab = document.querySelector("#tab-description");
    const descDiv =
      descTab ||
      document.querySelector(".woocommerce-product-details__short-description")?.parentElement;
    product.body_html =
      descTab?.innerHTML?.trim() ||
      document.querySelector(".woocommerce-product-details__short-description")?.innerHTML?.trim() ||
      "";

    // Short description
    product.short_description =
      document.querySelector(".woocommerce-product-details__short-description")?.innerHTML?.trim() ||
      "";

    // Price
    const priceEl =
      document.querySelector(".summary .woocommerce-Price-amount") ||
      document.querySelector("p.price .woocommerce-Price-amount") ||
      document.querySelector(".woocommerce-Price-amount");
    product.price = priceEl?.textContent?.replace(/[^\d.,]/g, "")?.trim() || "";

    // Sale price
    const insEl = document.querySelector("p.price ins .woocommerce-Price-amount");
    const delEl = document.querySelector("p.price del .woocommerce-Price-amount");
    if (insEl && delEl) {
      product.compare_at_price = delEl.textContent.replace(/[^\d.,]/g, "").trim();
      product.price = insEl.textContent.replace(/[^\d.,]/g, "").trim();
    }

    // Images
    product.images = [];
    document
      .querySelectorAll(
        ".woocommerce-product-gallery__image a, " +
        ".woocommerce-product-gallery img, " +
        ".wp-post-image"
      )
      .forEach((el) => {
        const src = el.href || el.dataset.largeSrc || el.dataset.src || el.src;
        if (src && !product.images.includes(src)) {
          product.images.push(src);
        }
      });

    // SKU
    product.sku =
      document.querySelector(".sku")?.textContent?.trim() || "";

    // Categories
    product.categories = [];
    document.querySelectorAll(".posted_in a, .product_meta .posted_in a").forEach((a) => {
      product.categories.push(a.textContent.trim());
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
          const variant = {
            sku: v.sku || "",
            price: v.display_price?.toString() || "",
            compare_at_price: v.display_regular_price?.toString() || "",
            weight: v.weight || "",
            image: v.image?.full_src || "",
            attributes: v.attributes || {},
          };
          product.variants.push(variant);
        });
      } catch (e) {
        // Variation data not parseable
      }
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

    // Vendor (site name)
    product.vendor =
      document.querySelector('meta[property="og:site_name"]')?.content ||
      document.querySelector(".site-title")?.textContent?.trim() ||
      window.location.hostname;

    return product;
  }

  /**
   * Scrape product listing cards from a shop/category/archive page.
   * Returns basic info + links to individual product pages.
   */
  function scrapeProductList() {
    const products = [];
    const cards = document.querySelectorAll(
      "ul.products li.product, .products .product, .wc-block-grid__product"
    );

    cards.forEach((card) => {
      const link =
        card.querySelector("a.woocommerce-LoopProduct-link") ||
        card.querySelector("a[href]");
      const titleEl =
        card.querySelector(".woocommerce-loop-product__title") ||
        card.querySelector("h2") ||
        card.querySelector("h3");
      const priceEl = card.querySelector(".woocommerce-Price-amount");
      const imgEl = card.querySelector("img");

      products.push({
        title: titleEl?.textContent?.trim() || "",
        url: link?.href || "",
        price: priceEl?.textContent?.replace(/[^\d.,]/g, "")?.trim() || "",
        image: imgEl?.dataset?.src || imgEl?.src || "",
      });
    });

    return products;
  }

  /**
   * Detect next page link for pagination crawling.
   */
  function getNextPageUrl() {
    const nextLink = document.querySelector("a.next.page-numbers, .woocommerce-pagination a.next");
    return nextLink?.href || null;
  }

  /**
   * Detect if current page is a single product page.
   */
  function isSingleProductPage() {
    return (
      document.body.classList.contains("single-product") ||
      !!document.querySelector(".product_title") ||
      !!document.querySelector("form.cart")
    );
  }

  // Listen for messages from the popup / background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "scrape_page") {
      if (isSingleProductPage()) {
        const product = scrapeSingleProduct();
        sendResponse({ type: "single", products: [product] });
      } else {
        const products = scrapeProductList();
        const nextPage = getNextPageUrl();
        sendResponse({ type: "list", products, nextPage });
      }
    }

    if (message.action === "scrape_single") {
      const product = scrapeSingleProduct();
      sendResponse({ type: "single", products: [product] });
    }

    if (message.action === "check_page") {
      sendResponse({
        isSingle: isSingleProductPage(),
        hasProducts: document.querySelectorAll("ul.products li.product, .products .product").length > 0,
        nextPage: getNextPageUrl(),
        url: window.location.href,
      });
    }

    return true; // keep channel open for async response
  });
})();
