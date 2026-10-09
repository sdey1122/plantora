const Joi = require("joi");

const { validationOptions, objectId } = require("./commonValidation");

// ==========================================================
// CREATE CHECKOUT / PLACE ORDER
// ==========================================================

const createCheckoutValidation = Joi.object({
  addressId: objectId.required().messages({
    "any.required": "Address is required.",
    "string.empty": "Address is required.",
  }),

  paymentMethod: Joi.string().valid("razorpay").required().messages({
    "any.required": "Payment method is required.",
    "any.only": "Invalid payment method.",
  }),

  notes: Joi.string().trim().max(500).allow("").default(""),
}).options(validationOptions);

module.exports = {
  createCheckoutValidation,
};
