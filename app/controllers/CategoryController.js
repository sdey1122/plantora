const mongoose = require("mongoose");

const Category = require("../models/Category");
const Product = require("../models/Product");

const logger = require("../config/logger");

const {
  createCategoryValidation,
  updateCategoryValidation,
} = require("../validations/categoryValidation");

const createAuditLog = require("../utils/createAuditLog");

const pagination = require("../utils/pagination");

const httpStatusCode = require("../utils/httpStatusCode");

class CategoryController {
  /*
  ==========================================================
  SHOW CATEGORY PAGE
  ==========================================================
  */

  async showCategoriesPage(req, res, next) {
    try {
      const { page, limit, skip } = pagination(req.query);

      const search = req.query.search?.trim() || "";

      const sort = req.query.sort || "newest";

      const filter = {};

      if (search) {
        const conditions = [
          {
            name: {
              $regex: search,
              $options: "i",
            },
          },
        ];

        if (mongoose.Types.ObjectId.isValid(search)) {
          conditions.push({
            _id: new mongoose.Types.ObjectId(search),
          });
        }

        filter.$or = conditions;
      }

      let sortOption = {
        createdAt: -1,
      };

      switch (sort) {
        case "oldest":
          sortOption = {
            createdAt: 1,
          };
          break;

        case "a-z":
          sortOption = {
            name: 1,
          };
          break;

        case "z-a":
          sortOption = {
            name: -1,
          };
          break;

        default:
          sortOption = {
            createdAt: -1,
          };
      }

      const result = await Category.aggregate([
        {
          $match: filter,
        },

        {
          $sort: sortOption,
        },

        {
          $facet: {
            categories: [
              {
                $skip: skip,
              },
              {
                $limit: limit,
              },
            ],

            totalCategories: [
              {
                $count: "count",
              },
            ],
          },
        },
      ]);

      const categories = result[0].categories;

      const totalCategories =
        result[0].totalCategories.length > 0
          ? result[0].totalCategories[0].count
          : 0;

      const categoryIds = categories.map((category) => category._id);

      const productCounts = await Product.aggregate([
        {
          $match: {
            category: {
              $in: categoryIds,
            },
          },
        },

        {
          $group: {
            _id: "$category",

            totalProducts: {
              $sum: 1,
            },
          },
        },
      ]);

      const productMap = {};

      productCounts.forEach((item) => {
        productMap[item._id.toString()] = item.totalProducts;
      });

      categories.forEach((category) => {
        category.totalProducts = productMap[category._id.toString()] || 0;
      });

      return res.render("admin/categories/index", {
        title: "Category Management",

        categories,

        search,

        sort,

        currentPage: page,

        totalPages: Math.ceil(totalCategories / limit),

        totalCategories,
      });
    } catch (error) {
      logger.error(`Show categories failed : ${error.message}`);

      next(error);
    }
  }

  /*
  ==========================================================
  SHOW CREATE PAGE
  ==========================================================
  */

  async showCreateCategoryPage(req, res, next) {
    try {
      return res.render("admin/categories/create", {
        title: "Create Category",
      });
    } catch (error) {
      logger.error(`Show create category page failed : ${error.message}`);

      next(error);
    }
  }
  /*
  ==========================================================
  CREATE CATEGORY
  ==========================================================
  */

  async createCategory(req, res, next) {
    try {
      const { error, value } = createCategoryValidation.validate(req.body);

      if (error) {
        console.log(error.details[0].message);

        return res.redirect("/admin/categories/create");
      }

      const existingCategory = await Category.findOne({
        name: {
          $regex: new RegExp(`^${value.name.trim()}$`, "i"),
        },
      });

      if (existingCategory) {
        console.log("Category already exists.");

        return res.redirect("/admin/categories/create");
      }

      const category = await Category.create({
        name: value.name.trim(),

        createdBy: req.user._id,

        updatedBy: req.user._id,
      });

      await createAuditLog({
        req,

        actor: req.user,

        module: "Category",

        action: "Create Category",

        severity: "info",

        target: {
          id: category._id,
          model: "Category",
        },

        description: `Category '${category.name}' created successfully.`,
      });

      logger.info(`Category created : ${category.name}`);

      return res.redirect("/admin/categories");
    } catch (error) {
      logger.error(`Create category failed : ${error.message}`);

      next(error);
    }
  }

