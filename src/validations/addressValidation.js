const Joi = require("joi");

const { objectId } = require("./commonValidation");

// ==========================================================
// ADDRESS QUERY VALIDATION
// ==========================================================

const addressQueryValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(10).default(10),

  search: Joi.string().trim().allow("").default(""),

  addressType: Joi.string()
    .valid("home", "office", "other")
    .allow("")
    .default(""),

  isDefault: Joi.boolean().optional(),

  sortBy: Joi.string()
    .valid("createdAt", "fullName", "city")
    .default("createdAt"),

  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

// ==========================================================
// CREATE ADDRESS
// ==========================================================

const createAddressValidation = Joi.object({
  fullName: Joi.string().trim().min(3).max(100).required(),

  countryCode: Joi.string().trim().default("+91"),

  phone: Joi.string().trim().min(10).max(15).required(),

  alternatePhone: Joi.string().trim().allow("").default(""),

  addressLine1: Joi.string().trim().max(200).required(),

  addressLine2: Joi.string().trim().max(200).allow("").default(""),

  area: Joi.string().trim().max(100).allow("").default(""),

  landmark: Joi.string().trim().max(100).allow("").default(""),

  city: Joi.string().trim().max(100).required(),

  state: Joi.string().trim().max(100).required(),

  postalCode: Joi.string().trim().required(),

  country: Joi.string().trim().max(100).default("India"),

  addressType: Joi.string().valid("home", "office", "other").default("home"),

  isDefault: Joi.boolean().default(false),
});

// ==========================================================
// UPDATE ADDRESS
// ==========================================================

const updateAddressValidation = createAddressValidation;

// ==========================================================
// ADDRESS ID
// ==========================================================

const addressIdValidation = Joi.object({
  addressId: objectId.required(),
});

// ==========================================================
// EXPORT
// ==========================================================

module.exports = {
  addressQueryValidation,
  createAddressValidation,
  updateAddressValidation,
  addressIdValidation,
};
