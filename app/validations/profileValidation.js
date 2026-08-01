const Joi = require("joi");

// MongoDB ObjectId
const objectId = Joi.string().hex().length(24);

// Show profile validation
const profileIdValidation = Joi.object({
  profileId: objectId.required().messages({
    "string.hex": "Invalid profile ID.",
    "string.length": "Invalid profile ID.",
    "any.required": "Profile ID is required.",
  }),
});

// Update profile validation
const updateProfileValidation = Joi.object({
  name: Joi.string().trim().min(3).max(32).required().messages({
    "string.empty": "Name is required.",
    "string.min": "Name must be at least 3 characters long.",
    "string.max": "Name cannot exceed 32 characters.",
  }),

  bio: Joi.string().trim().allow("").max(500).messages({
    "string.max": "Bio cannot exceed 500 characters.",
  }),

  phone: Joi.string().trim().allow("").max(20).messages({
    "string.max": "Phone number cannot exceed 20 characters.",
  }),

  gender: Joi.string()
    .valid("male", "female", "other", "prefer-not-to-say")
    .messages({
      "any.only": "Invalid gender selected.",
    }),

  dateOfBirth: Joi.date().allow(null, "").messages({
    "date.base": "Please enter a valid date of birth.",
  }),
});

// Change password validation
const changePasswordValidation = Joi.object({
  currentPassword: Joi.string().required().messages({
    "string.empty": "Current password is required.",
  }),

  newPassword: Joi.string()
    .min(9)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).+$/)
    .required()
    .messages({
      "string.empty": "New password is required.",
      "string.min": "Password must be at least 9 characters long.",
      "string.pattern.base":
        "Password must contain uppercase, lowercase and special character.",
    }),

  confirmPassword: Joi.any().valid(Joi.ref("newPassword")).required().messages({
    "any.only": "Passwords do not match.",
    "any.required": "Confirm password is required.",
  }),
});

// Change email validation
const changeEmailValidation = Joi.object({
  email: Joi.string().email().trim().lowercase().required().messages({
    "string.empty": "Email is required.",
    "string.email": "Please enter a valid email address.",
  }),
});

// Become seller validation
const becomeSellerValidation = Joi.object({
  agree: Joi.boolean().valid(true).required().messages({
    "any.only": "You must confirm your seller request.",
  }),
});

module.exports = {
  profileIdValidation,
  updateProfileValidation,
  changePasswordValidation,
  changeEmailValidation,
  becomeSellerValidation,
};
