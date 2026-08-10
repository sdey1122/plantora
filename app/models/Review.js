const mongoose = require("mongoose");

const REVIEW_STATUS = ["pending", "approved", "rejected"];

// ==========================================================
// REVIEW IMAGE
// ==========================================================

const reviewImageSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true,
    },

    url: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
  },
);

// ==========================================================
// REVIEW SCHEMA
// ==========================================================

const reviewSchema = new mongoose.Schema(
  {
    // Customer / seller who wrote the review
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Product being reviewed
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // Rating
    rating: {
      type: Number,
      required: [true, "Rating is required."],
      min: 1,
      max: 5,
    },

    // Review title
    reviewTitle: {
      type: String,
      trim: true,
      maxlength: [120, "Review title cannot exceed 120 characters."],
      default: "",
    },

    // Review comment
    comment: {
      type: String,
      required: [true, "Review comment is required."],
      trim: true,
      maxlength: [2000, "Review comment cannot exceed 2000 characters."],
    },

    // Review images
    images: {
      type: [reviewImageSchema],

      validate: {
        validator(images) {
          return images.length <= 5;
        },
        message: "Maximum 5 review images are allowed.",
      },

      default: [],
    },

    // Verified purchase
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },

    // Review status
    status: {
      type: String,
      enum: REVIEW_STATUS,
      default: "approved",
    },

    // Admin remark
    adminRemark: {
      type: String,
      trim: true,
      maxlength: [500, "Administrator remark cannot exceed 500 characters."],
      default: "",
    },

    // Helpful votes
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
  },
);

// ==========================================================
// ONE REVIEW PER USER PER PRODUCT
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

// ==========================================================
// PRODUCT REVIEW QUERY
// ==========================================================

reviewSchema.index({
  product: 1,
  status: 1,
});

reviewSchema.index({
  user: 1,
});

module.exports = mongoose.model("Review", reviewSchema);
