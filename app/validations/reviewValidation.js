const Joi = require("joi");

const {
  validationOptions,
  objectId,
  description,
} = require("./commonValidation");

// Available review statuses
const REVIEW_STATUS = ["pending", "approved", "rejected"];

// Review image
const reviewImage = Joi.object({
  publicId: Joi.string().required().messages({
    "any.required": "Image public ID is required.",
    "string.empty": "Image public ID is required.",
  }),

  url: Joi.string().uri().required().messages({
    "any.required": "Image URL is required.",
    "string.uri": "Image URL must be valid.",
  }),
});

// Review images
const reviewImages = Joi.array().items(reviewImage).max(5).messages({
  "array.max": "Maximum 5 review images are allowed.",
});

// Create review
const createReviewValidation = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required().messages({
    "any.required": "Rating is required.",
    "number.min": "Rating must be at least 1.",
    "number.max": "Rating cannot be greater than 5.",
  }),

  reviewTitle: Joi.string().trim().max(120).required().messages({
    "any.required": "Review title is required.",
    "string.empty": "Review title is required.",
    "string.max": "Review title cannot exceed 120 characters.",
  }),

  comment: description.required().messages({
    "any.required": "Review comment is required.",
  }),

  images: reviewImages.default([]),
})
  .strict()
  .options(validationOptions);

// Update review
const updateReviewValidation = Joi.object({
  rating: Joi.number().integer().min(1).max(5),

  reviewTitle: Joi.string().trim().max(120),

  comment: description,

  images: reviewImages,
})
  .min(1)
  .strict()
  .options(validationOptions);

// Review ID
const reviewIdValidation = Joi.object({
  reviewId: objectId.required().messages({
    "any.required": "Review ID is required.",
  }),
})
  .strict()
  .options(validationOptions);

const helpfulReviewValidation = Joi.object({
  reviewId: objectId.required().messages({
    "any.required": "Review ID is required.",
  }),
})
  .strict()
  .options(validationOptions);

// Review query
const reviewQueryValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  search: Joi.string().trim().max(100).allow(""),

  rating: Joi.number().integer().min(1).max(5),

  status: Joi.string().valid(...REVIEW_STATUS),

  verifiedPurchase: Joi.boolean(),

  sortBy: Joi.string()
    .valid("rating", "helpfulCount", "createdAt", "updatedAt")
    .default("createdAt"),

  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
})
  .strict()
  .options(validationOptions);

// Review status
const reviewStatusValidation = Joi.object({
  status: Joi.string()
    .valid(...REVIEW_STATUS)
    .required()
    .messages({
      "any.required": "Review status is required.",
    }),

  adminRemark: Joi.string().trim().max(500).allow(""),
})
  .strict()
  .options(validationOptions);

module.exports = {
  createReviewValidation,
  updateReviewValidation,
  reviewIdValidation,
  reviewQueryValidation,
  reviewStatusValidation,
};
