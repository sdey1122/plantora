const jwt = require("jsonwebtoken");
const ms = require("ms");

const User = require("../models/User");
const Token = require("../models/Token");
const Notification = require("../models/Notification");

const logger = require("../config/logger");

const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  verifyEmailValidation,
  resendVerificationValidation,
  updateProfileValidation,
  becomeSellerValidation,
} = require("../validations/authValidation");

const {
  getVerificationEmail,
  getResetPasswordEmail,
  getSellerRequestEmail,
  getSellerApprovedEmail,
  getSellerRejectedEmail,
} = require("../utils/emailTemplates");

const generateAccessToken = require("../utils/generateAccessToken");
const generateRefreshToken = require("../utils/generateRefreshToken");
const generateVerificationToken = require("../utils/generateVerificationToken");
const generateResetToken = require("../utils/generateResetToken");

const hashToken = require("../utils/hashToken");

const sendEmail = require("../utils/sendEmail");

const createAuditLog = require("../utils/createAuditLog");

const cloudinaryImageUpload = require("../utils/cloudinaryImageUpload");
const cloudinaryImageDelete = require("../utils/cloudinaryImageDelete");

const deleteLocalFile = require("../utils/deleteLocalFile");

const httpStatusCode = require("../utils/httpStatusCode");

const sendNotification = require("../utils/sendNotification");

class AuthController {
  // Register Page
  async showRegisterPage(req, res, next) {
    try {
      return res.render("auth/register", {
        title: "Create Account",
      });
    } catch (error) {
      next(error);
    }
  }

  // Login Page
  async showLoginPage(req, res, next) {
    try {
      return res.render("auth/login", {
        title: "Login",
      });
    } catch (error) {
      next(error);
    }
  }

  // Forgot Password Page
  async showForgotPasswordPage(req, res, next) {
    try {
      return res.render("auth/forgot-password", {
        title: "Forgot Password",
      });
    } catch (error) {
      next(error);
    }
  }

  // Reset Password Page
  async showResetPasswordPage(req, res, next) {
    try {
      return res.render("auth/reset-password", {
        title: "Reset Password",
        token: req.params.token,
      });
    } catch (error) {
      next(error);
    }
  }