  /*
  ==========================================================
  SHOW EDIT PAGE
  ==========================================================
  */

  async showEditCategoryPage(req, res, next) {
    try {
      const { categoryId } = req.params;

      const category = await Category.findById(categoryId);

      if (!category) {
        console.log("Category not found.");

        return res.redirect("/admin/categories");
      }

      return res.render("admin/categories/edit", {
        title: "Edit Category",

        category,
      });
    } catch (error) {
      logger.error(`Show edit category page failed : ${error.message}`);

      next(error);
    }
  }

  /*
  ==========================================================
  UPDATE CATEGORY
  ==========================================================
  */

  async updateCategory(req, res, next) {
    try {
      const { categoryId } = req.params;

      const { error, value } = updateCategoryValidation.validate(req.body);

      if (error) {
        console.log(error.details[0].message);

        return res.redirect(`/admin/categories/${categoryId}/edit`);
      }

      const category = await Category.findById(categoryId);

      if (!category) {
        console.log("Category not found.");

        return res.redirect("/admin/categories");
      }

      const duplicateCategory = await Category.findOne({
        _id: {
          $ne: categoryId,
        },

        name: {
          $regex: new RegExp(`^${value.name.trim()}$`, "i"),
        },
      });

      if (duplicateCategory) {
        console.log("Category already exists.");

        return res.redirect(`/admin/categories/${categoryId}/edit`);
      }

      category.name = value.name.trim();

      category.updatedBy = req.user._id;

      await category.save();

      await createAuditLog({
        req,

        actor: req.user,

        module: "Category",

        action: "Update Category",

        severity: "info",

        target: {
          id: category._id,
          model: "Category",
        },

        description: `Category '${category.name}' updated successfully.`,
      });

      logger.info(`Category updated : ${category.name}`);

      return res.redirect("/admin/categories");
    } catch (error) {
      logger.error(`Update category failed : ${error.message}`);

      next(error);
    }
  }
  /*
  ==========================================================
  DELETE CATEGORY
  ==========================================================
  */

  async deleteCategory(req, res, next) {
    try {
      const { categoryId } = req.params;

      const category = await Category.findById(categoryId);

      if (!category) {
        console.log("Category not found.");

        return res.redirect("/admin/categories");
      }

      const productCount = await Product.countDocuments({
        category: category._id,
      });

      if (productCount > 0) {
        console.log(
          `Cannot delete category because ${productCount} product(s) are assigned to it.`,
        );

        return res.redirect("/admin/categories");
      }

      await Category.deleteOne({
        _id: category._id,
      });

      await createAuditLog({
        req,

        actor: req.user,

        module: "Category",

        action: "Delete Category",

        severity: "high",

        target: {
          id: category._id,
          model: "Category",
        },

        description: `Category '${category.name}' deleted successfully.`,
      });

      logger.info(`Category deleted : ${category.name}`);

      return res.redirect("/admin/categories");
    } catch (error) {
      logger.error(`Delete category failed : ${error.message}`);

      next(error);
    }
  }

  /*
  ==========================================================
  CATEGORY OPTIONS
  ==========================================================
  */

  async getCategoryOptions(req, res, next) {
    try {
      const categories = await Category.find(
        {},
        {
          name: 1,
        },
      ).sort({
        name: 1,
      });

      return res.status(httpStatusCode.OK).json({
        success: true,

        data: categories,
      });
    } catch (error) {
      logger.error(`Get category options failed : ${error.message}`);

      next(error);
    }
  }
}

module.exports = new CategoryController();
