// Update profile validation
const updateProfileValidation = Joi.object({
  name: Joi.string().min(3).max(32).required().messages({
    "string.empty": "Name is required.",
    "string.min": "Name must be at least 3 characters long.",
    "string.max": "Name cannot exceed 32 characters.",
  }),

  bio: Joi.string().allow("").max(500).messages({
    "string.max": "Bio cannot exceed 500 characters.",
  }),

  phone: Joi.string().allow("").max(20).messages({
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
