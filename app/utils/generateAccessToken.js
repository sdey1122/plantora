// Import package
const jwt = require("jsonwebtoken");

// Generate access token
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  });
};

// Export utility
module.exports = generateAccessToken;