  // Profile Page
  async showProfilePage(req, res, next) {
    try {
      return res.render("auth/profile", {
        title: "My Profile",
        user: req.user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Register
  async register(req, res, next) {
    try {
      // Validate request body
      const { error, value } = registerValidation.validate(req.body);

      if (error) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const { name, email, password, termsAccepted } = value;

      // Terms & Conditions validation
      if (!termsAccepted) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "You must accept Terms & Conditions.",
        });
      }

      // Admin account cannot be registered
      if (email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()) {
        return res.status(httpStatusCode.FORBIDDEN).json({
          success: false,
          message: "Administrator account cannot be registered.",
        });
      }

      // Check duplicate email
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
      });

      if (existingUser) {
        return res.status(httpStatusCode.CONFLICT).json({
          success: false,
          message: "An account with this email already exists.",
        });
      }

      // Create customer account
      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password,

        role: "customer",

        status: "inactive",

        isEmailVerified: false,

        seller: {
          status: "none",
        },

        termsAccepted: true,

        termsAcceptedAt: new Date(),

        failedLoginAttempts: 0,

        accountLockedUntil: null,

        lockReason: "",

        lockedBy: null,

        lastLogin: null,

        lastActive: null,

        emailChangedAt: null,

        isDeleted: false,

        deletedAt: null,
      });

      // Remove previous verification tokens
      await Token.deleteMany({
        user: user._id,
        type: "verify-email",
      });

      // Generate verification token
      const verificationToken = generateVerificationToken();

      const hashedVerificationToken = hashToken(verificationToken);

      // Save verification token
      await Token.create({
        user: user._id,
        token: hashedVerificationToken,
        type: "verify-email",
        expiresAt: new Date(
          Date.now() + ms(process.env.EMAIL_VERIFICATION_TOKEN_EXPIRES),
        ),
      });

      // Build verification url
      const verificationUrl = `${process.env.APP_URL}/auth/verify-email/${verificationToken}`;

      // Generate email template
      const { subject, html, text } = getVerificationEmail(
        user.name,
        verificationUrl,
      );

      // Send verification email
      await sendEmail({
        to: user.email,
        subject,
        html,
        text,
      });

      // Create audit log
      await createAuditLog({
        req,

        actor: user,

        module: "Authentication",

        action: "Register",

        severity: "info",

        target: {
          id: user._id,
          model: "User",
        },

        description: "New customer account registered successfully.",
      });

      logger.info(`Customer registered successfully : ${user.email}`);

      return res.status(httpStatusCode.CREATED).json({
        success: true,
        message:
          "Registration successful. Please verify your email before logging in.",
      });
    } catch (error) {
      next(error);
    }
  }
  // Verify Email
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.params;

      const { error } = verifyEmailValidation.validate({
        token,
      });

      if (error) {
        return res.render("auth/verify-failed", {
          title: "Verification Failed",
          message: error.details[0].message,
        });
      }

      const hashedToken = hashToken(token);

      const verificationToken = await Token.findOne({
        token: hashedToken,
        type: "verify-email",
      });

      if (!verificationToken) {
        return res.render("auth/verify-failed", {
          title: "Verification Failed",
          message: "Invalid verification link.",
        });
      }

      if (verificationToken.expiresAt < new Date()) {
        await Token.findByIdAndDelete(verificationToken._id);

        return res.render("auth/verify-failed", {
          title: "Verification Failed",
          message: "Verification link has expired.",
        });
      }

      const user = await User.findById(verificationToken.user);

      if (!user) {
        await Token.findByIdAndDelete(verificationToken._id);

        return res.render("auth/verify-failed", {
          title: "Verification Failed",
          message: "User not found.",
        });
      }

      if (user.isDeleted) {
        await Token.findByIdAndDelete(verificationToken._id);

        return res.render("auth/verify-failed", {
          title: "Verification Failed",
          message: "This account has been deleted.",
        });
      }

      if (user.status === "blocked") {
        return res.render("auth/verify-failed", {
          title: "Verification Failed",
          message: "Your account has been blocked.",
        });
      }

      if (user.isEmailVerified) {
        await Token.findByIdAndDelete(verificationToken._id);

        return res.render("auth/verify-already", {
          title: "Already Verified",
        });
      }

      user.isEmailVerified = true;
      user.status = "active";

      await user.save();

      await Token.deleteMany({
        user: user._id,
        type: "verify-email",
      });

      await createAuditLog({
        req,
        actor: user,
        module: "Authentication",
        action: "Verify Email",
        severity: "info",
        target: {
          id: user._id,
          model: "User",
        },
        description: "Email verified successfully.",
      });

      logger.info(`Email verified successfully : ${user.email}`);

      return res.render("auth/verify-success", {
        title: "Email Verified",
      });
    } catch (error) {
      next(error);
    }
  }

  // Resend Verification Email
  async resendVerificationEmail(req, res, next) {
    try {
      const { error, value } = resendVerificationValidation.validate(req.body);

      if (error) {
        return res.render("auth/resend-verification", {
          title: "Resend Verification Email",
          message: null,
          type: null,
          email: "",
        });
      }

      const { email } = value;

      const user = await User.findOne({
        email: email.toLowerCase(),
      });

      if (!user) {
        return res.render("auth/resend-verification", {
          title: "Resend Verification Email",
          type: "error",
          message: "No account found with this email address.",
          email: email || "",
        });
      }

      if (user.isDeleted) {
        return res.render("auth/resend-verification", {
          title: "Resend Verification Email",
          type: "error",
          message: "This account has been deleted.",
          email: email || "",
        });
      }

      if (user.status === "blocked") {
        return res.render("auth/resend-verification", {
          title: "Resend Verification Email",
          type: "error",
          message: "Your account has been blocked.",
          email: email || "",
        });
      }

      if (user.isEmailVerified) {
        return res.render("auth/verify-already", {
          title: "Email Already Verified",
        });
      }

      await Token.deleteMany({
        user: user._id,
        type: "verify-email",
      });

      const verificationToken = generateVerificationToken();

      const hashedToken = hashToken(verificationToken);

      await Token.create({
        user: user._id,
        token: hashedToken,
        type: "verify-email",
        expiresAt: new Date(
          Date.now() + ms(process.env.EMAIL_VERIFICATION_TOKEN_EXPIRES),
        ),
      });

      const verificationUrl = `${process.env.APP_URL}/auth/verify-email/${verificationToken}`;

      const { subject, html, text } = getVerificationEmail(
        user.name,
        verificationUrl,
      );

      await sendEmail({
        to: user.email,
        subject,
        html,
        text,
      });

      await createAuditLog({
        req,
        actor: user,
        module: "Authentication",
        action: "Resend Verification Email",
        severity: "info",
        target: {
          id: user._id,
          model: "User",
        },
        description: "Verification email resent successfully.",
      });

      logger.info(`Verification email resent : ${user.email}`);

      return res.render("auth/resend-verification", {
        title: "Resend Verification Email",
        type: "success",
        message:
          "A new verification email has been sent. Please check your inbox.",
        email: email || "",
      });
    } catch (error) {
      next(error);
    }
  }

  async showResendVerificationPage(req, res) {
    return res.render("auth/resend-verification", {
      title: "Resend Verification Email",
      message: null,
      type: null,
      email: email || "",
    });
  }
  // Login
  async login(req, res, next) {
    try {
      const { error, value } = loginValidation.validate(req.body);

      if (error) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const { email, password, rememberMe } = value;

      const user = await User.findOne({
        email: email.toLowerCase(),
      }).select("+password");

      if (!user) {
        logger.warn(`Login failed. Email not found : ${email}`);

        return res.status(httpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Invalid email or password.",
        });
      }

      if (user.isDeleted) {
        return res.status(httpStatusCode.FORBIDDEN).json({
          success: false,
          message: "Account has been deleted.",
        });
      }

      if (user.status === "blocked") {
        return res.status(httpStatusCode.FORBIDDEN).json({
          success: false,
          message: "Your account has been blocked.",
        });
      }

      if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
        return res.status(httpStatusCode.FORBIDDEN).json({
          success: false,
          message:
            "Your account is temporarily locked. Please try again later.",
        });
      }

      if (!user.isEmailVerified) {
        return res.status(httpStatusCode.FORBIDDEN).json({
          success: false,
          message: "Please verify your email before logging in.",
        });
      }

      if (user.status !== "active") {
        return res.status(httpStatusCode.FORBIDDEN).json({
          success: false,
          message: "Your account is inactive.",
        });
      }

      const isPasswordMatched = await user.comparePassword(password);

      if (!isPasswordMatched) {
        user.failedLoginAttempts += 1;

        if (user.failedLoginAttempts >= 5) {
          user.failedLoginAttempts = 5;

          user.accountLockedUntil = new Date(
            Date.now() + ms(process.env.LOGIN_LOCK_DURATION),
          );

          user.lockReason = "Maximum login attempts exceeded.";

          await createAuditLog({
            req,
            actor: user,
            module: "Authentication",
            action: "Account Locked",
            severity: "medium",
            target: {
              id: user._id,
              model: "User",
            },
            description:
              "Account locked due to multiple failed login attempts.",
          });

          logger.warn(`Account locked : ${user.email}`);
        }

        await user.save();

        logger.warn(`Invalid password : ${user.email}`);

        return res.status(httpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Invalid email or password.",
        });
      }

      user.failedLoginAttempts = 0;
      user.accountLockedUntil = null;
      user.lockReason = "";
      user.lastLogin = new Date();
      user.lastActive = new Date();

      await user.save();

      const tokenPayload = {
        id: user._id,
        role: user.role,
        email: user.email,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      const hashedRefreshToken = hashToken(refreshToken);

      await Token.deleteMany({
        user: user._id,
        type: "refresh-token",
      });

      await Token.create({
        user: user._id,
        token: hashedRefreshToken,
        type: "refresh-token",
        expiresAt: new Date(
          Date.now() + ms(process.env.JWT_REFRESH_EXPIRES_IN),
        ),
      });

      const accessCookieAge = rememberMe
        ? ms(process.env.JWT_ACCESS_EXPIRES_IN)
        : ms(process.env.JWT_ACCESS_EXPIRES_IN);

      const refreshCookieAge = rememberMe
        ? ms(process.env.JWT_REFRESH_EXPIRES_IN)
        : ms(process.env.JWT_REFRESH_EXPIRES_IN);

      res.cookie(process.env.COOKIE_ACCESS_TOKEN, accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: accessCookieAge,
      });

      res.cookie(process.env.COOKIE_REFRESH_TOKEN, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: refreshCookieAge,
      });

      await createAuditLog({
        req,
        actor: user,
        module: "Authentication",
        action: "Login",
        severity: "info",
        target: {
          id: user._id,
          model: "User",
        },
        description: "User logged in successfully.",
      });

      logger.info(`Login successful : ${user.email}`);

      return res.status(httpStatusCode.OK).json({
        success: true,
        message: "Login successful.",
      });
    } catch (error) {
      next(error);
    }
  }
  // Refresh Access Token
  async refreshAccessToken(req, res, next) {
    try {
      const refreshToken = req.cookies[process.env.COOKIE_REFRESH_TOKEN];

      if (!refreshToken) {
        return res.status(httpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Refresh token is required.",
        });
      }

      let decoded;

      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      } catch (error) {
        return res.status(httpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Invalid or expired refresh token.",
        });
      }

      const user = await User.findById(decoded.id);

      if (!user) {
        return res.redirect(
          `/auth/profile?type=error&message=${encodeURIComponent("User not found.")}`,
        );
      }

      if (user.isDeleted) {
        return res.status(httpStatusCode.FORBIDDEN).json({
          success: false,
          message: "Account has been deleted.",
        });
      }

      if (user.status !== "active") {
        return res.status(httpStatusCode.FORBIDDEN).json({
          success: false,
          message: "Your account is inactive.",
        });
      }

      if (!user.isEmailVerified) {
        return res.status(httpStatusCode.FORBIDDEN).json({
          success: false,
          message: "Email is not verified.",
        });
      }

      if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
        return res.status(httpStatusCode.FORBIDDEN).json({
          success: false,
          message: "Account is temporarily locked.",
        });
      }

      const hashedRefreshToken = hashToken(refreshToken);

      const token = await Token.findOne({
        user: user._id,
        token: hashedRefreshToken,
        type: "refresh-token",
      });

      if (!token) {
        return res.status(httpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Refresh token is invalid.",
        });
      }

      if (token.expiresAt < new Date()) {
        await Token.findByIdAndDelete(token._id);

        return res.status(httpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Refresh token has expired.",
        });
      }

      const newAccessToken = generateAccessToken(user);

      const newRefreshToken = generateRefreshToken(user);

      const hashedNewRefreshToken = hashToken(newRefreshToken);

      token.token = hashedNewRefreshToken;

      token.expiresAt = new Date(
        Date.now() + ms(process.env.JWT_REFRESH_EXPIRES_IN),
      );

      await token.save();

      res.cookie(process.env.COOKIE_ACCESS_TOKEN, newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: ms(process.env.JWT_ACCESS_EXPIRES_IN),
      });

      res.cookie(process.env.COOKIE_REFRESH_TOKEN, newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: ms(process.env.JWT_REFRESH_EXPIRES_IN),
      });

      user.lastActive = new Date();

      await user.save();

      logger.info(`Access token refreshed : ${user.email}`);

      return res.status(httpStatusCode.OK).json({
        success: true,
        message: "Access token refreshed successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  // Logout
  async logout(req, res, next) {
    try {
      const refreshToken = req.cookies[process.env.COOKIE_REFRESH_TOKEN];

      if (refreshToken) {
        const hashedRefreshToken = hashToken(refreshToken);

        await Token.findOneAndDelete({
          token: hashedRefreshToken,
          type: "refresh-token",
        });
      }

      res.clearCookie(process.env.COOKIE_ACCESS_TOKEN);

      res.clearCookie(process.env.COOKIE_REFRESH_TOKEN);

      if (req.user) {
        req.user.lastActive = new Date();

        await req.user.save();

        await createAuditLog({
          req,
          actor: req.user,
          module: "Authentication",
          action: "Logout",
          severity: "info",
          target: {
            id: req.user._id,
            model: "User",
          },
          description: "User logged out successfully.",
        });

        logger.info(`Logout successful : ${req.user.email}`);
      }

      // return res.status(httpStatusCode.OK).json({
      //   success: true,
      //   message: "Logout successful.",
      // });
      return res.redirect("/");
    } catch (error) {
      next(error);
    }
  }

  // Forgot Password
  async forgotPassword(req, res, next) {
    try {
      const { error, value } = forgotPasswordValidation.validate(req.body);

      if (error) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const { email } = value;

      const user = await User.findOne({
        email: email.toLowerCase(),
      });

      if (!user || user.isDeleted || user.role === "admin") {
        return res.status(httpStatusCode.OK).json({
          success: true,
          message: "If the email exists, a password reset link has been sent.",
        });
      }

      if (!user.isEmailVerified) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Please verify your email first.",
        });
      }

      await Token.deleteMany({
        user: user._id,
        type: "reset-password",
      });

      const resetToken = generateResetToken();

      const hashedResetToken = hashToken(resetToken);

      await Token.create({
        user: user._id,
        token: hashedResetToken,
        type: "reset-password",
        expiresAt: new Date(
          Date.now() + ms(process.env.RESET_PASSWORD_TOKEN_EXPIRES),
        ),
      });

      const resetUrl = `${process.env.APP_URL}/auth/reset-password/${resetToken}`;

      const { subject, html, text } = getResetPasswordEmail(
        user.name,
        resetUrl,
      );

      await sendEmail({
        to: user.email,
        subject,
        html,
        text,
      });

      await createAuditLog({
        req,
        actor: user,
        module: "Authentication",
        action: "Forgot Password",
        severity: "info",
        target: {
          id: user._id,
          model: "User",
        },
        description: "Password reset email sent.",
      });

      logger.info(`Password reset email sent : ${user.email}`);

      return res.status(httpStatusCode.OK).json({
        success: true,
        message: "If the email exists, a password reset link has been sent.",
      });
    } catch (error) {
      next(error);
    }
  }
  // Reset Password
  async resetPassword(req, res, next) {
    try {
      const { token } = req.params;

      const { error, value } = resetPasswordValidation.validate(req.body);

      if (error) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const hashedToken = hashToken(token);

      const resetToken = await Token.findOne({
        token: hashedToken,
        type: "reset-password",
      });

      if (!resetToken) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid reset password link.",
        });
      }

      if (resetToken.expiresAt < new Date()) {
        await Token.findByIdAndDelete(resetToken._id);

        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Reset password link has expired.",
        });
      }

      const user = await User.findById(resetToken.user).select("+password");

      if (!user) {
        await Token.findByIdAndDelete(resetToken._id);

        return res.redirect(
          `/auth/login?type=error&message=${encodeURIComponent("User not found.")}`,
        );
      }

      if (user.isDeleted) {
        return res.status(httpStatusCode.FORBIDDEN).json({
          success: false,
          message: "Account has been deleted.",
        });
      }

      if (user.role === "admin") {
        return res.status(httpStatusCode.FORBIDDEN).json({
          success: false,
          message: "Administrator password cannot be reset.",
        });
      }

      user.password = value.password;
      user.failedLoginAttempts = 0;
      user.accountLockedUntil = null;
      user.lockReason = "";

      await user.save();

      await Token.deleteMany({
        user: user._id,
        type: "reset-password",
      });

      await Token.deleteMany({
        user: user._id,
        type: "refresh-token",
      });

      await createAuditLog({
        req,
        actor: user,
        module: "Authentication",
        action: "Reset Password",
        severity: "medium",
        target: {
          id: user._id,
          model: "User",
        },
        description: "Password reset completed successfully.",
      });

      logger.info(`Password reset successful : ${user.email}`);

      return res.status(httpStatusCode.OK).json({
        success: true,
        message: "Password reset successfully. Please login again.",
      });
    } catch (error) {
      next(error);
    }
  }

  // Change Password
  async changePassword(req, res, next) {
    try {
      const { error, value } = changePasswordValidation.validate(req.body);

      if (error) {
        return res.redirect(
          `/auth/profile?type=error&passwordError=${encodeURIComponent(error.details[0].message)}`,
        );
      }

      const user = await User.findById(req.user._id).select("+password");

      if (!user) {
        return res.redirect(
          `/auth/profile?type=error&message=${encodeURIComponent("User not found.")}`,
        );
      }

      if (user.role === "admin") {
        return res.status(httpStatusCode.FORBIDDEN).json({
          success: false,
          message: "Administrator password cannot be changed.",
        });
      }

      const isPasswordMatched = await user.comparePassword(
        value.currentPassword,
      );

      if (!isPasswordMatched) {
        return res.redirect(
          `/auth/profile?type=error&message=${encodeURIComponent("Current password is incorrect.")}`,
        );
      }

      const isSamePassword = await user.comparePassword(value.newPassword);

      if (isSamePassword) {
        return res.redirect(
          `/auth/profile?type=error&message=${encodeURIComponent("New password must be different from current password.")}`,
        );
      }

      user.password = value.newPassword;

      await user.save();

      await Token.deleteMany({
        user: user._id,
        type: "refresh-token",
      });

      res.clearCookie(process.env.COOKIE_ACCESS_TOKEN);

      res.clearCookie(process.env.COOKIE_REFRESH_TOKEN);

      if (req.session) {
        req.session.destroy(() => {});
      }

      await createAuditLog({
        req,
        actor: user,
        module: "Authentication",
        action: "Change Password",
        severity: "medium",
        target: {
          id: user._id,
          model: "User",
        },
        description: "Password changed successfully.",
      });

      logger.info(`Password changed : ${user.email}`);

      return res.redirect(
        `/?type=success&message=${encodeURIComponent("Password changed successfully. Please login again.")}`,
      );

      return res.redirect("/");
    } catch (error) {
      next(error);
    }
  }

  // My Profile
  async getMyProfile(req, res, next) {
    try {
      const user = await User.findById(req.user._id).select("-password").lean();

      if (!user) {
        return res.redirect(
          `/auth/profile?type=error&message=${encodeURIComponent("User not found.")}`,
        );
      }

      return res.status(httpStatusCode.OK).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
  // Update Profile
  async updateProfile(req, res, next) {
    try {
      const { error, value } = updateProfileValidation.validate(req.body);

      if (error) {
        if (req.file) {
          deleteLocalFile(req.file.path);
        }

        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const user = await User.findById(req.user._id);

      if (!user) {
        if (req.file) {
          deleteLocalFile(req.file.path);
        }

        return res.redirect(
          `/auth/profile?type=error&message=${encodeURIComponent("User not found.")}`,
        );
      }

      if (req.file) {
        const uploadedImage = await cloudinaryImageUpload(
          req.file.path,
          `${process.env.CLOUDINARY_FOLDER}/profile`,
        );

        deleteLocalFile(req.file.path);

        if (
          user.profileImage &&
          user.profileImage.publicId &&
          !user.profileImage.publicId.includes("default")
        ) {
          await cloudinaryImageDelete(user.profileImage.publicId);
        }

        user.profileImage = {
          url: uploadedImage.secure_url,
          publicId: uploadedImage.public_id,
        };
      }

      user.name = value.name;
      user.bio = value.bio || "";

      user.lastActive = new Date();

      await user.save();

      await createAuditLog({
        req,
        actor: user,
        module: "Authentication",
        action: "Update Profile",
        severity: "info",
        target: {
          id: user._id,
          model: "User",
        },
        description: "Profile updated successfully.",
      });

      logger.info(`Profile updated : ${user.email}`);

      return res.redirect(
        `/auth/profile?type=success&message=${encodeURIComponent("Profile updated successfully.")}`,
      );
    } catch (error) {
      if (req.file) {
        deleteLocalFile(req.file.path);
      }

      next(error);
    }
  }

  // Become Seller
  async becomeSeller(req, res, next) {
    try {
      // Validate request
      const { error } = becomeSellerValidation.validate(req.body);

      if (error) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: error.details[0].message,
        });
      }

      // Find customer
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.redirect(
          `/auth/profile?type=error&message=${encodeURIComponent("User not found.")}`,
        );
      }

      // Prevent admin
      if (user.role === "admin") {
        return res.status(httpStatusCode.FORBIDDEN).json({
          success: false,
          message: "Administrator cannot become a seller.",
        });
      }

      // Already approved
      if (user.seller.status === "approved") {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "You are already a seller.",
        });
      }

      // Already pending
      if (user.seller.status === "pending") {
        return res.redirect(
          `/auth/profile?type=error&message=${encodeURIComponent(
            "Your seller request is already under review.",
          )}`,
        );
      }

      // Rejected -> wait 7 days
      if (
        user.seller.status === "rejected" &&
        user.seller.approvedAt &&
        Date.now() - new Date(user.seller.approvedAt).getTime() <
          7 * 24 * 60 * 60 * 1000
      ) {
        return res.redirect(
          `/auth/profile?type=error&message=${encodeURIComponent(
            "You can apply again after 7 days.",
          )}`,
        );
      }

      // Request seller account

      // Request seller account
      user.seller.status = "pending";
      user.seller.requestedAt = new Date();
      user.seller.adminRemark = "";

      await user.save();

      // Find admin
      const admin = await User.findOne({
        role: "admin",
        isDeleted: false,
      });

      if (admin) {
        // Notification
        await sendNotification({
          recipient: admin._id,
          sender: user._id,
          title: "New Seller Request",
          message: `${user.name} has requested to become a seller.`,
          type: "seller",
          referenceType: "User",
          referenceId: user._id,
          actionUrl: `/admin/users/customers/${user._id}`,
        });

        // Email
        const reviewUrl = `${process.env.APP_URL}/admin/users/seller-request/${user._id}`;

        const { subject, html, text } = getSellerRequestEmail(
          user.name,
          user.email,
          reviewUrl,
        );

        await sendEmail({
          to: admin.email,
          subject,
          html,
          text,
        });
      }

      // Audit log
      await createAuditLog({
        req,
        actor: user,
        module: "Seller",
        action: "Become Seller",
        severity: "info",
        target: {
          id: user._id,
          model: "User",
        },
        description: "Seller account request submitted.",
      });

      logger.info(`Seller request submitted: ${user.email}`);

      return res.redirect(
        `/auth/profile?type=success&message=${encodeURIComponent("Seller request submitted successfully.")}`,
      );
    } catch (error) {
      next(error);
    }
  }

  // Change Email
  async changeEmail(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Email is required.",
        });
      }

      const user = await User.findById(req.user._id);

      if (!user) {
        return res.redirect(
          `/auth/profile?type=error&message=${encodeURIComponent("User not found.")}`,
        );
      }

      if (user.role === "admin") {
        return res.status(httpStatusCode.FORBIDDEN).json({
          success: false,
          message: "Administrator email cannot be changed.",
        });
      }

      const existingUser = await User.findOne({
        email: email.toLowerCase(),
      });

      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(httpStatusCode.CONFLICT).json({
          success: false,
          message: "Email address is already in use.",
        });
      }

      user.email = email.toLowerCase();
      user.isEmailVerified = false;
      user.status = "inactive";
      user.emailChangedAt = new Date();

      await user.save();

      await Token.deleteMany({
        user: user._id,
        type: "refresh-token",
      });

      await Token.deleteMany({
        user: user._id,
        type: "verify-email",
      });

      const verificationToken = generateVerificationToken();

      const hashedVerificationToken = hashToken(verificationToken);

      await Token.create({
        user: user._id,
        token: hashedVerificationToken,
        type: "verify-email",
        expiresAt: new Date(
          Date.now() + ms(process.env.EMAIL_VERIFICATION_TOKEN_EXPIRES),
        ),
      });

      const verificationUrl = `${process.env.APP_URL}/auth/verify-email/${verificationToken}`;

      const { subject, html, text } = getVerificationEmail(
        user.name,
        verificationUrl,
      );

      await sendEmail({
        to: user.email,
        subject,
        html,
        text,
      });

      res.clearCookie(process.env.COOKIE_ACCESS_TOKEN);

      res.clearCookie(process.env.COOKIE_REFRESH_TOKEN);

      if (req.session) {
        req.session.destroy(() => {});
      }

      await createAuditLog({
        req,
        actor: user,
        module: "Authentication",
        action: "Change Email",
        severity: "medium",
        target: {
          id: user._id,
          model: "User",
        },
        description: "Email changed successfully.",
      });

      logger.info(`Email changed : ${user.email}`);

      return res.redirect(
        `/?type=success&message=${encodeURIComponent("Email changed successfully. Please verify your new email before logging in again.")}`,
      );
    } catch (error) {
      next(error);
    }
  }

  // Delete Profile Image
  async deleteProfileImage(req, res, next) {
    try {
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.redirect(
          `/auth/profile?type=success&message=${encodeURIComponent("Profile image removed successfully.")}`,
        );
      }

      if (
        user.profileImage &&
        user.profileImage.publicId &&
        !user.profileImage.publicId.includes("default")
      ) {
        await cloudinaryImageDelete(user.profileImage.publicId);
      }

      user.profileImage = {
        url: process.env.DEFAULT_PROFILE_IMAGE_URL,
        publicId: process.env.DEFAULT_PROFILE_IMAGE_PUBLIC_ID,
      };

      await user.save();

      await createAuditLog({
        req,
        actor: user,
        module: "Authentication",
        action: "Delete Profile Image",
        severity: "info",
        target: {
          id: user._id,
          model: "User",
        },
        description: "Profile image deleted successfully.",
      });

      logger.info(`Profile image deleted : ${user.email}`);

      return res.redirect(
        `/auth/profile?type=error&message=${encodeURIComponent("User not found.")}`,
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
