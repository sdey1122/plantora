const Joi = require("joi");

const { validationOptions, objectId } = require("./commonValidation");

// Available notification types
const NOTIFICATION_TYPES = [
  "system",
  "order",
  "payment",
  "product",
  "review",
  "seller",
];

// Related document types
const REFERENCE_TYPES = ["Order", "Product", "Review", "Payment", "User"];

// Notification ID
const notificationIdValidation = Joi.object({
  notificationId: objectId.required().messages({
    "any.required": "Notification ID is required.",
  }),
})
  .strict()
  .options(validationOptions);

// Create notification
const createNotificationValidation = Joi.object({
  recipient: objectId.required().messages({
    "any.required": "Recipient is required.",
  }),

  sender: objectId.allow(null),

  title: Joi.string().trim().max(150).required().messages({
    "any.required": "Notification title is required.",
    "string.max": "Title cannot exceed 150 characters.",
  }),

  message: Joi.string().trim().max(1000).required().messages({
    "any.required": "Notification message is required.",
    "string.max": "Message cannot exceed 1000 characters.",
  }),

  type: Joi.string()
    .valid(...NOTIFICATION_TYPES)
    .required(),

  referenceType: Joi.string()
    .valid(...REFERENCE_TYPES)
    .allow(null),

  referenceId: objectId.allow(null),

  actionUrl: Joi.string().trim().allow(""),
})
  .strict()
  .options(validationOptions);

// Mark notification as read
const markNotificationAsReadValidation = Joi.object({
  notificationId: objectId.required().messages({
    "any.required": "Notification ID is required.",
  }),
})
  .strict()
  .options(validationOptions);

// Mark all notifications as read
const markAllNotificationsAsReadValidation = Joi.object({})
  .strict()
  .options(validationOptions);

// Notification query
const notificationQueryValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  type: Joi.string().valid(...NOTIFICATION_TYPES),

  isRead: Joi.boolean(),

  sortBy: Joi.string().valid("createdAt", "readAt").default("createdAt"),

  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
})
  .strict()
  .options(validationOptions);

module.exports = {
  createNotificationValidation,
  notificationIdValidation,
  markNotificationAsReadValidation,
  markAllNotificationsAsReadValidation,
  notificationQueryValidation,
};
