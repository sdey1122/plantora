// Import utility
const httpStatusCode = require("../utils/httpStatusCode");

// Verify seller access
const sellerMiddleware = (req, res, next) => {
  // Check authentication
  if (!req.user) {
    return res.status(httpStatusCode.UNAUTHORIZED).json({
      success: false,
      message: "Authentication required.",
    });
  }

  // Check seller status
  if (!req.user.isSeller) {
    return res.status(httpStatusCode.FORBIDDEN).json({
      success: false,
      message: "Seller access required.",
    });
  }

  return next();
};

// Export middleware
module.exports = sellerMiddleware;
