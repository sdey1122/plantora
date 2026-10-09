const Joi = require("joi");

const {
  validationOptions,
  objectId,
  description,
} = require("./commonValidation");

// Available payment methods
const PAYMENT_METHODS = ["razorpay"];

// Payment ID
const paymentIdValidation = Joi.object({
  paymentId: objectId.required().messages({
    "any.required": "Payment ID is required.",
  }),
})
  .strict()
  .options(validationOptions);

// Create payment order
const createPaymentValidation = Joi.object({
  orderId: objectId.required().messages({
    "any.required": "Order ID is required.",
  }),

  paymentMethod: Joi.string()
    .valid(...PAYMENT_METHODS)
    .required()
    .messages({
      "any.required": "Payment method is required.",
    }),
})
  .strict()
  .options(validationOptions);

// Verify Razorpay payment
const verifyPaymentValidation = Joi.object({
  razorpayOrderId: Joi.string().trim().required().messages({
    "any.required": "Razorpay order ID is required.",
    "string.empty": "Razorpay order ID is required.",
  }),

  razorpayPaymentId: Joi.string().trim().required().messages({
    "any.required": "Razorpay payment ID is required.",
    "string.empty": "Razorpay payment ID is required.",
  }),

  razorpaySignature: Joi.string().trim().required().messages({
    "any.required": "Razorpay signature is required.",
    "string.empty": "Razorpay signature is required.",
  }),
})
  .strict()
  .options(validationOptions);

// Refund payment
const refundPaymentValidation = Joi.object({
  reason: description.required().messages({
    "any.required": "Refund reason is required.",
  }),
})
  .strict()
  .options(validationOptions);

// Payment query
const paymentQueryValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  search: Joi.string().trim().max(100).allow(""),

  paymentMethod: Joi.string().valid(...PAYMENT_METHODS),

  paymentStatus: Joi.string().valid(
    "pending",
    "paid",
    "failed",
    "cancelled",
    "refunded",
  ),

  sortBy: Joi.string()
    .valid("createdAt", "amount", "paidAt")
    .default("createdAt"),

  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
})
  .strict()
  .options(validationOptions);

module.exports = {
  paymentIdValidation,
  createPaymentValidation,
  verifyPaymentValidation,
  refundPaymentValidation,
  paymentQueryValidation,
};
