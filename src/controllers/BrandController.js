const mongoose = require("mongoose");

const Brand = require("../models/Brand");
const Product = require("../models/Product");

const logger = require("../config/logger");

const {
  createBrandValidation,
  updateBrandValidation,
} = require("../validations/brandValidation");

const createAuditLog = require("../utils/createAuditLog");

const pagination = require("../utils/pagination");

const httpStatusCode = require("../utils/httpStatusCode");

class BrandController {
  /*
  ==========================================================
  SHOW BRANDS PAGE
  ==========================================================
  */

  async showBrandsPage(req, res, next) {
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

      const result = await Brand.aggregate([
        {
          $match: filter,
        },

        {
          $sort: sortOption,
        },

        {
          $facet: {
            brands: [
              {
                $skip: skip,
              },

              {
                $limit: limit,
              },
            ],

            totalBrands: [
              {
                $count: "count",
              },
            ],
          },
        },
      ]);

      const brands = result[0].brands;

      const totalBrands =
        result[0].totalBrands.length > 0 ? result[0].totalBrands[0].count : 0;

      const brandIds = brands.map((brand) => brand._id);

      const productCounts = await Product.aggregate([
        {
          $match: {
            brand: {
              $in: brandIds,
            },
          },
        },

        {
          $group: {
            _id: "$brand",

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

      brands.forEach((brand) => {
        brand.totalProducts = productMap[brand._id.toString()] || 0;
      });

      return res.render("admin/brands/index", {
        title: "Brand Management",

        brands,

        search,

        sort,

        currentPage: page,

        totalPages: Math.ceil(totalBrands / limit),

        totalBrands,
      });
    } catch (error) {
      logger.error(`Show brands failed : ${error.message}`);

      next(error);
    }
  }

  /*
  ==========================================================
  SHOW CREATE PAGE
  ==========================================================
  */

  async showCreateBrandPage(req, res, next) {
    try {
      return res.render("admin/brands/create", {
        title: "Create Brand",
      });
    } catch (error) {
      logger.error(`Show create brand page failed : ${error.message}`);

      next(error);
    }
  }

  /*
  ==========================================================
  CREATE BRAND
  ==========================================================
  */

  async createBrand(req, res, next) {
    try {
      const { error, value } = createBrandValidation.validate(req.body);

      if (error) {
        logger.warn(error.details[0].message);

        return res.redirect("/admin/brands/create");
      }

      const existingBrand = await Brand.findOne({
        name: {
          $regex: new RegExp(`^${value.name.trim()}$`, "i"),
        },
      });

      if (existingBrand) {
        logger.warn("Brand already exists.");

        return res.redirect("/admin/brands/create");
      }

      const brand = await Brand.create({
        name: value.name.trim(),

        createdBy: req.user._id,

        updatedBy: req.user._id,
      });

      await createAuditLog({
        req,

        actor: req.user,

        module: "Brand",

        action: "Create Brand",

        severity: "info",

        target: {
          id: brand._id,

          model: "Brand",
        },

        description: `Brand '${brand.name}' created successfully.`,
      });

      logger.info(`Brand created : ${brand.name}`);

      logger.info("Brand created successfully.");

      return res.redirect("/admin/brands");
    } catch (error) {
      logger.error(`Create brand failed : ${error.message}`);

      next(error);
    }
  }

  /*
  ==========================================================
  SHOW EDIT PAGE
  ==========================================================
  */

  async showEditBrandPage(req, res, next) {
    try {
      const { brandId } = req.params;

      const brand = await Brand.findById(brandId).lean();

      if (!brand) {
        logger.warn("Brand not found.");

        return res.redirect("/admin/brands");
      }

      return res.render("admin/brands/edit", {
        title: "Edit Brand",

        brand,
      });
    } catch (error) {
      logger.error(`Show edit brand page failed : ${error.message}`);

      next(error);
    }
  }

  /*
  ==========================================================
  UPDATE BRAND
  ==========================================================
  */

  async updateBrand(req, res, next) {
    try {
      const { brandId } = req.params;

      const { error, value } = updateBrandValidation.validate(req.body);

      if (error) {
        logger.warn(error.details[0].message);

        return res.redirect(`/admin/brands/${brandId}/edit`);
      }

      const brand = await Brand.findById(brandId);

      if (!brand) {
        logger.warn("Brand not found.");

        return res.redirect("/admin/brands");
      }

      const duplicateBrand = await Brand.findOne({
        _id: {
          $ne: brandId,
        },

        name: {
          $regex: new RegExp(`^${value.name.trim()}$`, "i"),
        },
      });

      if (duplicateBrand) {
        logger.warn("Brand already exists.");

        return res.redirect(`/admin/brands/${brandId}/edit`);
      }

      brand.name = value.name.trim();

      brand.updatedBy = req.user._id;

      await brand.save();

      await createAuditLog({
        req,

        actor: req.user,

        module: "Brand",

        action: "Update Brand",

        severity: "info",

        target: {
          id: brand._id,

          model: "Brand",
        },

        description: `Brand '${brand.name}' updated successfully.`,
      });

      logger.info(`Brand updated : ${brand.name}`);

      logger.info("Brand updated successfully.");

      return res.redirect("/admin/brands");
    } catch (error) {
      logger.error(`Update brand failed : ${error.message}`);

      next(error);
    }
  }

  /*
  ==========================================================
  DELETE BRAND
  ==========================================================
  */

  async deleteBrand(req, res, next) {
    try {
      const { brandId } = req.params;

      const brand = await Brand.findById(brandId);

      if (!brand) {
        logger.warn("Brand not found.");

        return res.redirect("/admin/brands");
      }

      const productCount = await Product.countDocuments({
        brand: brand._id,
      });

      if (productCount > 0) {
        logger.warn(
          `Cannot delete brand because ${productCount} product(s) are assigned to it.`,
        );

        return res.redirect("/admin/brands");
      }

      await Brand.deleteOne({
        _id: brand._id,
      });

      await createAuditLog({
        req,

        actor: req.user,

        module: "Brand",

        action: "Delete Brand",

        severity: "high",

        target: {
          id: brand._id,

          model: "Brand",
        },

        description: `Brand '${brand.name}' deleted successfully.`,
      });

      logger.info(`Brand deleted : ${brand.name}`);

      logger.info("Brand deleted successfully.");

      return res.redirect("/admin/brands");
    } catch (error) {
      logger.error(`Delete brand failed : ${error.message}`);

      next(error);
    }
  }

  /*
  ==========================================================
  BRAND OPTIONS
  ==========================================================
  */

  async getBrandOptions(req, res, next) {
    try {
      const brands = await Brand.find(
        {},
        {
          name: 1,
        },
      )
        .sort({
          name: 1,
        })
        .lean();

      return res.status(httpStatusCode.OK).json({
        success: true,

        data: brands,
      });
    } catch (error) {
      logger.error(`Get brand options failed : ${error.message}`);

      next(error);
    }
  }

  /*
  ==========================================================
  SHOW PRODUCTS BY BRAND
  ==========================================================
  */

  async showBrandProductsPage(req, res, next) {
    try {
      const { slug } = req.params;

      const brand = await Brand.findOne({
        slug,
      }).lean();

      if (!brand) {
        logger.warn("Brand not found.");

        return res.status(httpStatusCode.NOT_FOUND).render("errors/404", {
          title: "Brand Not Found",
        });
      }

      const products = await Product.aggregate([
        {
          $match: {
            brand: brand._id,

            isDeleted: false,
          },
        },

        {
          $lookup: {
            from: "categories",

            localField: "category",

            foreignField: "_id",

            as: "category",
          },
        },

        {
          $unwind: {
            path: "$category",

            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            name: 1,

            slug: 1,

            price: 1,

            discountPrice: 1,

            images: 1,

            averageRating: 1,

            totalReviews: 1,

            stock: 1,

            category: {
              _id: "$category._id",

              name: "$category.name",
            },
          },
        },

        {
          $sort: {
            createdAt: -1,
          },
        },
      ]);

      logger.info(`Viewed products for brand : ${brand.name}`);

      return res.render("shop/brand-products", {
        title: brand.name,

        brand,

        products,
      });
    } catch (error) {
      logger.error(`Show brand products failed : ${error.message}`);

      next(error);
    }
  }
}

module.exports = new BrandController();
