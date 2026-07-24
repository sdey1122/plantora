const Joi = require("joi");

// User query validation
const userQueryValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  search: Joi.string().trim().allow("").optional(),

  role: Joi.string().valid("admin", "customer").optional(),

  status: Joi.string().valid("active", "inactive", "blocked").optional(),

  sellerStatus: Joi.string()
    .valid("none", "pending", "approved", "rejected")
    .optional(),

  isEmailVerified: Joi.boolean().optional(),

  sortBy: Joi.string()
    .valid("name", "email", "role", "status", "createdAt", "lastLogin")
    .default("createdAt"),

  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

// User id validation
const userIdValidation = Joi.object({
  userId: Joi.string().hex().length(24).required().messages({
    "string.empty": "User id is required.",
    "string.hex": "Invalid user id.",
    "string.length": "Invalid user id.",
    "any.required": "User id is required.",
  }),
});

// Update user validation
const updateUserValidation = Joi.object({
  name: Joi.string().trim().min(3).max(32).optional().messages({
    "string.min": "Name must contain at least 3 characters.",
    "string.max": "Name cannot exceed 32 characters.",
  }),

  status: Joi.string().valid("active", "inactive", "blocked").optional(),

  adminRemark: Joi.string().trim().max(500).allow("").optional().messages({
    "string.max": "Admin remark cannot exceed 500 characters.",
  }),
});

// Toggle user status validation
const toggleUserStatusValidation = Joi.object({
  status: Joi.string()
    .valid("active", "inactive", "blocked")
    .required()
    .messages({
      "any.only": "Invalid user status.",
      "any.required": "Status is required.",
    }),
});

// Seller approval validation
const sellerApprovalValidation = Joi.object({
  sellerStatus: Joi.string().valid("approved", "rejected").required().messages({
    "any.only": "Invalid seller status.",
    "any.required": "Seller status is required.",
  }),

  adminRemark: Joi.string().trim().max(500).allow("").optional().messages({
    "string.max": "Admin remark cannot exceed 500 characters.",
  }),
});

module.exports = {
  userQueryValidation,
  userIdValidation,
  updateUserValidation,
  toggleUserStatusValidation,
  sellerApprovalValidation,
};
