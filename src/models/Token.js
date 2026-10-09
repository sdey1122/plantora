const mongoose = require("mongoose");

const TOKEN_TYPES = [
  "verify-email",
  "change-email",
  "reset-password",
  "refresh-token",
];

const tokenSchema = new mongoose.Schema(
  {
    // User reference
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required."],
    },

    // SHA-256 hashed token
    token: {
      type: String,
      required: [true, "Token is required."],
      unique: true,
      select: false,
    },

    // Token purpose
    type: {
      type: String,
      enum: TOKEN_TYPES,
      required: [true, "Token type is required."],
    },

    // Expiration time
    expiresAt: {
      type: Date,
      required: [true, "Expiration date is required."],
    },

    // Token usage status
    isUsed: {
      type: Boolean,
      default: false,
    },

    // Token usage time
    usedAt: {
      type: Date,
      default: null,
    },

    // Device information
    deviceInfo: {
      type: String,
      trim: true,
      default: "",
    },

    // IP address
    ipAddress: {
      type: String,
      trim: true,
      default: "",
    },

    // Browser / Device
    userAgent: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Database indexes
tokenSchema.index({ user: 1 });

// tokenSchema.index({ token: 1 }, { unique: true });

tokenSchema.index({ type: 1 });

tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual
tokenSchema.virtual("isExpired").get(function () {
  return this.expiresAt < new Date();
});

// JSON settings
tokenSchema.set("toJSON", {
  virtuals: true,
});

module.exports = mongoose.model("Token", tokenSchema);
