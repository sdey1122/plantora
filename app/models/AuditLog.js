const mongoose = require("mongoose");

// Supported user roles
const USER_ROLES = ["admin", "customer"];

// Application modules
const MODULES = [
  "Authentication",
  "Users",
  "Seller",
  "Products",
  "Categories",
  "Brands",
  "Cart",
  "Wishlist",
  "Orders",
  "Payments",
  "Coupons",
  "Reviews",
  "Address",
  "Notifications",
  "Banner",
  "Settings",
];

// Supported actions
const ACTIONS = [
  "REGISTER",
  "LOGIN",
  "LOGOUT",
  "VERIFY_EMAIL",
  "RESEND_VERIFICATION",
  "FORGOT_PASSWORD",
  "RESET_PASSWORD",
  "CHANGE_EMAIL",
  "CHANGE_PASSWORD",
  "REQUEST_SELLER",
  "APPROVE_SELLER",
  "REJECT_SELLER",
  "CREATE",
  "UPDATE",
  "DELETE",
  "RESTORE",
  "HARD_DELETE",
  "BLOCK",
  "UNBLOCK",
  "APPROVE_PRODUCT",
  "REJECT_PRODUCT",
  "PAYMENT",
  "ORDER",
];

// Severity levels
const SEVERITY_LEVELS = ["info", "warning", "error", "critical"];

// Information about the user who performed the action
const actorSchema = new mongoose.Schema(
  {
    // Reference to the user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // User name
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // User email
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // User role
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
    },
  },
  {
    _id: false,
  },
);

// Information about the affected document
const targetSchema = new mongoose.Schema(
  {
    // Model name
    model: {
      type: String,
      required: true,
      trim: true,
    },

    // Document ID
    id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // Human-readable name
    name: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  },
);

// Request information
const requestSchema = new mongoose.Schema(
  {
    // IP Address
    ipAddress: {
      type: String,
      default: "",
      trim: true,
    },

    // HTTP Method
    method: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    // API Path
    path: {
      type: String,
      default: "",
      trim: true,
    },

    // Browser
    browser: {
      type: String,
      default: "",
      trim: true,
    },

    // Operating System
    operatingSystem: {
      type: String,
      default: "",
      trim: true,
    },

    // Device
    device: {
      type: String,
      default: "",
      trim: true,
    },

    // User Agent
    userAgent: {
      type: String,
      default: "",
      trim: true,
    },

    // Response Status Code
    statusCode: {
      type: Number,
      default: null,
      min: 100,
      max: 599,
    },

    // Response Time (ms)
    responseTime: {
      type: Number,
      default: null,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const auditLogSchema = new mongoose.Schema(
  {
    // User who performed the action
    actor: actorSchema,

    // Module
    module: {
      type: String,
      enum: MODULES,
      required: true,
    },

    // Action
    action: {
      type: String,
      enum: ACTIONS,
      required: true,
    },

    // Severity
    severity: {
      type: String,
      enum: SEVERITY_LEVELS,
      default: "info",
    },

    // Whether the action succeeded
    success: {
      type: Boolean,
      default: true,
    },

    // Target document
    target: targetSchema,

    // Description
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    // Optional reason
    reason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    // Error message
    errorMessage: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    // Additional information
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Request information
    request: requestSchema,
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },

    versionKey: false,

    minimize: false,

    toJSON: {
      virtuals: true,
    },

    toObject: {
      virtuals: true,
    },
  },
);

// Database indexes
auditLogSchema.index({ "actor.user": 1 });

auditLogSchema.index({ "actor.email": 1 });

auditLogSchema.index({ "actor.role": 1 });

auditLogSchema.index({ module: 1 });

auditLogSchema.index({ action: 1 });

auditLogSchema.index({ severity: 1 });

auditLogSchema.index({ success: 1 });

auditLogSchema.index({
  "target.model": 1,
  "target.id": 1,
});

auditLogSchema.index({
  createdAt: -1,
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
