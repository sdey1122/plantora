const Joi = require("joi");

// Common validation options
const validationOptions = {
  abortEarly: false,
  allowUnknown: false,
  stripUnknown: true,
};

// MongoDB ObjectId
const objectId = Joi.string().trim().hex().length(24).messages({
  "string.empty": "ID is required.",
  "string.hex": "Invalid ID format.",
  "string.length": "Invalid ID format.",
});

// Name
const name = Joi.string().trim().min(3).max(32).messages({
  "string.min": "Name must be at least 3 characters long.",
  "string.max": "Name cannot exceed 32 characters.",
});

// Title
const title = Joi.string().trim().min(3).max(100).messages({
  "string.min": "Title must be at least 3 characters long.",
  "string.max": "Title cannot exceed 100 characters.",
});

// Slug
const slug = Joi.string().trim().lowercase().max(120).messages({
  "string.max": "Slug cannot exceed 120 characters.",
});

// Description
const description = Joi.string().trim().max(1000).messages({
  "string.max": "Description cannot exceed 1000 characters.",
});

// Positive number
const positiveNumber = Joi.number().min(0).messages({
  "number.base": "Must be a valid number.",
  "number.min": "Value cannot be negative.",
});

// Price
const price = Joi.number().min(0).precision(2).messages({
  "number.base": "Price must be a valid number.",
  "number.min": "Price cannot be negative.",
});

// Percentage
const percentage = Joi.number().min(0).max(100).messages({
  "number.min": "Percentage cannot be negative.",
  "number.max": "Percentage cannot exceed 100.",
});

// Quantity
const quantity = Joi.number().integer().min(1).messages({
  "number.base": "Quantity must be a valid number.",
  "number.integer": "Quantity must be a whole number.",
  "number.min": "Quantity must be at least 1.",
});

// Stock
const stock = Joi.number().integer().min(0).messages({
  "number.integer": "Stock must be a whole number.",
  "number.min": "Stock cannot be negative.",
});

// Low stock threshold
const lowStockThreshold = Joi.number().integer().min(0).messages({
  "number.integer": "Low stock threshold must be a whole number.",
  "number.min": "Low stock threshold cannot be negative.",
});

// Display order
const displayOrder = Joi.number().integer().min(0).messages({
  "number.integer": "Display order must be a whole number.",
  "number.min": "Display order cannot be negative.",
});

// Phone
const phone = Joi.string()
  .trim()
  .pattern(/^[0-9]{10}$/)
  .messages({
    "string.pattern.base": "Please enter a valid 10-digit phone number.",
  });

// Country code
const countryCode = Joi.string()
  .trim()
  .pattern(/^\+\d{1,4}$/)
  .messages({
    "string.pattern.base": "Invalid country code.",
  });

// Postal code
const postalCode = Joi.string().trim().min(4).max(10).messages({
  "string.min": "Postal code is too short.",
  "string.max": "Postal code is too long.",
});

// SKU
const sku = Joi.string().trim().uppercase().max(50).messages({
  "string.max": "SKU cannot exceed 50 characters.",
});

// Pagination
const page = Joi.number().integer().min(1).default(1);

const limit = Joi.number().integer().min(1).max(100).default(10);

// Sort order
const sortOrder = Joi.string().valid("asc", "desc").default("desc");

// Boolean
const boolean = Joi.boolean();

// Date
const date = Joi.date();

// Cloudinary Image
const cloudinaryImage = Joi.object({
  publicId: Joi.string().allow(null, ""),

  url: Joi.string().uri().allow(null, ""),
});

// Status
const status = Joi.string();

// Search
const search = Joi.string().trim().max(100);

module.exports = {
  validationOptions,
  objectId,
  name,
  title,
  slug,
  description,
  positiveNumber,
  percentage,
  price,
  quantity,
  stock,
  lowStockThreshold,
  displayOrder,
  phone,
  countryCode,
  postalCode,
  sku,
  page,
  limit,
  sortOrder,
  boolean,
  date,
  cloudinaryImage,
  status,
  search,
};
