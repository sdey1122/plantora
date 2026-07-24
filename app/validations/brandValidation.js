const Joi = require("joi");

const {
  validationOptions,
  objectId,
  title,
  description,
  displayOrder,
} = require("./commonValidation");

// Available brand statuses
const BRAND_STATUS = ["active", "inactive"];

// Create brand
const createBrandValidation = Joi.object({
  name: title.required().messages({
    "any.required": "Brand name is required.",
  }),

  description,

  logo: Joi.object({
    publicId: Joi.string().allow(null, ""),

    url: Joi.string().uri().allow(null, ""),
  }).default({
    publicId: null,

    url: null,
  }),

  website: Joi.string().trim().uri().allow(""),

  metaTitle: Joi.string().trim().max(70).messages({
    "string.max": "Meta title cannot exceed 70 characters.",
  }),

  metaDescription: Joi.string().trim().max(160).messages({
    "string.max": "Meta description cannot exceed 160 characters.",
  }),

  isFeatured: Joi.boolean().default(false),

  displayOrder,

  status: Joi.string()
    .valid(...BRAND_STATUS)
    .default("active"),
})
  .strict()
  .options(validationOptions);

// Update brand
const updateBrandValidation = Joi.object({
  name: title,

  description,

  logo: Joi.object({
    publicId: Joi.string().allow(null, ""),

    url: Joi.string().uri().allow(null, ""),
  }),

  website: Joi.string().trim().uri().allow(""),

  metaTitle: Joi.string().trim().max(70).messages({
    "string.max": "Meta title cannot exceed 70 characters.",
  }),

  metaDescription: Joi.string().trim().max(160).messages({
    "string.max": "Meta description cannot exceed 160 characters.",
  }),

  isFeatured: Joi.boolean(),

  displayOrder,

  status: Joi.string().valid(...BRAND_STATUS),
})
  .min(1)
  .strict()
  .options(validationOptions);

// Brand ID
const brandIdValidation = Joi.object({
  brandId: objectId.required().messages({
    "any.required": "Brand ID is required.",
  }),
})
  .strict()
  .options(validationOptions);

// Brand query
const brandQueryValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  search: Joi.string().trim().max(100).allow(""),

  status: Joi.string().valid(...BRAND_STATUS),

  isFeatured: Joi.boolean(),

  sortBy: Joi.string()
    .valid("name", "displayOrder", "createdAt", "updatedAt")
    .default("createdAt"),

  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
})
  .strict()
  .options(validationOptions);

module.exports = {
  createBrandValidation,
  updateBrandValidation,
  brandIdValidation,
  brandQueryValidation,
};
