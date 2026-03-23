// Shopify CSV generation utility
// Reference: https://help.shopify.com/en/manual/products/import-export/using-csv

const ShopifyCSV = (() => {
  "use strict";

  // All Shopify product CSV columns
  const HEADERS = [
    "Handle",
    "Title",
    "Body (HTML)",
    "Vendor",
    "Product Category",
    "Type",
    "Tags",
    "Published",
    "Option1 Name",
    "Option1 Value",
    "Option2 Name",
    "Option2 Value",
    "Option3 Name",
    "Option3 Value",
    "Variant SKU",
    "Variant Grams",
    "Variant Inventory Tracker",
    "Variant Inventory Qty",
    "Variant Inventory Policy",
    "Variant Fulfillment Service",
    "Variant Price",
    "Variant Compare At Price",
    "Variant Requires Shipping",
    "Variant Taxable",
    "Variant Barcode",
    "Image Src",
    "Image Position",
    "Image Alt Text",
    "Gift Card",
    "SEO Title",
    "SEO Description",
    "Variant Image",
    "Variant Weight Unit",
    "Variant Tax Code",
    "Cost per item",
    "Included / United States",
    "Price / United States",
    "Compare At Price / United States",
    "Included / International",
    "Price / International",
    "Compare At Price / International",
    "Status",
  ];

  /**
   * Convert a product title to a Shopify handle (URL slug).
   */
  function toHandle(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Escape a CSV field value.
   */
  function escapeCSV(value) {
    if (value == null) return "";
    const str = String(value);
    if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  /**
   * Parse weight string, return grams.
   */
  function parseWeightToGrams(weightStr) {
    if (!weightStr) return "";
    const num = parseFloat(weightStr);
    if (isNaN(num)) return "";
    const lower = weightStr.toLowerCase();
    if (lower.includes("kg")) return Math.round(num * 1000);
    if (lower.includes("lb") || lower.includes("pound")) return Math.round(num * 453.592);
    if (lower.includes("oz")) return Math.round(num * 28.3495);
    // Assume grams
    return Math.round(num);
  }

  /**
   * Build CSV rows for a single product.
   * Returns an array of row arrays.
   */
  function productToRows(product) {
    const handle = toHandle(product.title || "product");
    const rows = [];

    const hasVariants = product.variants && product.variants.length > 0;

    if (hasVariants) {
      // First variant becomes the main row
      product.variants.forEach((variant, idx) => {
        const row = emptyRow();
        if (idx === 0) {
          // Main product row
          row["Handle"] = handle;
          row["Title"] = product.title || "";
          row["Body (HTML)"] = product.body_html || product.short_description || "";
          row["Vendor"] = product.vendor || "";
          row["Type"] = product.categories?.[0] || "";
          row["Tags"] = (product.tags || []).join(", ");
          row["Published"] = "TRUE";
          row["SEO Title"] = product.title || "";
          row["Gift Card"] = "FALSE";
          row["Status"] = "active";

          // Images on main row
          if (product.images && product.images.length > 0) {
            row["Image Src"] = product.images[0];
            row["Image Position"] = "1";
            row["Image Alt Text"] = product.title || "";
          }
        } else {
          // Subsequent variant rows only need handle
          row["Handle"] = handle;
        }

        // Variant options
        const attrKeys = Object.keys(variant.attributes || {});
        attrKeys.forEach((key, i) => {
          if (i < 3) {
            const optName = key.replace(/^attribute_pa_|^attribute_/, "").replace(/-/g, " ");
            row[`Option${i + 1} Name`] = capitalize(optName);
            row[`Option${i + 1} Value`] = variant.attributes[key] || "";
          }
        });

        row["Variant SKU"] = variant.sku || "";
        row["Variant Price"] = variant.price || product.price || "";
        row["Variant Compare At Price"] = variant.compare_at_price || "";
        row["Variant Grams"] = parseWeightToGrams(variant.weight || product.weight) || "";
        row["Variant Inventory Tracker"] = "shopify";
        row["Variant Inventory Qty"] = product.inventory_qty ?? "";
        row["Variant Inventory Policy"] = product.inventory_policy || "deny";
        row["Variant Fulfillment Service"] = "manual";
        row["Variant Requires Shipping"] = "TRUE";
        row["Variant Taxable"] = "TRUE";
        row["Variant Weight Unit"] = "g";
        if (variant.image) {
          row["Variant Image"] = variant.image;
        }

        rows.push(row);
      });
    } else {
      // Simple product
      const row = emptyRow();
      row["Handle"] = handle;
      row["Title"] = product.title || "";
      row["Body (HTML)"] = product.body_html || product.short_description || "";
      row["Vendor"] = product.vendor || "";
      row["Type"] = product.categories?.[0] || "";
      row["Tags"] = (product.tags || []).join(", ");
      row["Published"] = "TRUE";
      row["Option1 Name"] = "Title";
      row["Option1 Value"] = "Default Title";
      row["Variant SKU"] = product.sku || "";
      row["Variant Price"] = product.price || "";
      row["Variant Compare At Price"] = product.compare_at_price || "";
      row["Variant Grams"] = parseWeightToGrams(product.weight) || "";
      row["Variant Inventory Tracker"] = "shopify";
      row["Variant Inventory Qty"] = product.inventory_qty ?? "";
      row["Variant Inventory Policy"] = product.inventory_policy || "deny";
      row["Variant Fulfillment Service"] = "manual";
      row["Variant Requires Shipping"] = "TRUE";
      row["Variant Taxable"] = "TRUE";
      row["Variant Weight Unit"] = "g";
      row["Gift Card"] = "FALSE";
      row["SEO Title"] = product.title || "";
      row["Status"] = "active";

      if (product.images && product.images.length > 0) {
        row["Image Src"] = product.images[0];
        row["Image Position"] = "1";
        row["Image Alt Text"] = product.title || "";
      }

      rows.push(row);
    }

    // Additional image rows
    if (product.images && product.images.length > 1) {
      product.images.slice(1).forEach((img, idx) => {
        const row = emptyRow();
        row["Handle"] = handle;
        row["Image Src"] = img;
        row["Image Position"] = String(idx + 2);
        row["Image Alt Text"] = product.title || "";
        rows.push(row);
      });
    }

    return rows;
  }

  /**
   * Create an empty row object with all headers.
   */
  function emptyRow() {
    const row = {};
    HEADERS.forEach((h) => (row[h] = ""));
    return row;
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Convert an array of products to a full Shopify CSV string.
   */
  function toCSV(products) {
    const allRows = [];
    products.forEach((product) => {
      const rows = productToRows(product);
      allRows.push(...rows);
    });

    const lines = [HEADERS.map(escapeCSV).join(",")];
    allRows.forEach((row) => {
      const line = HEADERS.map((h) => escapeCSV(row[h])).join(",");
      lines.push(line);
    });

    return lines.join("\n");
  }

  return { toCSV, HEADERS };
})();

// Make available in different contexts
if (typeof module !== "undefined") {
  module.exports = ShopifyCSV;
}
