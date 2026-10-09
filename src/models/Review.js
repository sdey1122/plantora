const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    // ==========================================================
    // USER
    // ==========================================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ==========================================================
    // PRODUCT
    // ==========================================================

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // ==========================================================
    // RATING
    // ==========================================================

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // ==========================================================
    // REVIEW TITLE
    // ==========================================================

    reviewTitle: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },

    // ==========================================================
    // COMMENT
    // ==========================================================

    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    // ==========================================================
    // DELETED
    // ==========================================================

    isDeleted: {
      type: Boolean,
      default: false,
    },

    // ==========================================================
    // STATUS
    // ==========================================================

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },

    // ==========================================================
    // ADMIN REMARK
    // ==========================================================

    adminRemark: {
      type: String,
      trim: true,
      default: "",
    },

    // ==========================================================
    // VERIFIED PURCHASE
    // ==========================================================

    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },

    // ==========================================================
    // HELPFUL COUNT
    // ==========================================================

    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ==========================================================
    // REVIEW IMAGES
    // ==========================================================

    images: [
      {
        url: {
          type: String,
          trim: true,
        },

        alt: {
          type: String,
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// ==========================================================
// ONE USER = ONE REVIEW PER PRODUCT
// ==========================================================

reviewSchema.index(
  {
    user: 1,
    product: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("Review", reviewSchema);
