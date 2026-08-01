const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const USER_ROLES = ["admin", "customer"];

const USER_STATUS = ["inactive", "active", "blocked"];

const SELLER_STATUS = ["none", "pending", "approved", "rejected"];

const userSchema = new mongoose.Schema(
  {
    // Basic Information
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

    password: {
      type: String,
      required: [true, "Password is required."],
      select: false,
    },

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

    // Bio
    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Bio cannot exceed 500 characters."],
      default: "",
    },

    // Role & Status
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

    // Seller Information
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

    // Terms & Conditions
    termsAccepted: {
      type: Boolean,
      default: false,
    },

    termsAcceptedAt: {
      type: Date,
      default: null,
    },

    // Login Security
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

    // Activity
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

    // Soft Delete
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

// Indexes
userSchema.index({ role: 1 });

userSchema.index({ status: 1 });

userSchema.index({ "seller.status": 1 });

userSchema.index({ isDeleted: 1 });

// Virtuals
userSchema.virtual("isSeller").get(function () {
  return this.seller?.status === "approved";
});

userSchema.virtual("isLocked").get(function () {
  return this.accountLockedUntil && this.accountLockedUntil > new Date();
});

// Password Hashing
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordChangedAt = new Date();
});

// Compare Password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// JSON Settings
userSchema.set("toJSON", {
  virtuals: true,
});

userSchema.set("toObject", {
  virtuals: true,
});

module.exports = mongoose.model("User", userSchema);
