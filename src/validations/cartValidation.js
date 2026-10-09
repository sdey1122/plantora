const Joi = require("joi");

const { validationOptions, objectId, quantity } = require("./commonValidation");

// ==========================================================
// ADD TO CART
// ==========================================================

const addToCartValidation = Joi.object({
  productId: objectId.required().messages({
    "any.required": "Product ID is required.",
  }),

  quantity: quantity.default(1),
})
  .strict()
  .options(validationOptions);

// ==========================================================
// UPDATE CART QUANTITY
// ==========================================================

const updateCartQuantityValidation = Joi.object({
  productId: objectId.required().messages({
    "any.required": "Product ID is required.",
  }),

  quantity: quantity.required().messages({
    "any.required": "Quantity is required.",
  }),
})
  .strict()
  .options(validationOptions);

// ==========================================================
// REMOVE FROM CART
// ==========================================================

const removeFromCartValidation = Joi.object({
  productId: objectId.required().messages({
    "any.required": "Product ID is required.",
  }),
})
  .strict()
  .options(validationOptions);

// ==========================================================
// TOGGLE CART ITEM
// ==========================================================

const toggleCartItemValidation = Joi.object({
  productId: objectId.required().messages({
    "any.required": "Product ID is required.",
  }),

  isSelected: Joi.boolean().required().messages({
    "any.required": "Selection status is required.",
  }),
})
  .strict()
  .options(validationOptions);

// ==========================================================
// CLEAR CART
// ==========================================================

const clearCartValidation = Joi.object({}).strict().options(validationOptions);

// ==========================================================
// CART QUERY
// ==========================================================

const cartQueryValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),
})
  .strict()
  .options(validationOptions);

module.exports = {
  addToCartValidation,
  updateCartQuantityValidation,
  removeFromCartValidation,
  toggleCartItemValidation,
  clearCartValidation,
  cartQueryValidation,
};
