const mongoose = require("mongoose");

// Individual cart item
const cartItemSchema = new mongoose.Schema(
  {
    // Product added to the cart
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // Quantity selected by the customer
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    // Include this item during checkout
    isSelected: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  },
);

const cartSchema = new mongoose.Schema(
  {
    // Cart owner
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Products added to the cart
    items: [cartItemSchema],
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
  },
);

// Database indexes
// cartSchema.index({
//   user: 1,
// });

module.exports = mongoose.model("Cart", cartSchema);
