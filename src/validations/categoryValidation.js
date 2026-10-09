const Joi = require("joi");

const {
  validationOptions,
  objectId,
  title,
  description,
  displayOrder,
} = require("./commonValidation");

// Available category statuses
const CATEGORY_STATUS = ["active", "inactive"];

// Create category
const createCategoryValidation = Joi.object({
  name: title.required().messages({
    "any.required": "Category name is required.",
  }),

  description,

  image: Joi.object({
    publicId: Joi.string().allow(null, ""),

    url: Joi.string().uri().allow(null, ""),
  }).default({}),

  metaTitle: Joi.string().trim().max(60).messages({
    "string.max": "Meta title cannot exceed 60 characters.",
  }),

  metaDescription: Joi.string().trim().max(160).messages({
    "string.max": "Meta description cannot exceed 160 characters.",
  }),

  displayOrder,

  status: Joi.string()
    .valid(...CATEGORY_STATUS)
    .default("active"),
})
  .strict()
  .options(validationOptions);

// Update category
const updateCategoryValidation = Joi.object({
  name: title,

  description,

  image: Joi.object({
    publicId: Joi.string().allow(null, ""),

    url: Joi.string().uri().allow(null, ""),
  }),

  metaTitle: Joi.string().trim().max(60).messages({
    "string.max": "Meta title cannot exceed 60 characters.",
  }),

  metaDescription: Joi.string().trim().max(160).messages({
    "string.max": "Meta description cannot exceed 160 characters.",
  }),

  displayOrder,

  status: Joi.string().valid(...CATEGORY_STATUS),
})
  .min(1)
  .strict()
  .options(validationOptions);

// Category ID
const categoryIdValidation = Joi.object({
  categoryId: objectId.required().messages({
    "any.required": "Category ID is required.",
  }),
})
  .strict()
  .options(validationOptions);

// Category query
const categoryQueryValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  search: Joi.string().trim().max(100).allow(""),

  status: Joi.string().valid(...CATEGORY_STATUS),

  sortBy: Joi.string()
    .valid("name", "displayOrder", "createdAt", "updatedAt")
    .default("createdAt"),

  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
})
  .strict()
  .options(validationOptions);

module.exports = {
  createCategoryValidation,
  updateCategoryValidation,
  categoryIdValidation,
  categoryQueryValidation,
};
