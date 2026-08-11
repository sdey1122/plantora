const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const USER_ROLES = ["admin", "customer"];

const USER_STATUS = ["inactive", "active", "blocked"];

const SELLER_STATUS = ["none", "pending", "approved", "rejected"];

const AUTH_PROVIDERS = ["local", "google"];

const userSchema = new mongoose.Schema(
  {
    // ==========================================================
    // BASIC INFORMATION
    // ==========================================================

    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      minlength: [3, "Name must be at least 3 characters long."],
      maxlength: [32, "Name cannot exceed 32 characters."],
    },

    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address."],
    },

    // ==========================================================
    // AUTHENTICATION PROVIDER
    // ==========================================================

    authProvider: {
      type: String,
      enum: AUTH_PROVIDERS,
      default: "local",
    },

    // ==========================================================
    // GOOGLE AUTHENTICATION
    // ==========================================================

    googleId: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
    },

    // ==========================================================
    // PASSWORD
    // ==========================================================

    /*
     * Local accounts require a password.
     *
     * Google accounts do NOT require a password because
     * authentication is handled by Google.
     */

    password: {
      type: String,

      required: function () {
        return this.authProvider === "local";
      },

      select: false,
    },

    // ==========================================================
    // PROFILE IMAGE
    // ==========================================================

    profileImage: {
      publicId: {
        type: String,
        default: "/public/default/profile.png",
      },

      url: {
        type: String,
        default: process.env.DEFAULT_PROFILE_IMAGE_URL,
      },
    },

    // ==========================================================
    // BIO
    // ==========================================================

    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Bio cannot exceed 500 characters."],
      default: "",
    },

    // ==========================================================
    // ROLE & STATUS
    // ==========================================================

    role: {
      type: String,
      enum: USER_ROLES,
      default: "customer",
    },

    status: {
      type: String,
      enum: USER_STATUS,
      default: "inactive",
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // ==========================================================
    // SELLER INFORMATION
    // ==========================================================

    seller: {
      status: {
        type: String,
        enum: SELLER_STATUS,
        default: "none",
      },

      requestedAt: {
        type: Date,
        default: null,
      },

      approvedAt: {
        type: Date,
        default: null,
      },

      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      adminRemark: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // ==========================================================
    // TERMS & CONDITIONS
    // ==========================================================

    termsAccepted: {
      type: Boolean,
      default: false,
    },

    termsAcceptedAt: {
      type: Date,
      default: null,
    },

    // ==========================================================
    // LOGIN SECURITY
    // ==========================================================

    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    accountLockedUntil: {
      type: Date,
      default: null,
    },

    lockReason: {
      type: String,
      trim: true,
      default: "",
    },

    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ==========================================================
    // ACTIVITY
    // ==========================================================

    lastLogin: {
      type: Date,
      default: null,
    },

    lastActive: {
      type: Date,
      default: null,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    emailChangedAt: {
      type: Date,
      default: null,
    },

    // ==========================================================
    // SOFT DELETE
    // ==========================================================

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ============================================================
// INDEXES
// ============================================================

userSchema.index({ role: 1 });

userSchema.index({ status: 1 });

userSchema.index({ "seller.status": 1 });

userSchema.index({ isDeleted: 1 });

userSchema.index({ authProvider: 1 });

/*
 * googleId already has:
 *
 * unique: true
 * sparse: true
 *
 * so MongoDB will create the appropriate unique sparse index.
 */

// ============================================================
// VIRTUALS
// ============================================================

userSchema.virtual("isSeller").get(function () {
  return this.seller?.status === "approved";
});

userSchema.virtual("isLocked").get(function () {
  return this.accountLockedUntil && this.accountLockedUntil > new Date();
});

// ============================================================
// PASSWORD HASHING
// ============================================================

userSchema.pre("save", async function () {
  /*
   * Google accounts don't have a password.
   */

  if (this.authProvider === "google") {
    return;
  }

  /*
   * Only hash when password has actually changed.
   */

  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordChangedAt = new Date();
});

// ============================================================
// COMPARE PASSWORD
// ============================================================

userSchema.methods.comparePassword = async function (enteredPassword) {
  /*
   * Google accounts don't have a Plantora password.
   */

  if (this.authProvider === "google" || !this.password) {
    return false;
  }

  return bcrypt.compare(enteredPassword, this.password);
};

// ============================================================
// JSON SETTINGS
// ============================================================

userSchema.set("toJSON", {
  virtuals: true,
});

userSchema.set("toObject", {
  virtuals: true,
});

// ============================================================
// EXPORT
// ============================================================

module.exports = mongoose.model("User", userSchema);
