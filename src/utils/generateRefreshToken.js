// Import package
const jwt = require("jsonwebtoken");

// Generate refresh token
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });
};

// Export utility
module.exports = generateRefreshToken;
