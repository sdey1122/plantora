// Handle unknown routes
const notFoundMiddleware = (req, res) => {
  const message = `Cannot ${req.method} ${req.originalUrl}`;

  // API request
  if (
    req.originalUrl.startsWith("/api") ||
    req.xhr ||
    req.headers.accept?.includes("application/json")
  ) {
    return res.status(404).json({
      success: false,
      message,
    });
  }

  // EJS page
  return res.status(404).render("errors/404", {
    title: "404 Not Found",
    message,
  });
};

// Export middleware
module.exports = notFoundMiddleware;
