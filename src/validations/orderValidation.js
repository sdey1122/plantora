const Joi = require("joi");

const {
  validationOptions,
  objectId,
  description,
} = require("./commonValidation");

// Available order statuses
const ORDER_STATUS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out-for-delivery",
  "delivered",
  "cancelled",
  "returned",
];

// Place order
const placeOrderValidation = Joi.object({
  addressId: objectId.required().messages({
    "any.required": "Shipping address is required.",
  }),

  couponCode: Joi.string().trim().uppercase().allow(""),

  notes: Joi.string().trim().max(500).allow(""),
})
  .strict()
  .options(validationOptions);

// Cancel order
const cancelOrderValidation = Joi.object({
  cancellationReason: description.required().messages({
    "any.required": "Cancellation reason is required.",
  }),
})
  .strict()
  .options(validationOptions);

// Return order
const returnOrderValidation = Joi.object({
  returnReason: description.required().messages({
    "any.required": "Return reason is required.",
  }),
})
  .strict()
  .options(validationOptions);

// Update order status (Admin)
const updateOrderStatusValidation = Joi.object({
  orderStatus: Joi.string()
    .valid(...ORDER_STATUS)
    .required()
    .messages({
      "any.required": "Order status is required.",
    }),
})
  .strict()
  .options(validationOptions);

// Order ID
const orderIdValidation = Joi.object({
  orderId: objectId.required().messages({
    "any.required": "Order ID is required.",
  }),
})
  .strict()
  .options(validationOptions);

// Order query
const orderQueryValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  status: Joi.string().valid(...ORDER_STATUS),

  search: Joi.string().trim().max(100).allow(""),

  startDate: Joi.date(),

  endDate: Joi.date(),

  sortBy: Joi.string()
    .valid("createdAt", "totalAmount", "orderStatus", "deliveredAt")
    .default("createdAt"),

  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
})
  .custom((value, helpers) => {
    if (value.startDate && value.endDate && value.startDate > value.endDate) {
      return helpers.message("Start date cannot be after end date.");
    }

    return value;
  })
  .strict()
  .options(validationOptions);

module.exports = {
  placeOrderValidation,
  cancelOrderValidation,
  returnOrderValidation,
  updateOrderStatusValidation,
  orderIdValidation,
  orderQueryValidation,
};
