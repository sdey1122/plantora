// Import built-in package
const crypto = require("crypto");

// Generate email verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Export utility
module.exports = generateVerificationToken;
