const Joi = require("joi");

const { validationOptions, objectId } = require("./commonValidation");

// Checkout
const createCheckoutValidation = Joi.object({
  addressId: objectId.required().messages({
    "any.required": "Address is required.",
  }),

  couponId: objectId.allow(null, "").optional(),

  paymentMethod: Joi.string().valid("cod", "razorpay").required().messages({
    "any.required": "Payment method is required.",
  }),
})
  .strict()
  .options(validationOptions);

// Apply coupon
const applyCouponValidation = Joi.object({
  couponCode: Joi.string().trim().required().messages({
    "any.required": "Coupon code is required.",
  }),
})
  .strict()
  .options(validationOptions);

// Remove coupon
const removeCouponValidation = Joi.object({})
  .strict()
  .options(validationOptions);

module.exports = {
  createCheckoutValidation,
  applyCouponValidation,
  removeCouponValidation,
};
