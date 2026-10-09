const Joi = require("joi");

const {
  validationOptions,
  objectId,
  title,
  description,
  displayOrder,
} = require("./commonValidation");

// Available banner statuses
const BANNER_STATUS = ["active", "inactive"];

// Create banner
const createBannerValidation = Joi.object({
  title: title.required().messages({
    "any.required": "Banner title is required.",
  }),

  description,

  image: Joi.object({
    publicId: Joi.string().allow(null, ""),

    url: Joi.string().uri().required().messages({
      "any.required": "Banner image is required.",
    }),
  }).default({
    publicId: null,

    url: "",
  }),

  imageAlt: Joi.string().trim().max(150).allow(""),

  buttonText: Joi.string().trim().max(50).allow("").messages({
    "string.max": "Button text cannot exceed 50 characters.",
  }),

  redirectUrl: Joi.string()
    .trim()
    .pattern(/^(https?:\/\/|\/).*/)
    .allow("")
    .messages({
      "string.pattern.base": "Please enter a valid redirect URL.",
    }),

  isFeatured: Joi.boolean().default(false),

  displayOrder,

  status: Joi.string()
    .valid(...BANNER_STATUS)
    .default("active"),

  startDate: Joi.date().allow(null),

  endDate: Joi.date().min(Joi.ref("startDate")).allow(null).messages({
    "date.min": "End date must be after the start date.",
  }),
})
  .strict()
  .options(validationOptions);

// Update banner
const updateBannerValidation = Joi.object({
  title,

  description,

  image: Joi.object({
    publicId: Joi.string().allow(null, ""),

    url: Joi.string().uri().allow(null, ""),
  }),

  imageAlt: Joi.string().trim().max(150).allow(""),

  buttonText: Joi.string().trim().max(50).allow(""),

  redirectUrl: Joi.string()
    .trim()
    .pattern(/^(https?:\/\/|\/).*/)
    .allow("")
    .messages({
      "string.pattern.base": "Please enter a valid redirect URL.",
    }),

  isFeatured: Joi.boolean(),

  displayOrder,

  status: Joi.string().valid(...BANNER_STATUS),

  startDate: Joi.date().allow(null),

  endDate: Joi.date().min(Joi.ref("startDate")).allow(null).messages({
    "date.min": "End date must be after the start date.",
  }),
})
  .min(1)
  .strict()
  .options(validationOptions);

// Banner ID
const bannerIdValidation = Joi.object({
  bannerId: objectId.required().messages({
    "any.required": "Banner ID is required.",
  }),
})
  .strict()
  .options(validationOptions);

// Banner query
const bannerQueryValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  status: Joi.string().valid(...BANNER_STATUS),

  isFeatured: Joi.boolean(),

  sortBy: Joi.string()
    .valid("displayOrder", "createdAt", "updatedAt", "startDate", "endDate")
    .default("displayOrder"),

  sortOrder: Joi.string().valid("asc", "desc").default("asc"),
})
  .strict()
  .options(validationOptions);

module.exports = {
  createBannerValidation,
  updateBannerValidation,
  bannerIdValidation,
  bannerQueryValidation,
};
