const mongoose = require("mongoose");

// Available banner statuses
const BANNER_STATUS = ["active", "inactive"];

const bannerSchema = new mongoose.Schema(
  {
    // Banner title
    title: {
      type: String,
      required: [true, "Banner title is required."],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters."],
    },

    // Short banner description
    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters."],
      default: "",
    },

    // Banner image
    image: {
      publicId: {
        type: String,
        default: null,
      },

      url: {
        type: String,
        required: [true, "Banner image is required."],
      },
    },

    // Button text
    buttonText: {
      type: String,
      trim: true,
      maxlength: [50, "Button text cannot exceed 50 characters."],
      default: "",
    },

    // Redirect URL
    redirectUrl: {
      type: String,
      trim: true,
      default: "",
      match: [/^(https?:\/\/|\/).*/i, "Please enter a valid redirect URL."],
    },

    // Display priority
    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Banner status
    status: {
      type: String,
      enum: BANNER_STATUS,
      default: "active",
    },

    // Banner start date
    startDate: {
      type: Date,
      default: null,
    },

    // Banner end date
    endDate: {
      type: Date,
      default: null,
    },

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    // Admin who created the banner
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Admin who last updated the banner
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
bannerSchema.index({
  status: 1,
  isDeleted: 1,
});

bannerSchema.index({
  displayOrder: 1,
});

bannerSchema.index({
  startDate: 1,
  endDate: 1,
});

module.exports = mongoose.model("Banner", bannerSchema);
