const Joi = require("joi");

const createReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required().messages({
    "number.base": "Rating must be a number",
    "number.integer": "Rating must be an integer",
    "number.min": "Rating must be between 1 and 5",
    "number.max": "Rating must be between 1 and 5",
    "any.required": "Rating is required",
  }),

  title: Joi.string().trim().max(100).allow("").optional().messages({
    "string.max": "Review title cannot exceed 100 characters",
  }),

  comment: Joi.string().trim().min(3).max(1000).required().messages({
    "string.empty": "Review comment is required",
    "string.min": "Review comment must be at least 3 characters",
    "string.max": "Review comment cannot exceed 1000 characters",
    "any.required": "Review comment is required",
  }),
});

const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required().messages({
    "number.base": "Rating must be a number",
    "number.integer": "Rating must be an integer",
    "number.min": "Rating must be between 1 and 5",
    "number.max": "Rating must be between 1 and 5",
    "any.required": "Rating is required",
  }),

  title: Joi.string().trim().max(100).allow("").optional().messages({
    "string.max": "Review title cannot exceed 100 characters",
  }),

  comment: Joi.string().trim().min(3).max(1000).required().messages({
    "string.empty": "Review comment is required",
    "string.min": "Review comment must be at least 3 characters",
    "string.max": "Review comment cannot exceed 1000 characters",
    "any.required": "Review comment is required",
  }),
});

module.exports = {
  createReviewSchema,
  updateReviewSchema,
};
