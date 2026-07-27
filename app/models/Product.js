const mongoose = require("mongoose");
const slugify = require("slugify");

// Available product statuses
const PRODUCT_STATUS = ["active", "inactive", "out-of-stock"];

// Product approval statuses
const APPROVAL_STATUS = ["pending", "approved", "rejected"];

const productSchema = new mongoose.Schema(
  {
    // Product name
    name: {
      type: String,
      required: [true, "Product name is required."],
      trim: true,
      minlength: [3, "Product name must be at least 3 characters long."],
      maxlength: [150, "Product name cannot exceed 150 characters."],
    },

    // SEO-friendly URL
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Short description
    shortDescription: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },

    // Full product description
    description: {
      type: String,
      required: [true, "Product description is required."],
      trim: true,
      maxlength: [5000, "Product description cannot exceed 5000 characters."],
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

    // Product category
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    // Product brand
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },

    // Seller who created this product
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Product images
    images: {
      type: [
        {
          publicId: {
            type: String,
            required: true,
          },

          url: {
            type: String,
            required: true,
          },

          alt: {
            type: String,
            trim: true,
            default: "",
          },

          isPrimary: {
            type: Boolean,
            default: false,
          },
        },
      ],

      validate: [
        {
          validator(images) {
            return images.length >= 1 && images.length <= 5;
          },
          message: "Product must contain between 1 and 5 images.",
        },
        {
          validator(images) {
            return images.filter((image) => image.isPrimary).length === 1;
          },
          message: "Exactly one image must be marked as primary.",
        },
      ],
    },

    // Original price
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Discounted price
    discountPrice: {
      type: Number,
      default: null,
      min: 0,

      validate: {
        validator(value) {
          return value === null || value < this.price;
        },
        message: "Discount price must be less than the original price.",
      },
    },

    // Available stock
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Low stock threshold
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },

    // Stock Keeping Unit
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    // Total product views
    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Total units sold
    soldCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Average customer rating
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    // Total ratings
    totalRatings: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Total likes
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Product visibility status
    status: {
      type: String,
      enum: PRODUCT_STATUS,
      default: "active",
    },

    // Product approval status
    approvalStatus: {
      type: String,
      enum: APPROVAL_STATUS,
      default: "pending",
    },

    // Administrator who approved this product
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Approval timestamp
    approvedAt: {
      type: Date,
      default: null,
    },

    // Administrator remark
    adminRemark: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    // Number of seller resubmissions
    resubmissionCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Product publish date
    publishedAt: {
      type: Date,
      default: null,
    },

    // Featured product
    isFeatured: {
      type: Boolean,
      default: false,
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

    // Last administrator or seller who updated this product
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

// Generate slug from product name
productSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      trim: true,
    });
  }

  if (this.stock === 0) {
    this.status = "out-of-stock";
  } else if (this.status === "out-of-stock") {
    this.status = "active";
  }

  next();
});

// Check whether the product is running low on stock
productSchema.virtual("isLowStock").get(function () {
  return this.stock <= this.lowStockThreshold;
});

// Database indexes
// productSchema.index({ slug: 1 }, { unique: true });

// productSchema.index({ sku: 1 }, { unique: true });

productSchema.index({ category: 1 });

productSchema.index({ brand: 1 });

productSchema.index({ seller: 1 });

productSchema.index({ approvalStatus: 1, status: 1, isDeleted: 1 });

productSchema.index({ isFeatured: 1 });

productSchema.index({ publishedAt: -1 });

productSchema.index({ price: 1 });

productSchema.index({
  name: "text",
  description: "text",
});

module.exports = mongoose.model("Product", productSchema);
