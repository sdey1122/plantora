const mongoose = require("mongoose");

// Available review statuses
const REVIEW_STATUS = ["pending", "approved", "rejected"];

// Review image
const reviewImageSchema = new mongoose.Schema(
  {
    // Cloudinary public ID
    publicId: {
      type: String,
      required: true,
    },

    // Cloudinary image URL
    url: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const reviewSchema = new mongoose.Schema(
  {
    // Customer who wrote the review
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Reviewed product
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // Star rating
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

    // Review description
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
    },

    // Verified purchase
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },

    // Review approval status
    status: {
      type: String,
      enum: REVIEW_STATUS,
      default: "approved",
    },

    // Administrator remark
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
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
  },
);

// Database indexes
reviewSchema.index(
  {
    user: 1,
    product: 1,
  },
  {
    unique: true,
  },
);

reviewSchema.index({
  product: 1,
  status: 1,
  isDeleted: 1,
});

reviewSchema.index({
  user: 1,
});

module.exports = mongoose.model("Review", reviewSchema);
