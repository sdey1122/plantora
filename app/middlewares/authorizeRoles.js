// Import utility
const httpStatusCode = require("../utils/httpStatusCode");

// Authorize user roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Check authentication
    if (!req.user) {
      return res.status(httpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // Check user role
    if (!roles.includes(req.user.role)) {
      return res.status(httpStatusCode.FORBIDDEN).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
    }

    return next();
  };
};

// Export middleware
module.exports = authorizeRoles;
