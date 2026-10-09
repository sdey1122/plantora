const mongoose = require("mongoose");

const reviewHelpfulSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// One helpful vote per user
reviewHelpfulSchema.index(
  {
    user: 1,
    review: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("ReviewHelpful", reviewHelpfulSchema);
