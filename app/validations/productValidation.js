const Joi = require("joi");

const {
  validationOptions,
  objectId,
  title,
  description,
  price,
  stock,
  lowStockThreshold,
} = require("./commonValidation");

// Product Status
const PRODUCT_STATUS = ["active", "inactive", "out-of-stock"];

// Approval Status
const APPROVAL_STATUS = ["pending", "approved", "rejected"];

// ==========================
// CREATE PRODUCT
// ==========================

const createProductValidation = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),

  shortDescription: Joi.string().trim().max(300).allow("", null),

  description: Joi.string().trim().allow("", null),

  category: objectId.required(),

  brand: objectId.required(),

  price: Joi.number().min(0).required(),

  discountPrice: Joi.number().min(0).allow("", null),

  stock: Joi.number().integer().min(0).required(),

  lowStockThreshold: Joi.number().integer().min(0).default(0),

  isFeatured: Joi.boolean().truthy("true").falsy("false").default(false),

  metaTitle: Joi.string().allow("", null),

  metaDescription: Joi.string().allow("", null),
}).options({
  abortEarly: false,
});

// ==========================
// UPDATE PRODUCT
// ==========================

const updateProductValidation = Joi.object({
  name: Joi.string().trim().min(2).max(150),

  shortDescription: Joi.string().trim().max(300).allow("", null),

  description: Joi.string().trim().allow("", null),

  category: objectId,

  brand: objectId,

  price: Joi.number().min(0),

  discountPrice: Joi.number().min(0).allow("", null),

  stock: Joi.number().integer().min(0),

  lowStockThreshold: Joi.number().integer().min(0),

  isFeatured: Joi.boolean().truthy("true").falsy("false"),

  metaTitle: Joi.string().allow("", null),

  metaDescription: Joi.string().allow("", null),
})
  .min(1)
  .options({
    abortEarly: false,
  });

// ==========================
// PRODUCT ID
// ==========================

const productIdValidation = Joi.object({
  productId: objectId.required().messages({
    "any.required": "Product ID is required.",
  }),
})
  .strict()
  .options(validationOptions);

// ==========================
// PRODUCT FILTERS
// ==========================

const productQueryValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  search: Joi.string().trim().allow(""),

  category: objectId.allow(""),

  brand: objectId.allow(""),

  status: Joi.string()
    .valid(...PRODUCT_STATUS)
    .allow(""),

  approvalStatus: Joi.string()
    .valid(...APPROVAL_STATUS)
    .allow(""),

  isFeatured: Joi.boolean(),

  minPrice: Joi.number().min(0),

  maxPrice: Joi.number().min(0),

  sortBy: Joi.string()
    .valid(
      "name",
      "price",
      "stock",
      "createdAt",
      "updatedAt",
      "soldCount",
      "views",
    )
    .default("createdAt"),

  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
})
  .strict()
  .options(validationOptions);

// ==========================
// APPROVE
// ==========================

const approveProductValidation = Joi.object({
  adminRemark: Joi.string().trim().max(500).allow(""),
})
  .strict()
  .options(validationOptions);

// ==========================
// REJECT
// ==========================

const rejectProductValidation = Joi.object({
  adminRemark: Joi.string().trim().max(500).required().messages({
    "any.required": "Rejection reason is required.",
    "string.empty": "Rejection reason is required.",
  }),
})
  .strict()
  .options(validationOptions);

// ==========================
// STATUS
// ==========================

const productStatusValidation = Joi.object({
  status: Joi.string()
    .valid(...PRODUCT_STATUS)
    .required()
    .messages({
      "any.required": "Status is required.",
    }),
})
  .strict()
  .options(validationOptions);

module.exports = {
  createProductValidation,
  updateProductValidation,
  productIdValidation,
  productQueryValidation,
  approveProductValidation,
  rejectProductValidation,
  productStatusValidation,
};
