// Import logger
const logger = require("../config/logger");

// Handle application errors
const errorMiddleware = (error, req, res, next) => {
  // Log error
  logger.error({
    message: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    statusCode: error.statusCode || 500,
  });

  const statusCode = error.statusCode || 500;

  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Something went wrong. Please try again later."
      : error.message || "Internal Server Error.";

  // API request
  if (
    req.originalUrl.startsWith("/api") ||
    req.xhr ||
    req.headers.accept?.includes("application/json")
  ) {
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }

  // EJS page
  return res.status(statusCode).render("errors/error", {
    title: "Error",
    statusCode,
    message,
  });
};

// Export middleware
module.exports = errorMiddleware;
