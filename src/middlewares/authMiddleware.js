// Import package
const jwt = require("jsonwebtoken");

// Import models
const User = require("../models/User");

// Import utilities
const httpStatusCode = require("../utils/httpStatusCode");

// Authenticate user
const authMiddleware = async (req, res, next) => {
  try {
    // Get access token from cookies
    const accessToken = req.cookies?.[process.env.COOKIE_ACCESS_TOKEN];

    if (!accessToken) {
      return res.status(httpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Please login to continue.",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);

    // Find user
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(httpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "User account not found.",
      });
    }

    // Check soft delete
    if (user.isDeleted) {
      return res.status(httpStatusCode.FORBIDDEN).json({
        success: false,
        message: "This account has been deleted.",
      });
    }

    // Check account status
    if (user.status !== "active") {
      return res.status(httpStatusCode.FORBIDDEN).json({
        success: false,
        message: "This account is not active.",
      });
    }

    // Check email verification
    if (!user.isEmailVerified) {
      return res.status(httpStatusCode.FORBIDDEN).json({
        success: false,
        message: "Please verify your email before continuing.",
      });
    }

    // Check account lock
    if (user.isLocked) {
      return res.status(httpStatusCode.FORBIDDEN).json({
        success: false,
        message: "Your account is currently locked.",
      });
    }

    // Attach authenticated user
    req.user = user;

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(httpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Your session has expired. Please login again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(httpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Invalid access token.",
      });
    }

    return next(error);
  }
};

// Export middleware
module.exports = authMiddleware;
