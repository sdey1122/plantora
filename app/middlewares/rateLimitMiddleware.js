// Import package
const { rateLimit } = require("express-rate-limit");

// Import logger
const logger = require("../config/logger");

// Import utility
const httpStatusCode = require("../utils/httpStatusCode");

// Shared configuration
const commonOptions = {
  standardHeaders: true,
  legacyHeaders: false,

  skip: () => process.env.NODE_ENV === "development",
};

// Create reusable rate limit handler
const createRateLimitHandler = (message) => {
  return (req, res) => {
    logger.warn(
      `Rate limit exceeded | ${req.method} ${req.originalUrl} | IP: ${req.ip}`,
    );

    const retryAfter = req.rateLimit?.resetTime
      ? Math.max(
          0,
          Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000),
        )
      : null;

    return res.status(httpStatusCode.TOO_MANY_REQUESTS).json({
      success: false,
      message,
      retryAfter,
    });
  };
};

// Register limiter
const registerLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  limit: Number(process.env.REGISTER_RATE_LIMIT) || 5,

  ...commonOptions,

  handler: createRateLimitHandler(
    "Too many registration attempts. Please try again after 15 minutes.",
  ),
});

// Login limiter
const loginLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  limit: Number(process.env.LOGIN_RATE_LIMIT) || 5,

  ...commonOptions,

  handler: createRateLimitHandler(
    "Too many login attempts. Please try again after 15 minutes.",
  ),
});

// Forgot password limiter
const forgotPasswordLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  limit: Number(process.env.FORGOT_PASSWORD_RATE_LIMIT) || 3,

  ...commonOptions,

  handler: createRateLimitHandler(
    "Too many forgot password requests. Please try again after 15 minutes.",
  ),
});

// Reset password limiter
const resetPasswordLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  limit: Number(process.env.RESET_PASSWORD_RATE_LIMIT) || 5,

  ...commonOptions,

  handler: createRateLimitHandler(
    "Too many password reset attempts. Please try again after 15 minutes.",
  ),
});

// Resend verification email limiter
const resendVerificationLimiter = rateLimit({
  windowMs: Number(process.env.RESEND_VERIFICATION_WINDOW_MS) || 60 * 60 * 1000,

  limit: Number(process.env.RESEND_VERIFICATION_RATE_LIMIT) || 5,

  ...commonOptions,

  handler: createRateLimitHandler(
    "Too many verification email requests. Please try again after 1 hour.",
  ),
});

// Refresh token limiter
const refreshTokenLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,

  limit: Number(process.env.REFRESH_TOKEN_RATE_LIMIT) || 30,

  ...commonOptions,

  handler: createRateLimitHandler(
    "Too many token refresh requests. Please try again later.",
  ),
});

// Public API limiter
const publicApiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,

  limit: Number(process.env.PUBLIC_API_RATE_LIMIT) || 200,

  ...commonOptions,

  handler: createRateLimitHandler("Too many requests. Please try again later."),
});

// Admin API limiter
const adminApiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,

  limit: Number(process.env.ADMIN_API_RATE_LIMIT) || 100,

  ...commonOptions,

  handler: createRateLimitHandler("Too many requests. Please try again later."),
});

// Export limiters
module.exports = {
  registerLimiter,
  loginLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  resendVerificationLimiter,
  refreshTokenLimiter,
  publicApiLimiter,
  adminApiLimiter,
};
