const mongoose = require("mongoose");

// Available payment methods
const PAYMENT_METHODS = ["razorpay"];

// Available payment gateways
const PAYMENT_GATEWAYS = ["razorpay"];

// Available payment statuses
const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "cancelled",
  "refunded",
  "partially-refunded",
];

// Refund details
const refundSchema = new mongoose.Schema(
  {
    // Gateway refund ID
    refundId: {
      type: String,
      default: null,
      trim: true,
    },

    // Refunded amount
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Refund reason
    reason: {
      type: String,
      trim: true,
      maxlength: [500, "Refund reason cannot exceed 500 characters."],
      default: "",
    },

    // Refund completion date
    refundedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  },
);

const paymentSchema = new mongoose.Schema(
  {
    // Associated order
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order is required."],
      unique: true,
    },

    // Customer who made the payment
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required."],
    },

    // Total paid amount
    amount: {
      type: Number,
      required: [true, "Payment amount is required."],
      min: 0,
    },

    // Payment currency
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },

    // Payment method
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: "razorpay",
    },

    // Payment gateway
    paymentGateway: {
      type: String,
      enum: PAYMENT_GATEWAYS,
      default: "razorpay",
    },

    gatewayOrderId: {
      type: String,
      default: "",
    },

    gatewayPaymentId: {
      type: String,
      default: "",
    },

    gatewaySignature: {
      type: String,
      default: "",
    },

    paymentStatus: {
      type: String,

      enum: ["pending", "paid", "failed", "refunded"],

      default: "pending",
    },

    // Payment failure reason
    failureReason: {
      type: String,
      trim: true,
      maxlength: [500, "Failure reason cannot exceed 500 characters."],
      default: "",
    },

    // Complete gateway response
    gatewayPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Refund details
    refund: {
      type: refundSchema,
      default: () => ({}),
    },

    // Payment successful time
    paidAt: {
      type: Date,
      default: null,
    },

    // Payment failed time
    failedAt: {
      type: Date,
      default: null,
    },

    // Payment cancelled time
    cancelledAt: {
      type: Date,
      default: null,
    },

    // Payment refunded time
    refundedAt: {
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
// paymentSchema.index({ order: 1 }, { unique: true });

paymentSchema.index({ user: 1 });

paymentSchema.index({ paymentStatus: 1 });

paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
