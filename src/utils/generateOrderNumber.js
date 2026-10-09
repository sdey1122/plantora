const crypto = require("crypto");

// Generate a unique order number
const generateOrderNumber = () => {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  const randomCode = crypto.randomBytes(3).toString("hex").toUpperCase();

  return `GN-${year}${month}${day}-${randomCode}`;
};

module.exports = generateOrderNumber;
