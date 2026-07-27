const Joi = require("joi");

// Password must contain:
// - At least 9 characters
// - One lowercase letter
// - One uppercase letter
// - One special character
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{9,}$/;

// Common validation options
const validationOptions = {
  abortEarly: false,
  allowUnknown: false,
  stripUnknown: true,
};

// Common validations
const name = Joi.string().trim().min(3).max(32).required().messages({
  "string.empty": "Name is required.",
  "string.min": "Name must be at least 3 characters long.",
  "string.max": "Name cannot exceed 32 characters.",
  "any.required": "Name is required.",
});

const email = Joi.string().trim().lowercase().email().required().messages({
  "string.empty": "Email is required.",
  "string.email": "Please enter a valid email address.",
  "any.required": "Email is required.",
});

const password = Joi.string().pattern(passwordPattern).required().messages({
  "string.empty": "Password is required.",
  "string.pattern.base":
    "Password must be at least 9 characters long and contain at least one uppercase letter, one lowercase letter, and one special character.",
  "any.required": "Password is required.",
});

const confirmPassword = Joi.string()
  .valid(Joi.ref("password"))
  .required()
  .messages({
    "any.only": "Passwords do not match.",
    "string.empty": "Confirm password is required.",
    "any.required": "Confirm password is required.",
  });

// Register validation
const registerValidation = Joi.object({
  name,
  email,
  password,
  confirmPassword,

  termsAccepted: Joi.boolean().valid(true).required().messages({
    "any.only": "You must accept the Terms and Conditions.",
    "any.required": "You must accept the Terms and Conditions.",
  }),
})
  .strict()
  .options(validationOptions);

// Login validation
const loginValidation = Joi.object({
  email,

  password: Joi.string().required().messages({
    "string.empty": "Password is required.",
    "any.required": "Password is required.",
  }),
})
  .strict()
  .options(validationOptions);

// Forgot password validation
const forgotPasswordValidation = Joi.object({
  email,
})
  .strict()
  .options(validationOptions);

// Reset password validation
const resetPasswordValidation = Joi.object({
  password,
  confirmPassword,
})
  .strict()
  .options(validationOptions);

// Change password validation
const changePasswordValidation = Joi.object({
  currentPassword: Joi.string().required().messages({
    "string.empty": "Current password is required.",
    "any.required": "Current password is required.",
  }),

  newPassword: Joi.string().pattern(passwordPattern).required().messages({
    "string.empty": "New password is required.",
    "string.pattern.base":
      "New password must be at least 9 characters long and contain at least one uppercase letter, one lowercase letter, and one special character.",
    "any.required": "New password is required.",
  }),

  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Passwords do not match.",
      "string.empty": "Confirm password is required.",
      "any.required": "Confirm password is required.",
    }),
})
  .strict()
  .options(validationOptions);

// Change email validation
const changeEmailValidation = Joi.object({
  newEmail: Joi.string().trim().lowercase().email().required().messages({
    "string.empty": "New email is required.",
    "string.email": "Please enter a valid email address.",
    "any.required": "New email is required.",
  }),

  currentPassword: Joi.string().required().messages({
    "string.empty": "Current password is required.",
    "any.required": "Current password is required.",
  }),
})
  .strict()
  .options(validationOptions);

// Verify email validation
const verifyEmailValidation = Joi.object({
  token: Joi.string().trim().required().messages({
    "string.empty": "Verification token is required.",
    "any.required": "Verification token is required.",
  }),
})
  .strict()
  .options(validationOptions);

// Resend verification email validation
const resendVerificationValidation = Joi.object({
  email,
})
  .strict()
  .options(validationOptions);

// Request seller validation
const requestSellerValidation = Joi.object({})
  .strict()
  .options(validationOptions);

// Update profile validation
const updateProfileValidation = Joi.object({
  name: Joi.string().trim().min(3).max(32).messages({
    "string.min": "Name must be at least 3 characters long.",
    "string.max": "Name cannot exceed 32 characters.",
  }),
})
  .strict()
  .options(validationOptions);

// Become seller validation
const becomeSellerValidation = Joi.object({
  confirm: Joi.boolean().valid(true).required().messages({
    "any.only": "Please confirm your seller request.",
    "any.required": "Confirmation is required.",
  }),
});

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  changeEmailValidation,
  verifyEmailValidation,
  resendVerificationValidation,
  requestSellerValidation,
  updateProfileValidation,
  becomeSellerValidation,
};
