// WooCommerce Product CSV export utility
// Reference: https://woocommerce.com/document/product-csv-importer-exporter/

const WooCommerceCSV = (() => {
  "use strict";

  const HEADERS = [
    "ID",
    "Type",
    "SKU",
    "Name",
    "Published",
    "Is featured?",
    "Visibility in catalog",
    "Short description",
    "Description",
    "Date sale price starts",
    "Date sale price ends",
    "Tax status",
    "Tax class",
    "In stock?",
    "Stock",
    "Low stock amount",
    "Backorders allowed?",
    "Sold individually?",
    "Weight (kg)",
    "Length (cm)",
    "Width (cm)",
    "Height (cm)",
    "Allow customer reviews?",
    "Purchase note",
    "Sale price",
    "Regular price",
    "Categories",
    "Tags",
    "Shipping class",
    "Images",
    "Download limit",
    "Download expiry days",
    "Parent",
    "Grouped products",
    "Upsells",
    "Cross-sells",
    "External URL",
    "Button text",
    "Position",
  ];

  function escapeCSV(value) {
    if (value == null) return "";
    const str = String(value);
    if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  function productToRow(product) {
    const hasVariants = product.variants && product.variants.length > 0;
    const row = {};
    HEADERS.forEach((h) => (row[h] = ""));

    row["ID"] = "";
    row["Type"] = hasVariants ? "variable" : "simple";
    row["SKU"] = product.sku || "";
    row["Name"] = product.title || "";
    row["Published"] = "1";
    row["Is featured?"] = "0";
    row["Visibility in catalog"] = "visible";
    row["Short description"] = product.short_description || "";
    row["Description"] = product.body_html || "";
    row["Tax status"] = "taxable";
    row["In stock?"] = product.in_stock !== false ? "1" : "0";
    row["Stock"] = product.inventory_qty || "";
    row["Backorders allowed?"] = "0";
    row["Sold individually?"] = "0";
    row["Weight (kg)"] = product.weight || "";
    row["Allow customer reviews?"] = "1";
    row["Regular price"] = product.compare_at_price || product.price || "";
    row["Sale price"] = product.compare_at_price ? (product.price || "") : "";
    row["Categories"] = (product.categories || []).join(" > ");
    row["Tags"] = (product.tags || []).join(", ");
    row["Images"] = (product.images || []).join(", ");

    return row;
  }

  function toCSV(products) {
    const rows = products.map(productToRow);

    const lines = [HEADERS.map(escapeCSV).join(",")];
    rows.forEach((row) => {
      const line = HEADERS.map((h) => escapeCSV(row[h])).join(",");
      lines.push(line);
    });

    return lines.join("\n");
  }

  return { toCSV, HEADERS };
})();

if (typeof module !== "undefined") {
  module.exports = WooCommerceCSV;
}
