const mongoose = require("mongoose");

// Available coupon statuses
const COUPON_STATUS = ["active", "inactive"];

// Available discount types
const DISCOUNT_TYPES = ["percentage", "fixed"];

const couponSchema = new mongoose.Schema(
  {
    // Coupon code
    code: {
      type: String,
      required: [true, "Coupon code is required."],
      unique: true,
      trim: true,
      uppercase: true,
    },

    // Coupon description
    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters."],
      default: "",
    },

    // Discount type
    discountType: {
      type: String,
      enum: DISCOUNT_TYPES,
      required: [true, "Discount type is required."],
    },

    // Discount value
    discountValue: {
      type: Number,
      required: [true, "Discount value is required."],
      min: 0,

      validate: {
        validator(value) {
          if (this.discountType === "percentage") {
            return value <= 100;
          }

          return true;
        },
        message: "Percentage discount cannot exceed 100%.",
      },
    },

    // Minimum order amount
    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Maximum discount amount
    maximumDiscountAmount: {
      type: Number,
      default: null,
      min: 0,
    },

    // Total usage limit
    usageLimit: {
      type: Number,
      required: [true, "Usage limit is required."],
      min: 1,
    },

    // Maximum usage per customer
    maximumUsagePerUser: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Total successful usages
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Publicly available coupon
    isPublic: {
      type: Boolean,
      default: true,
    },

    // Coupon start date
    validFrom: {
      type: Date,
      required: [true, "Coupon start date is required."],
    },

    // Coupon expiry date
    validUntil: {
      type: Date,
      required: [true, "Coupon expiry date is required."],
    },

    // Coupon status
    status: {
      type: String,
      enum: COUPON_STATUS,
      default: "active",
    },

    // Soft delete status
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // Soft delete timestamp
    deletedAt: {
      type: Date,
      default: null,
    },

    // Administrator who created this coupon
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Administrator who last updated this coupon
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
  },
);

// Database indexes
// couponSchema.index({ code: 1 }, { unique: true });

couponSchema.index({ status: 1, isDeleted: 1 });

couponSchema.index({ validUntil: 1 });

module.exports = mongoose.model("Coupon", couponSchema);
