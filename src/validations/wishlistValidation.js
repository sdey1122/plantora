const Joi = require("joi");

const { validationOptions, objectId } = require("./commonValidation");

// Add to wishlist
const addToWishlistValidation = Joi.object({
  productId: objectId.required().messages({
    "any.required": "Product ID is required.",
  }),
})
  .strict()
  .options(validationOptions);

// Remove from wishlist
const removeFromWishlistValidation = Joi.object({
  productId: objectId.required().messages({
    "any.required": "Product ID is required.",
  }),
})
  .strict()
  .options(validationOptions);

// Wishlist query
const wishlistQueryValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  sortBy: Joi.string().valid("createdAt").default("createdAt"),

  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
})
  .strict()
  .options(validationOptions);

module.exports = {
  addToWishlistValidation,
  removeFromWishlistValidation,
  wishlistQueryValidation,
};
