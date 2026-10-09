const mongoose = require("mongoose");

// Available notification types
const NOTIFICATION_TYPES = [
  "system",
  "order",
  "payment",
  "product",
  "seller",
  "review",
];

// Related document types
const REFERENCE_TYPES = ["Order", "Product", "Review", "Payment", "User"];

const notificationSchema = new mongoose.Schema(
  {
    // User receiving this notification
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required."],
    },

    // User who triggered the notification
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Notification title
    title: {
      type: String,
      required: [true, "Notification title is required."],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters."],
    },

    // Notification message
    message: {
      type: String,
      required: [true, "Notification message is required."],
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters."],
    },

    // Notification category
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: [true, "Notification type is required."],
    },

    // Related document type
    referenceType: {
      type: String,
      enum: REFERENCE_TYPES,
      default: null,
    },

    // Related document ID
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // Redirect URL
    actionUrl: {
      type: String,
      trim: true,
      default: "",
    },

    // Read status
    isRead: {
      type: Boolean,
      default: false,
    },

    // Notification read time
    readAt: {
      type: Date,
      default: null,
    },

    // Soft delete status
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // Soft delete time
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
notificationSchema.index({
  recipient: 1,
  isRead: 1,
});

notificationSchema.index({
  recipient: 1,
  isDeleted: 1,
});

notificationSchema.index({
  recipient: 1,
  createdAt: -1,
});

notificationSchema.index({
  type: 1,
});

module.exports = mongoose.model("Notification", notificationSchema);
