// Import built-in package
const crypto = require("crypto");

// Generate unique product SKU
const generateSKU = (productName = "") => {
  const words = productName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  let prefix = words
    .slice(0, 2)
    .map((word) => word.substring(0, 3))
    .join("-");

  if (!prefix) {
    prefix = "PRD";
  }

  const uniqueCode = crypto.randomBytes(3).toString("hex").toUpperCase();

  return `${prefix}-${uniqueCode}`;
};

// Export utility
module.exports = generateSKU;
