const mongoose = require("mongoose");

// Available address types
const ADDRESS_TYPES = ["home", "office", "other"];

const addressSchema = new mongoose.Schema(
  {
    // User who owns this address
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Recipient's full name
    fullName: {
      type: String,
      required: [true, "Full name is required."],
      trim: true,
      minlength: [3, "Full name must be at least 3 characters long."],
      maxlength: [100, "Full name cannot exceed 100 characters."],
    },

    // International dialing code
    countryCode: {
      type: String,
      trim: true,
      default: "+91",
    },

    // Contact number
    phone: {
      type: String,
      required: [true, "Phone number is required."],
      trim: true,
    },

    // Alternate Phone Number
    alternatePhone: {
      type: String,
      trim: true,
      default: "",
    },

    // House, flat or building number
    addressLine1: {
      type: String,
      required: [true, "Address Line 1 is required."],
      trim: true,
      maxlength: [200, "Address Line 1 cannot exceed 200 characters."],
    },

    // Apartment, floor etc.
    addressLine2: {
      type: String,
      trim: true,
      maxlength: [200, "Address Line 2 cannot exceed 200 characters."],
      default: "",
    },

    // Area/Locality
    area: {
      type: String,
      trim: true,
      maxlength: [100, "Area cannot exceed 100 characters."],
      default: "",
    },

    // Nearby landmark
    landmark: {
      type: String,
      trim: true,
      maxlength: [100, "Landmark cannot exceed 100 characters."],
      default: "",
    },

    // City
    city: {
      type: String,
      required: [true, "City is required."],
      trim: true,
      maxlength: [100, "City cannot exceed 100 characters."],
    },

    // State
    state: {
      type: String,
      required: [true, "State is required."],
      trim: true,
      maxlength: [100, "State cannot exceed 100 characters."],
    },

    // Postal code
    postalCode: {
      type: String,
      required: [true, "Postal code is required."],
      trim: true,
    },

    // Country
    country: {
      type: String,
      required: [true, "Country is required."],
      trim: true,
      maxlength: [100, "Country cannot exceed 100 characters."],
      default: "India",
    },

    // Address type
    addressType: {
      type: String,
      enum: ADDRESS_TYPES,
      default: "home",
    },

    // Default delivery address
    isDefault: {
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
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
  },
);

// Database indexes
addressSchema.index({ user: 1 });

addressSchema.index({ user: 1, isDefault: 1 });

addressSchema.index({ postalCode: 1 });

module.exports = mongoose.model("Address", addressSchema);
