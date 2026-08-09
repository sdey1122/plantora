const Joi = require("joi");

const { validationOptions, objectId, title } = require("./commonValidation");

/*
==========================================================
CREATE BRAND
==========================================================
*/

const createBrandValidation = Joi.object({
  name: title.required().messages({
    "any.required": "Brand name is required.",
  }),
})
  .strict()
  .options(validationOptions);

/*
==========================================================
UPDATE BRAND
==========================================================
*/

const updateBrandValidation = Joi.object({
  name: title.required().messages({
    "any.required": "Brand name is required.",
  }),
})
  .strict()
  .options(validationOptions);

/*
==========================================================
BRAND ID
==========================================================
*/

const brandIdValidation = Joi.object({
  brandId: objectId.required().messages({
    "any.required": "Brand ID is required.",
  }),
})
  .strict()
  .options(validationOptions);

/*
==========================================================
BRAND QUERY
==========================================================
*/

const brandQueryValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  search: Joi.string().trim().allow(""),

  sort: Joi.string().valid("newest", "oldest", "a-z", "z-a").default("newest"),
})
  .strict()
  .options(validationOptions);

module.exports = {
  createBrandValidation,
  updateBrandValidation,
  brandIdValidation,
  brandQueryValidation,
};
