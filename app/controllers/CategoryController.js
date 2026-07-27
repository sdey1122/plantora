const Category = require("../models/Category");
const Product = require("../models/Product");

const logger = require("../config/logger");

const {
  createCategoryValidation,
  updateCategoryValidation,
} = require("../validations/categoryValidation");

const cloudinaryImageUpload = require("../utils/cloudinaryImageUpload");
const cloudinaryImageDelete = require("../utils/cloudinaryImageDelete");

const deleteLocalFile = require("../utils/deleteLocalFile");

const createAuditLog = require("../utils/createAuditLog");

const pagination = require("../utils/pagination");

const httpStatusCode = require("../utils/httpStatusCode");

class CategoryController {
  // Categories Page
  async showCategoriesPage(req, res, next) {
    try {
      const { page, limit, skip } = pagination(req.query);

      const search = req.query.search?.trim() || "";

      const status = req.query.status?.trim() || "";

      const featured = req.query.featured?.trim() || "";

      const sort = req.query.sort?.trim() || "newest";

      const filter = {
        isDeleted: false,
      };

      if (search) {
        filter.$or = [
          {
            name: {
              $regex: search,
              $options: "i",
            },
          },
          {
            slug: {
              $regex: search,
              $options: "i",
            },
          },
          {
            description: {
              $regex: search,
              $options: "i",
            },
          },
        ];
      }

      if (status) {
        filter.status = status;
      }

      if (featured === "true") {
        filter.isFeatured = true;
      }

      if (featured === "false") {
        filter.isFeatured = false;
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

        case "name-asc":
          sortOption = {
            name: 1,
          };
          break;

        case "name-desc":
          sortOption = {
            name: -1,
          };
          break;

        case "display-order":
          sortOption = {
            displayOrder: 1,
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
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdBy",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "updatedBy",
            foreignField: "_id",
            as: "updatedBy",
          },
        },
        {
          $project: {
            name: 1,
            slug: 1,
            description: 1,
            metaTitle: 1,
            metaDescription: 1,
            image: 1,
            status: 1,
            isFeatured: 1,
            displayOrder: 1,
            createdAt: 1,
            updatedAt: 1,

            createdBy: {
              $let: {
                vars: {
                  user: {
                    $arrayElemAt: ["$createdBy", 0],
                  },
                },
                in: {
                  _id: "$$user._id",
                  name: "$$user.name",
                  email: "$$user.email",
                },
              },
            },

            updatedBy: {
              $let: {
                vars: {
                  user: {
                    $arrayElemAt: ["$updatedBy", 0],
                  },
                },
                in: {
                  _id: "$$user._id",
                  name: "$$user.name",
                  email: "$$user.email",
                },
              },
            },
          },
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
            isDeleted: false,
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
        title: "Categories",

        categories,

        search,

        status,

        featured,

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
  // Render Create Category Page
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

  // Create Category
  async createCategory(req, res, next) {
    let uploadedImage = null;

    try {
      const { error, value } = createCategoryValidation.validate(req.body);

      if (error) {
        if (req.file) {
          deleteLocalFile(req.file.path);
        }

        req.flash("error", error.details[0].message);

        return res.redirect("/admin/categories/create");
      }

      const existingCategory = await Category.findOne({
        name: {
          $regex: new RegExp(`^${value.name.trim()}$`, "i"),
        },
        isDeleted: false,
      });

      if (existingCategory) {
        if (req.file) {
          deleteLocalFile(req.file.path);
        }

        req.flash("error", "Category already exists.");

        return res.redirect("/admin/categories/create");
      }

      if (req.file) {
        uploadedImage = await cloudinaryImageUpload(req.file.path, {
          folder: "Plantora/categories",
        });

        deleteLocalFile(req.file.path);
      }

      const category = await Category.create({
        name: value.name.trim(),

        description: value.description || "",

        metaTitle: value.metaTitle || "",

        metaDescription: value.metaDescription || "",

        displayOrder: value.displayOrder || 0,

        status: value.status || "active",

        isFeatured: value.isFeatured || false,

        image: uploadedImage
          ? {
              publicId: uploadedImage.publicId,

              url: uploadedImage.url,
            }
          : {
              publicId: null,
              url: null,
            },

        createdBy: req.user._id,
      });

      await createAuditLog({
        req,

        actor: req.user,

        module: "Category",

        action: "Create Category",

        severity: "low",

        target: {
          id: category._id,
          model: "Category",
        },

        description: `Category '${category.name}' created successfully.`,
      });

      logger.info(`Category created : ${category.name}`);

      req.flash("success", "Category created successfully.");

      return res.redirect("/admin/categories");
    } catch (error) {
      if (req.file) {
        deleteLocalFile(req.file.path);
      }

      if (uploadedImage && uploadedImage.publicId) {
        await cloudinaryImageDelete(uploadedImage.publicId);
      }

      logger.error(`Create category failed : ${error.message}`);

      next(error);
    }
  }

  // Render Edit Category Page
  async showEditCategoryPage(req, res, next) {
    try {
      const { categoryId } = req.params;

      const categories = await Category.aggregate([
        {
          $match: {
            _id: categoryId,
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdBy",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "updatedBy",
            foreignField: "_id",
            as: "updatedBy",
          },
        },
        {
          $project: {
            name: 1,
            slug: 1,
            description: 1,
            metaTitle: 1,
            metaDescription: 1,
            image: 1,
            status: 1,
            isFeatured: 1,
            displayOrder: 1,
            createdAt: 1,
            updatedAt: 1,
            createdBy: {
              $arrayElemAt: ["$createdBy", 0],
            },
            updatedBy: {
              $arrayElemAt: ["$updatedBy", 0],
            },
          },
        },
      ]);

      if (!categories.length) {
        req.flash("error", "Category not found.");

        return res.redirect("/admin/categories");
      }

      return res.render("admin/categories/edit", {
        title: "Edit Category",

        category: categories[0],
      });
    } catch (error) {
      logger.error(`Show edit category page failed : ${error.message}`);

      next(error);
    }
  }
  // Update Category
  async updateCategory(req, res, next) {
    let uploadedImage = null;

    try {
      const { categoryId } = req.params;

      const { error, value } = updateCategoryValidation.validate(req.body);

      if (error) {
        if (req.file) {
          deleteLocalFile(req.file.path);
        }

        req.flash("error", error.details[0].message);

        return res.redirect(`/admin/categories/${categoryId}/edit`);
      }

      const category = await Category.findOne({
        _id: categoryId,
        isDeleted: false,
      });

      if (!category) {
        if (req.file) {
          deleteLocalFile(req.file.path);
        }

        req.flash("error", "Category not found.");

        return res.redirect("/admin/categories");
      }

      const duplicateCategory = await Category.findOne({
        _id: {
          $ne: categoryId,
        },
        name: {
          $regex: new RegExp(`^${value.name.trim()}$`, "i"),
        },
        isDeleted: false,
      });

      if (duplicateCategory) {
        if (req.file) {
          deleteLocalFile(req.file.path);
        }

        req.flash("error", "Category name already exists.");

        return res.redirect(`/admin/categories/${categoryId}/edit`);
      }

      if (req.file) {
        uploadedImage = await cloudinaryImageUpload(req.file.path, {
          folder: "Plantora/categories",
        });

        deleteLocalFile(req.file.path);

        if (category.image.publicId) {
          await cloudinaryImageDelete(category.image.publicId);
        }

        category.image = {
          publicId: uploadedImage.publicId,

          url: uploadedImage.url,
        };
      }

      category.name = value.name.trim();

      category.description = value.description || "";

      category.metaTitle = value.metaTitle || "";

      category.metaDescription = value.metaDescription || "";

      category.displayOrder = value.displayOrder || 0;

      category.status = value.status || "active";

      category.isFeatured = value.isFeatured || false;

      category.updatedBy = req.user._id;

      await category.save();

      await createAuditLog({
        req,

        actor: req.user,

        module: "Category",

        action: "Update Category",

        severity: "low",

        target: {
          id: category._id,
          model: "Category",
        },

        description: `Category '${category.name}' updated successfully.`,
      });

      logger.info(`Category updated : ${category.name}`);

      req.flash("success", "Category updated successfully.");

      return res.redirect("/admin/categories");
    } catch (error) {
      if (req.file) {
        deleteLocalFile(req.file.path);
      }

      if (uploadedImage && uploadedImage.publicId) {
        await cloudinaryImageDelete(uploadedImage.publicId);
      }

      logger.error(`Update category failed : ${error.message}`);

      next(error);
    }
  }

  // Get Category By Slug
  async getCategoryBySlug(req, res, next) {
    try {
      const { slug } = req.params;

      const categories = await Category.aggregate([
        {
          $match: {
            slug,
            status: "active",
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: "products",
            let: {
              categoryId: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$category", "$$categoryId"],
                      },
                      {
                        $eq: ["$isDeleted", false],
                      },
                      {
                        $eq: ["$status", "active"],
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  name: 1,
                  slug: 1,
                  image: 1,
                  sellingPrice: 1,
                  mrp: 1,
                  stock: 1,
                  createdAt: 1,
                },
              },
            ],
            as: "products",
          },
        },
      ]);

      if (!categories.length) {
        return res.status(httpStatusCode.NOT_FOUND).render("404", {
          title: "Category Not Found",
        });
      }

      return res.render("categories/details", {
        title: categories[0].name,

        category: categories[0],
      });
    } catch (error) {
      logger.error(`Get category by slug failed : ${error.message}`);

      next(error);
    }
  }

  // Category Options
  async getCategoryOptions(req, res, next) {
    try {
      const categories = await Category.aggregate([
        {
          $match: {
            status: "active",
            isDeleted: false,
          },
        },
        {
          $sort: {
            displayOrder: 1,
            name: 1,
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            slug: 1,
          },
        },
      ]);

      return res.status(httpStatusCode.OK).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      logger.error(`Get category options failed : ${error.message}`);

      next(error);
    }
  }
  // Toggle Category Status
  async toggleCategoryStatus(req, res, next) {
    try {
      const { categoryId } = req.params;

      const category = await Category.findOne({
        _id: categoryId,
        isDeleted: false,
      });

      if (!category) {
        req.flash("error", "Category not found.");

        return res.redirect("/admin/categories");
      }

      category.status = category.status === "active" ? "inactive" : "active";

      category.updatedBy = req.user._id;

      await category.save();

      await createAuditLog({
        req,

        actor: req.user,

        module: "Category",

        action: "Toggle Category Status",

        severity: "low",

        target: {
          id: category._id,
          model: "Category",
        },

        description: `Category '${category.name}' status changed to '${category.status}'.`,
      });

      logger.info(`Category status changed : ${category.name}`);

      req.flash("success", "Category status updated successfully.");

      return res.redirect("/admin/categories");
    } catch (error) {
      logger.error(`Toggle category status failed : ${error.message}`);

      next(error);
    }
  }

  // Toggle Featured Category
  async toggleFeaturedCategory(req, res, next) {
    try {
      const { categoryId } = req.params;

      const category = await Category.findOne({
        _id: categoryId,
        isDeleted: false,
      });

      if (!category) {
        req.flash("error", "Category not found.");

        return res.redirect("/admin/categories");
      }

      category.isFeatured = !category.isFeatured;

      category.updatedBy = req.user._id;

      await category.save();

      await createAuditLog({
        req,

        actor: req.user,

        module: "Category",

        action: "Toggle Featured Category",

        severity: "low",

        target: {
          id: category._id,
          model: "Category",
        },

        description: `Category '${category.name}' featured status changed to '${category.isFeatured}'.`,
      });

      logger.info(`Category featured updated : ${category.name}`);

      req.flash("success", "Featured category updated successfully.");

      return res.redirect("/admin/categories");
    } catch (error) {
      logger.error(`Toggle featured category failed : ${error.message}`);

      next(error);
    }
  }

  // Soft Delete Category
  async softDeleteCategory(req, res, next) {
    try {
      const { categoryId } = req.params;

      const category = await Category.findOne({
        _id: categoryId,
        isDeleted: false,
      });

      if (!category) {
        req.flash("error", "Category not found.");

        return res.redirect("/admin/categories");
      }

      const productCount = await Product.countDocuments({
        category: category._id,
        isDeleted: false,
      });

      if (productCount > 0) {
        req.flash(
          "error",
          `This category contains ${productCount} product(s). Move or delete those products before deleting the category.`,
        );

        return res.redirect("/admin/categories");
      }

      category.isDeleted = true;

      category.deletedAt = new Date();

      category.updatedBy = req.user._id;

      await category.save();

      await createAuditLog({
        req,

        actor: req.user,

        module: "Category",

        action: "Soft Delete Category",

        severity: "medium",

        target: {
          id: category._id,
          model: "Category",
        },

        description: `Category '${category.name}' moved to trash.`,
      });

      logger.info(`Category soft deleted : ${category.name}`);

      req.flash("success", "Category moved to trash successfully.");

      return res.redirect("/admin/categories");
    } catch (error) {
      logger.error(`Soft delete category failed : ${error.message}`);

      next(error);
    }
  }

  // Restore Category
  async restoreCategory(req, res, next) {
    try {
      const { categoryId } = req.params;

      const category = await Category.findOne({
        _id: categoryId,
        isDeleted: true,
      });

      if (!category) {
        req.flash("error", "Category not found.");

        return res.redirect("/admin/categories/deleted");
      }

      const duplicateCategory = await Category.findOne({
        _id: {
          $ne: categoryId,
        },
        name: {
          $regex: new RegExp(`^${category.name}$`, "i"),
        },
        isDeleted: false,
      });

      if (duplicateCategory) {
        req.flash("error", "A category with the same name already exists.");

        return res.redirect("/admin/categories/deleted");
      }

      category.isDeleted = false;

      category.deletedAt = null;

      category.updatedBy = req.user._id;

      await category.save();

      await createAuditLog({
        req,

        actor: req.user,

        module: "Category",

        action: "Restore Category",

        severity: "medium",

        target: {
          id: category._id,
          model: "Category",
        },

        description: `Category '${category.name}' restored successfully.`,
      });

      logger.info(`Category restored : ${category.name}`);

      req.flash("success", "Category restored successfully.");

      return res.redirect("/admin/categories/deleted");
    } catch (error) {
      logger.error(`Restore category failed : ${error.message}`);

      next(error);
    }
  }
  // Permanently Delete Category
  async deleteCategory(req, res, next) {
    try {
      const { categoryId } = req.params;

      const category = await Category.findOne({
        _id: categoryId,
        isDeleted: true,
      });

      if (!category) {
        req.flash("error", "Category not found.");

        return res.redirect("/admin/categories/deleted");
      }

      const productCount = await Product.countDocuments({
        category: category._id,
      });

      if (productCount > 0) {
        req.flash(
          "error",
          `Unable to permanently delete this category because ${productCount} product(s) are still linked to it.`,
        );

        return res.redirect("/admin/categories/deleted");
      }

      if (category.image && category.image.publicId) {
        await cloudinaryImageDelete(category.image.publicId);
      }

      await Category.deleteOne({
        _id: category._id,
      });

      await createAuditLog({
        req,

        actor: req.user,

        module: "Category",

        action: "Permanent Delete Category",

        severity: "high",

        target: {
          id: category._id,
          model: "Category",
        },

        description: `Category '${category.name}' permanently deleted.`,
      });

      logger.info(`Category permanently deleted : ${category.name}`);

      req.flash("success", "Category permanently deleted successfully.");

      return res.redirect("/admin/categories/deleted");
    } catch (error) {
      logger.error(`Permanent delete category failed : ${error.message}`);

      next(error);
    }
  }

  // Deleted Categories Page
  async showDeletedCategoriesPage(req, res, next) {
    try {
      const { page, limit, skip } = pagination(req.query);

      const search = req.query.search?.trim() || "";

      const pipeline = [
        {
          $match: {
            isDeleted: true,
          },
        },
      ];

      if (search) {
        pipeline.push({
          $match: {
            $or: [
              {
                name: {
                  $regex: search,
                  $options: "i",
                },
              },
              {
                slug: {
                  $regex: search,
                  $options: "i",
                },
              },
            ],
          },
        });
      }

      pipeline.push(
        {
          $lookup: {
            from: "users",
            localField: "updatedBy",
            foreignField: "_id",
            as: "updatedBy",
          },
        },
        {
          $project: {
            name: 1,
            slug: 1,
            image: 1,
            deletedAt: 1,
            updatedAt: 1,
            updatedBy: {
              $arrayElemAt: ["$updatedBy", 0],
            },
          },
        },
        {
          $sort: {
            deletedAt: -1,
          },
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
            total: [
              {
                $count: "count",
              },
            ],
          },
        },
      );

      const result = await Category.aggregate(pipeline);

      const categories = result[0].categories;

      const totalCategories = result[0].total.length
        ? result[0].total[0].count
        : 0;

      return res.render("admin/categories/deleted", {
        title: "Deleted Categories",

        categories,

        search,

        currentPage: page,

        totalPages: Math.ceil(totalCategories / limit),

        totalCategories,
      });
    } catch (error) {
      logger.error(`Show deleted categories failed : ${error.message}`);

      next(error);
    }
  }

