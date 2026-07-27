const mongoose = require("mongoose");

// Available order statuses
const ORDER_STATUS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out-for-delivery",
  "delivered",
  "cancelled",
  "returned",
];

// Available payment statuses
const PAYMENT_STATUS = ["pending", "paid", "failed", "refunded"];

// Available payment methods
const PAYMENT_METHOD = ["razorpay"];

// Purchased product snapshot
const orderItemSchema = new mongoose.Schema(
  {
    // Original product
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // Seller who owns this product
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Product name at the time of purchase
    productName: {
      type: String,
      required: true,
      trim: true,
    },

    // Product SKU
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    // Product image at the time of purchase
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

    // Purchased quantity
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    // Original product price
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // Discounted product price
    discountPrice: {
      type: Number,
      default: null,
      min: 0,
    },

    // Final price paid per unit
    finalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

// Shipping address snapshot
const shippingAddressSchema = new mongoose.Schema(
  {
    // Recipient's full name
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    // Country code
    countryCode: {
      type: String,
      required: true,
      trim: true,
    },

    // Contact number
    phone: {
      type: String,
      required: true,
      trim: true,
    },

    // Primary address
    addressLine1: {
      type: String,
      required: true,
      trim: true,
    },

    // Secondary address
    addressLine2: {
      type: String,
      default: "",
      trim: true,
    },

    // Landmark
    landmark: {
      type: String,
      default: "",
      trim: true,
    },

    // City
    city: {
      type: String,
      required: true,
      trim: true,
    },

    // State
    state: {
      type: String,
      required: true,
      trim: true,
    },

    // Postal code
    postalCode: {
      type: String,
      required: true,
      trim: true,
    },

    // Country
    country: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const orderSchema = new mongoose.Schema(
  {
    // Unique order number
    orderNumber: {
      type: String,
      required: [true, "Order number is required."],
      unique: true,
      trim: true,
      uppercase: true,
    },

    // Customer who placed the order
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Shipping address snapshot
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    // Purchased products
    items: {
      type: [orderItemSchema],
      validate: {
        validator(items) {
          return items.length > 0;
        },
        message: "Order must contain at least one product.",
      },
    },

    // Total price before discounts
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    // Coupon discount
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Delivery charge
    shippingCharge: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Tax amount
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Final payable amount
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Applied coupon
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },

    // Applied coupon code
    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    // Payment record
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    // Payment method
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHOD,
      default: "razorpay",
    },

    // Razorpay order ID
    razorpayOrderId: {
      type: String,
      default: null,
      trim: true,
    },

    // Order status
    orderStatus: {
      type: String,
      enum: ORDER_STATUS,
      default: "pending",
    },

    // Payment status
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUS,
      default: "pending",
    },

    // Customer delivery instructions
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters."],
      default: "",
    },

    // Cancellation reason
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, "Cancellation reason cannot exceed 500 characters."],
      default: "",
    },

    // Cancellation timestamp
    cancelledAt: {
      type: Date,
      default: null,
    },

    // Delivery timestamp
    deliveredAt: {
      type: Date,
      default: null,
    },

    // Return timestamp
    returnedAt: {
      type: Date,
      default: null,
    },

    // Refund timestamp
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
// orderSchema.index({ orderNumber: 1 }, { unique: true });

orderSchema.index({ user: 1 });

orderSchema.index({ user: 1, orderStatus: 1 });

orderSchema.index({ paymentStatus: 1, orderStatus: 1 });

module.exports = mongoose.model("Order", orderSchema);
