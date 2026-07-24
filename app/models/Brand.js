const mongoose = require("mongoose");
const slugify = require("slugify");

// Available brand statuses
const BRAND_STATUS = ["active", "inactive"];

const brandSchema = new mongoose.Schema(
  {
    // Brand name
    name: {
      type: String,
      required: [true, "Brand name is required."],
      unique: true,
      trim: true,
      minlength: [2, "Brand name must be at least 2 characters long."],
      maxlength: [50, "Brand name cannot exceed 50 characters."],
    },

    // SEO-friendly URL
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Short description
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },

    // SEO meta title
    metaTitle: {
      type: String,
      trim: true,
      maxlength: 70,
      default: "",
    },

    // SEO meta description
    metaDescription: {
      type: String,
      trim: true,
      maxlength: 160,
      default: "",
    },

    // Brand logo
    logo: {
      publicId: {
        type: String,
        default: null,
      },

      url: {
        type: String,
        default: null,
      },
    },

    // Official website
    website: {
      type: String,
      trim: true,
      default: "",
      match: [/^https?:\/\/.+/i, "Please enter a valid website URL."],
    },

    // Brand visibility status
    status: {
      type: String,
      enum: BRAND_STATUS,
      default: "active",
    },

    // Show brand in featured sections
    isFeatured: {
      type: Boolean,
      default: false,
    },

    // Display order on frontend
    displayOrder: {
      type: Number,
      default: 0,
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

    // Administrator who created this brand
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Administrator who last updated this brand
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

// Generate slug from brand name
brandSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      trim: true,
    });
  }

  next();
});

// Database indexes
brandSchema.index({ name: 1 }, { unique: true });

brandSchema.index({ slug: 1 }, { unique: true });

brandSchema.index({ status: 1, isDeleted: 1 });

brandSchema.index({
  name: "text",
  description: "text",
});

module.exports = mongoose.model("Brand", brandSchema);