  // Category Analytics
  async getCategoryAnalytics(req, res, next) {
    try {
      const analytics = await Category.aggregate([
        {
          $facet: {
            totalCategories: [
              {
                $match: {
                  isDeleted: false,
                },
              },
              {
                $count: "count",
              },
            ],

            activeCategories: [
              {
                $match: {
                  status: "active",
                  isDeleted: false,
                },
              },
              {
                $count: "count",
              },
            ],

            inactiveCategories: [
              {
                $match: {
                  status: "inactive",
                  isDeleted: false,
                },
              },
              {
                $count: "count",
              },
            ],

            featuredCategories: [
              {
                $match: {
                  isFeatured: true,
                  isDeleted: false,
                },
              },
              {
                $count: "count",
              },
            ],

            deletedCategories: [
              {
                $match: {
                  isDeleted: true,
                },
              },
              {
                $count: "count",
              },
            ],
          },
        },
      ]);

      return res.status(httpStatusCode.OK).json({
        success: true,

        data: {
          totalCategories: analytics[0].totalCategories[0]?.count || 0,

          activeCategories: analytics[0].activeCategories[0]?.count || 0,

          inactiveCategories: analytics[0].inactiveCategories[0]?.count || 0,

          featuredCategories: analytics[0].featuredCategories[0]?.count || 0,

          deletedCategories: analytics[0].deletedCategories[0]?.count || 0,
        },
      });
    } catch (error) {
      logger.error(`Category analytics failed : ${error.message}`);

      next(error);
    }
  }
}

module.exports = new CategoryController();
