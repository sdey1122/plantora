const Joi = require("joi");

const {
  validationOptions,
  objectId,
  description,
  positiveNumber,
} = require("./commonValidation");

// Available coupon types
const DISCOUNT_TYPES = ["percentage", "fixed"];

// Available coupon statuses
const COUPON_STATUS = ["active", "inactive"];

// Create coupon
const createCouponValidation = Joi.object({
  code: Joi.string().trim().uppercase().min(3).max(30).required().messages({
    "any.required": "Coupon code is required.",
    "string.empty": "Coupon code is required.",
    "string.min": "Coupon code must be at least 3 characters long.",
    "string.max": "Coupon code cannot exceed 30 characters.",
  }),

  description,

  discountType: Joi.string()
    .valid(...DISCOUNT_TYPES)
    .required()
    .messages({
      "any.required": "Discount type is required.",
    }),

  discountValue: positiveNumber.required().messages({
    "any.required": "Discount value is required.",
  }),

  minimumOrderAmount: positiveNumber.default(0),

  maximumDiscountAmount: positiveNumber.allow(null).default(null),

  usageLimit: Joi.number().integer().min(1).required().messages({
    "any.required": "Usage limit is required.",
  }),

  maximumUsagePerUser: Joi.number().integer().min(1).required().messages({
    "any.required": "Maximum usage per user is required.",
  }),

  validFrom: Joi.date().required().messages({
    "any.required": "Start date is required.",
  }),

  validUntil: Joi.date().greater(Joi.ref("validFrom")).required().messages({
    "date.greater": "Expiry date must be after the start date.",
    "any.required": "Expiry date is required.",
  }),

  isPublic: Joi.boolean().default(true),

  status: Joi.string()
    .valid(...COUPON_STATUS)
    .default("active"),
})
  .custom((value, helpers) => {
    if (value.discountType === "percentage" && value.discountValue > 100) {
      return helpers.message("Percentage discount cannot exceed 100%.");
    }

    if (
      value.discountType === "fixed" &&
      value.maximumDiscountAmount !== null
    ) {
      return helpers.message(
        "Maximum discount amount is only applicable for percentage coupons.",
      );
    }

    return value;
  })
  .strict()
  .options(validationOptions);

// Update coupon
const updateCouponValidation = Joi.object({
  code: Joi.string().trim().uppercase().min(3).max(30),

  description,

  discountType: Joi.string().valid(...DISCOUNT_TYPES),

  discountValue: positiveNumber,

  minimumOrderAmount: positiveNumber,

  maximumDiscountAmount: positiveNumber.allow(null),

  usageLimit: Joi.number().integer().min(1),

  maximumUsagePerUser: Joi.number().integer().min(1),

  validFrom: Joi.date(),

  validUntil: Joi.date(),

  isPublic: Joi.boolean(),

  status: Joi.string().valid(...COUPON_STATUS),
})
  .min(1)
  .custom((value, helpers) => {
    if (
      value.discountType === "percentage" &&
      value.discountValue !== undefined &&
      value.discountValue > 100
    ) {
      return helpers.message("Percentage discount cannot exceed 100%.");
    }

    if (
      value.discountType === "fixed" &&
      value.maximumDiscountAmount !== undefined &&
      value.maximumDiscountAmount !== null
    ) {
      return helpers.message(
        "Maximum discount amount is only applicable for percentage coupons.",
      );
    }

    if (
      value.validFrom &&
      value.validUntil &&
      value.validUntil <= value.validFrom
    ) {
      return helpers.message("Expiry date must be after the start date.");
    }

    return value;
  })
  .strict()
  .options(validationOptions);

// Coupon ID
const couponIdValidation = Joi.object({
  couponId: objectId.required().messages({
    "any.required": "Coupon ID is required.",
  }),
})
  .strict()
  .options(validationOptions);

// Apply coupon
const applyCouponValidation = Joi.object({
  code: Joi.string().trim().uppercase().required().messages({
    "any.required": "Coupon code is required.",
    "string.empty": "Coupon code is required.",
  }),
})
  .strict()
  .options(validationOptions);

// Coupon query
const couponQueryValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  search: Joi.string().trim().max(100).allow(""),

  status: Joi.string().valid(...COUPON_STATUS),

  discountType: Joi.string().valid(...DISCOUNT_TYPES),

  isPublic: Joi.boolean(),

  sortBy: Joi.string()
    .valid("code", "discountValue", "validFrom", "validUntil", "createdAt")
    .default("createdAt"),

  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
})
  .strict()
  .options(validationOptions);

// Coupon status
const couponStatusValidation = Joi.object({
  status: Joi.string()
    .valid(...COUPON_STATUS)
    .required()
    .messages({
      "any.required": "Status is required.",
    }),
})
  .strict()
  .options(validationOptions);

module.exports = {
  createCouponValidation,
  updateCouponValidation,
  couponIdValidation,
  applyCouponValidation,
  couponQueryValidation,
  couponStatusValidation,
};
