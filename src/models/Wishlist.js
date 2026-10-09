const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    // Customer who saved the product
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Saved product
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Database indexes
wishlistSchema.index(
  {
    user: 1,
    product: 1,
  },
  {
    unique: true,
  },
);

wishlistSchema.index({
  user: 1,
});

wishlistSchema.index({
  product: 1,
});

module.exports = mongoose.model("Wishlist", wishlistSchema);
