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

// Available product statuses
const PRODUCT_STATUS = ["active", "inactive", "out-of-stock"];

// Available approval statuses
const APPROVAL_STATUS = ["pending", "approved", "rejected"];

// Product image
const productImage = Joi.object({
  publicId: Joi.string().required().messages({
    "any.required": "Image public ID is required.",
    "string.empty": "Image public ID is required.",
  }),

  url: Joi.string().uri().required().messages({
    "any.required": "Image URL is required.",
    "string.uri": "Image URL must be valid.",
  }),

  isPrimary: Joi.boolean().default(false),
});

const productImages = Joi.array()
  .items(productImage)
  .min(1)
  .max(5)
  .custom((images, helpers) => {
    const primaryImages = images.filter((image) => image.isPrimary);

    if (primaryImages.length !== 1) {
      return helpers.error("any.invalid");
    }

    return images;
  })
  .messages({
    "array.min": "At least one product image is required.",
    "array.max": "Maximum 5 product images are allowed.",
    "any.invalid": "Exactly one product image must be marked as primary.",
  });

// Create product
const createProductValidation = Joi.object({
  name: title.required().messages({
    "any.required": "Product name is required.",
  }),

  shortDescription: Joi.string().trim().max(300).required().messages({
    "any.required": "Short description is required.",
    "string.max": "Short description cannot exceed 300 characters.",
  }),

  description: description.required().messages({
    "any.required": "Description is required.",
  }),

  category: objectId.required().messages({
    "any.required": "Category is required.",
  }),

  brand: objectId.required().messages({
    "any.required": "Brand is required.",
  }),

  images: productImages.required(),

  price: price.required().messages({
    "any.required": "Price is required.",
  }),

  discountPrice: Joi.number()
    .min(0)
    .precision(2)
    .less(Joi.ref("price"))
    .allow(null)
    .messages({
      "number.less": "Discount price must be less than the original price.",
    }),

  stock: stock.required().messages({
    "any.required": "Stock is required.",
  }),

  lowStockThreshold,

  isFeatured: Joi.boolean().default(false),

  metaTitle: Joi.string().trim().max(70),

  metaDescription: Joi.string().trim().max(160),
})
  .strict()
  .options(validationOptions);

const updateProductValidation = Joi.object({
  name: title,

  shortDescription: Joi.string().trim().max(300),

  description,

  category: objectId,

  brand: objectId,

  images: productImages,

  price,

  discountPrice: Joi.number().min(0).precision(2).allow(null),

  stock,

  lowStockThreshold,

  isFeatured: Joi.boolean(),

  metaTitle: Joi.string().trim().max(70),

  metaDescription: Joi.string().trim().max(160),
})
  .min(1)
  .strict()
  .options(validationOptions);

const productIdValidation = Joi.object({
  productId: objectId.required().messages({
    "any.required": "Product ID is required.",
  }),
})
  .strict()
  .options(validationOptions);

const productQueryValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  search: Joi.string().trim().allow(""),

  category: objectId,

  brand: objectId,

  status: Joi.string().valid(...PRODUCT_STATUS),

  approvalStatus: Joi.string().valid(...APPROVAL_STATUS),

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

const approveProductValidation = Joi.object({
  adminRemark: Joi.string().trim().max(500).allow(""),
})
  .strict()
  .options(validationOptions);

const rejectProductValidation = Joi.object({
  adminRemark: Joi.string().trim().max(500).required().messages({
    "any.required": "Rejection reason is required.",
    "string.empty": "Rejection reason is required.",
  }),
})
  .strict()
  .options(validationOptions);

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
