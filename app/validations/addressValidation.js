const Joi = require("joi");

const {
  validationOptions,
  objectId,
  phone,
  postalCode,
} = require("./commonValidation");

// Available address types
const ADDRESS_TYPES = ["home", "office", "other"];

// Address query validation
const addressQueryValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(20).default(10),

  search: Joi.string().trim().allow("").optional(),

  addressType: Joi.string()
    .valid(...ADDRESS_TYPES)
    .optional(),

  isDefault: Joi.boolean().optional(),

  sortBy: Joi.string()
    .valid("fullName", "city", "state", "country", "addressType", "createdAt")
    .default("createdAt"),

  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
})
  .strict()
  .options(validationOptions);

// Create address
const createAddressValidation = Joi.object({
  fullName: Joi.string().trim().min(3).max(100).required().messages({
    "any.required": "Full name is required.",
    "string.empty": "Full name is required.",
    "string.min": "Full name must be at least 3 characters long.",
    "string.max": "Full name cannot exceed 100 characters.",
  }),

  phone: phone.required().messages({
    "any.required": "Phone number is required.",
  }),

  addressLine1: Joi.string().trim().max(200).required().messages({
    "any.required": "Address Line 1 is required.",
    "string.empty": "Address Line 1 is required.",
    "string.max": "Address Line 1 cannot exceed 200 characters.",
  }),

  addressLine2: Joi.string().trim().max(200).allow(""),

  city: Joi.string().trim().max(100).required().messages({
    "any.required": "City is required.",
    "string.empty": "City is required.",
    "string.max": "City cannot exceed 100 characters.",
  }),

  state: Joi.string().trim().max(100).required().messages({
    "any.required": "State is required.",
    "string.empty": "State is required.",
    "string.max": "State cannot exceed 100 characters.",
  }),

  country: Joi.string().trim().max(100).required().messages({
    "any.required": "Country is required.",
    "string.empty": "Country is required.",
    "string.max": "Country cannot exceed 100 characters.",
  }),

  postalCode: postalCode.required().messages({
    "any.required": "Postal code is required.",
  }),

  countryCode: Joi.string().trim().max(10).default("+91"),

  alternatePhone: phone.allow("").optional(),

  area: Joi.string().trim().max(100).allow(""),

  landmark: Joi.string().trim().max(100).allow(""),

  addressType: Joi.string()
    .valid(...ADDRESS_TYPES)
    .default("home"),

  isDefault: Joi.boolean().default(false),
})
  .strict()
  .options(validationOptions);

// Update address
const updateAddressValidation = Joi.object({
  fullName: Joi.string().trim().min(3).max(100),

  phone,

  addressLine1: Joi.string().trim().max(200),

  addressLine2: Joi.string().trim().max(200).allow(""),

  city: Joi.string().trim().max(100),

  state: Joi.string().trim().max(100),

  country: Joi.string().trim().max(100),

  postalCode,

  countryCode: Joi.string().trim().max(10),

  alternatePhone: phone.allow("").optional(),

  area: Joi.string().trim().max(100).allow(""),

  landmark: Joi.string().trim().max(100).allow(""),

  addressType: Joi.string().valid(...ADDRESS_TYPES),

  isDefault: Joi.boolean(),
})
  .min(1)
  .strict()
  .options(validationOptions);

// Address ID
const addressIdValidation = Joi.object({
  addressId: objectId.required().messages({
    "any.required": "Address ID is required.",
  }),
})
  .strict()
  .options(validationOptions);

module.exports = {
  addressQueryValidation,
  createAddressValidation,
  updateAddressValidation,
  addressIdValidation,
};
