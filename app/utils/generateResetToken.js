// Import built-in package
const crypto = require("crypto");

// Generate password reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Export utility
module.exports = generateResetToken;
