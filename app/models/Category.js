const mongoose = require("mongoose");
const slugify = require("slugify");

// Available category statuses
const CATEGORY_STATUS = ["active", "inactive"];

const categorySchema = new mongoose.Schema(
  {
    // Category name
    name: {
      type: String,
      required: [true, "Category name is required."],
      unique: true,
      trim: true,
      minlength: [3, "Category name must be at least 3 characters long."],
      maxlength: [50, "Category name cannot exceed 50 characters."],
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

    // Category image
    image: {
      publicId: {
        type: String,
        default: null,
      },

      url: {
        type: String,
        default: null,
      },
    },

    // Category visibility status
    status: {
      type: String,
      enum: CATEGORY_STATUS,
      default: "active",
    },

    // Show category on featured sections
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

    // Administrator who created this category
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Administrator who last updated this category
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

// Generate slug from category name
categorySchema.pre("save", function (next) {
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
categorySchema.index({ name: 1 }, { unique: true });

categorySchema.index({ slug: 1 }, { unique: true });

categorySchema.index({ status: 1, isDeleted: 1 });

module.exports = mongoose.model("Category", categorySchema);
