const express = require("express");

const authController = require("../controllers/authController");

const passport = require("../config/passport");

const authMiddleware = require("../middlewares/authMiddleware");

const {
  uploadProfileImage,
  handleUploadError,
} = require("../middlewares/uploadMiddleware");

const {
  registerLimiter,
  loginLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  resendVerificationLimiter,
  refreshTokenLimiter,
} = require("../middlewares/rateLimitMiddleware");

const router = express.Router();

// Register
router.get("/register", authController.showRegisterPage);

router.post("/register", registerLimiter, authController.register);

// Verify Email
router.get("/verify-email/:token", authController.verifyEmail);

router.get("/resend-verification", authController.showResendVerificationPage);

router.post(
  "/resend-verification-email",
  resendVerificationLimiter,
  authController.resendVerificationEmail,
);

// Login
router.get("/login", authController.showLoginPage);

router.post("/login", loginLimiter, authController.login);

// Refresh Token
router.post(
  "/refresh-token",
  refreshTokenLimiter,
  authController.refreshAccessToken,
);

// Logout
router.post("/logout", authMiddleware, authController.logout);

// Forgot Password
router.get("/forgot-password", authController.showForgotPasswordPage);

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  authController.forgotPassword,
);

// Reset Password
router.get("/reset-password/:token", authController.showResetPasswordPage);

router.post(
  "/reset-password/:token",
  resetPasswordLimiter,
  authController.resetPassword,
);

// Profile
router.get("/profile", authMiddleware, authController.showProfilePage);

router.get("/me", authMiddleware, authController.getMyProfile);

router.put(
  "/profile",
  authMiddleware,
  uploadProfileImage,
  handleUploadError,
  authController.updateProfile,
);

// Become Seller
router.post("/become-seller", authMiddleware, authController.becomeSeller);

// Change Email
router.put("/change-email", authMiddleware, authController.changeEmail);

// Change Password
router.put("/change-password", authMiddleware, authController.changePassword);

// Delete Profile Image
router.delete(
  "/profile/image",
  authMiddleware,
  authController.deleteProfileImage,
);

// ==========================================================
// GOOGLE AUTHENTICATION
// ==========================================================

// router.get(
//   "/google",
//   passport.authenticate("google", {
//     scope: ["profile", "email"],
//   }),
// );

// router.get(
//   "/google/callback",
//   passport.authenticate("google", {
//     session: false,

//     failureRedirect: "/?type=error&message=Google%20authentication%20failed.",
//   }),
//   authController.googleLogin.bind(authController),
// );

module.exports = router;
