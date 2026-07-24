const mongoose = require("mongoose");

const Brand = require("../models/Brand");
const Product = require("../models/Product");

const logger = require("../config/logger");

const httpStatusCode = require("../utils/httpStatusCode");

const createAuditLog = require("../utils/createAuditLog");

const cloudinaryImageUpload = require("../utils/cloudinaryImageUpload");
const cloudinaryImageDelete = require("../utils/cloudinaryImageDelete");

const {
  createBrandValidation,
  updateBrandValidation,
  brandIdValidation,
  brandQueryValidation,
} = require("../validations/brandValidation");

class BrandController {
  // Show brands page
  async showBrandsPage(req, res) {
    try {
      // Validate query
      const { error, value } = brandQueryValidation.validate(req.query);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin");
      }

      const { page, limit, search, status, isFeatured, sortBy, sortOrder } =
        value;

      const matchStage = {
        isDeleted: false,
      };

      // Search brands
      if (search) {
        matchStage.$text = {
          $search: search,
        };
      }

      // Filter by status
      if (status) {
        matchStage.status = status;
      }

      // Filter featured brands
      if (isFeatured !== undefined) {
        matchStage.isFeatured = isFeatured;
      }

      const result = await Brand.aggregate([
        {
          $match: matchStage,
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
          $unwind: {
            path: "$createdBy",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            name: 1,

            slug: 1,

            logo: 1,

            website: 1,

            status: 1,

            isFeatured: 1,

            displayOrder: 1,

            createdAt: 1,

            createdBy: {
              _id: "$createdBy._id",

              name: "$createdBy.name",

              email: "$createdBy.email",
            },
          },
        },

        {
          $sort: {
            [sortBy]: sortOrder === "asc" ? 1 : -1,
          },
        },

        {
          $facet: {
            brands: [
              {
                $skip: (page - 1) * limit,
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

      logger.info(`Admin viewed brand list. Admin: ${req.user.email}`);

      return res.status(httpStatusCode.OK).render("admin/brands/index", {
        title: "Manage Brands",

        brands,

        filters: value,

        pagination: {
          currentPage: page,

          totalPages: Math.ceil(totalBrands / limit),

          totalBrands,

          limit,
        },
      });
    } catch (error) {
      logger.error(`Show brands failed: ${error.message}`);

      req.flash("error", "Failed to load brands.");

      return res.redirect("/admin");
    }
  }

  // Show create brand page
  async showCreateBrandPage(req, res) {
    try {
      logger.info(`Admin opened create brand page. Admin: ${req.user.email}`);

      return res.status(httpStatusCode.OK).render("admin/brands/create", {
        title: "Create Brand",
      });
    } catch (error) {
      logger.error(`Show create brand page failed: ${error.message}`);

      req.flash("error", "Failed to load create brand page.");

      return res.redirect("/admin/brands");
    }
  }

  // Create brand
  async createBrand(req, res) {
    try {
      // Validate request body
      const { error, value } = createBrandValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin/brands/create");
      }

      const existingBrand = await Brand.findOne({
        name: value.name,
      });

      if (existingBrand) {
        req.flash("error", "Brand already exists.");

        return res.redirect("/admin/brands/create");
      }

      if (req.file) {
        const uploadedImage = await cloudinaryImageUpload(
          req.file.path,
          "brands",
        );

        value.logo = {
          publicId: uploadedImage.publicId,

          url: uploadedImage.secure_url,
        };
      }

      const brand = await Brand.create({
        ...value,

        createdBy: req.user._id,

        updatedBy: req.user._id,
      });

      await createAuditLog({
        user: req.user._id,

        action: "CREATE_BRAND",

        resource: "Brand",

        resourceId: brand._id,

        details: `Brand "${brand.name}" created.`,
      });

      logger.info(
        `Brand created successfully. Brand: ${brand.name}, Admin: ${req.user.email}`,
      );

      req.flash("success", "Brand created successfully.");

      return res.redirect("/admin/brands");
    } catch (error) {
      logger.error(`Create brand failed: ${error.message}`);

      req.flash("error", "Failed to create brand.");

      return res.redirect("/admin/brands/create");
    }
  }
  // Show edit brand page
  async showEditBrandPage(req, res) {
    try {
      // Validate brand ID
      const { error, value } = brandIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin/brands");
      }

      const brand = await Brand.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(value.brandId),

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
          $unwind: {
            path: "$createdBy",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            name: 1,

            slug: 1,

            description: 1,

            logo: 1,

            website: 1,

            metaTitle: 1,

            metaDescription: 1,

            status: 1,

            isFeatured: 1,

            displayOrder: 1,

            createdBy: {
              _id: "$createdBy._id",

              name: "$createdBy.name",

              email: "$createdBy.email",
            },
          },
        },
      ]);

      if (!brand.length) {
        req.flash("error", "Brand not found.");

        return res.redirect("/admin/brands");
      }

      logger.info(
        `Admin opened edit brand page. Brand: ${brand[0].name}, Admin: ${req.user.email}`,
      );

      return res.status(httpStatusCode.OK).render("admin/brands/edit", {
        title: "Edit Brand",

        brand: brand[0],
      });
    } catch (error) {
      logger.error(`Show edit brand page failed: ${error.message}`);

      req.flash("error", "Failed to load brand.");

      return res.redirect("/admin/brands");
    }
  }

  // Update brand
  async updateBrand(req, res) {
    try {
      // Validate brand ID
      const { error: idError, value: idValue } = brandIdValidation.validate(
        req.params,
      );

      if (idError) {
        req.flash("error", idError.details[0].message);

        return res.redirect("/admin/brands");
      }

      // Validate request body
      const { error, value } = updateBrandValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect(`/admin/brands/${idValue.brandId}/edit`);
      }

      const brand = await Brand.findOne({
        _id: idValue.brandId,

        isDeleted: false,
      });

      if (!brand) {
        req.flash("error", "Brand not found.");

        return res.redirect("/admin/brands");
      }

      // Check duplicate brand name
      if (value.name) {
        const existingBrand = await Brand.findOne({
          name: value.name,

          _id: {
            $ne: brand._id,
          },
        });

        if (existingBrand) {
          req.flash("error", "Brand already exists.");

          return res.redirect(`/admin/brands/${brand._id}/edit`);
        }
      }

      // Update brand logo
      if (req.file) {
        if (brand.logo.publicId) {
          await cloudinaryImageDelete(brand.logo.publicId);
        }

        const uploadedImage = await cloudinaryImageUpload(
          req.file.path,
          "brands",
        );

        value.logo = {
          publicId: uploadedImage.publicId,

          url: uploadedImage.secure_url,
        };
      }

      Object.assign(brand, value);

      brand.updatedBy = req.user._id;

      await brand.save();

      await createAuditLog({
        user: req.user._id,

        action: "UPDATE_BRAND",

        resource: "Brand",

        resourceId: brand._id,

        details: `Brand "${brand.name}" updated.`,
      });

      logger.info(
        `Brand updated successfully. Brand: ${brand.name}, Admin: ${req.user.email}`,
      );

      req.flash("success", "Brand updated successfully.");

      return res.redirect("/admin/brands");
    } catch (error) {
      logger.error(`Update brand failed: ${error.message}`);

      req.flash("error", "Failed to update brand.");

      return res.redirect("/admin/brands");
    }
  }

  // Soft delete brand
  async softDeleteBrand(req, res) {
    try {
      // Validate brand ID
      const { error, value } = brandIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin/brands");
      }

      const brand = await Brand.findOne({
        _id: value.brandId,

        isDeleted: false,
      });

      if (!brand) {
        req.flash("error", "Brand not found.");

        return res.redirect("/admin/brands");
      }

      const productExists = await Product.exists({
        brand: brand._id,

        isDeleted: false,
      });

      if (productExists) {
        req.flash(
          "error",
          "This brand cannot be deleted because it is assigned to one or more products.",
        );

        return res.redirect("/admin/brands");
      }

      brand.isDeleted = true;

      brand.deletedAt = new Date();

      brand.updatedBy = req.user._id;

      await brand.save();

      await createAuditLog({
        user: req.user._id,

        action: "SOFT_DELETE_BRAND",

        resource: "Brand",

        resourceId: brand._id,

        details: `Brand "${brand.name}" soft deleted.`,
      });

      logger.info(
        `Brand soft deleted. Brand: ${brand.name}, Admin: ${req.user.email}`,
      );

      req.flash("success", "Brand deleted successfully.");

      return res.redirect("/admin/brands");
    } catch (error) {
      logger.error(`Soft delete brand failed: ${error.message}`);

      req.flash("error", "Failed to delete brand.");

      return res.redirect("/admin/brands");
    }
  }
  // Restore brand
  async restoreBrand(req, res) {
    try {
      // Validate brand ID
      const { error, value } = brandIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin/brands");
      }

      const brand = await Brand.findOne({
        _id: value.brandId,

        isDeleted: true,
      });

      if (!brand) {
        req.flash("error", "Brand not found.");

        return res.redirect("/admin/brands");
      }

      brand.isDeleted = false;

      brand.deletedAt = null;

      brand.updatedBy = req.user._id;

      await brand.save();

      await createAuditLog({
        user: req.user._id,

        action: "RESTORE_BRAND",

        resource: "Brand",

        resourceId: brand._id,

        details: `Brand "${brand.name}" restored.`,
      });

      logger.info(
        `Brand restored successfully. Brand: ${brand.name}, Admin: ${req.user.email}`,
      );

      req.flash("success", "Brand restored successfully.");

      return res.redirect("/admin/brands");
    } catch (error) {
      logger.error(`Restore brand failed: ${error.message}`);

      req.flash("error", "Failed to restore brand.");

      return res.redirect("/admin/brands");
    }
  }

  // Permanently delete brand
  async deleteBrand(req, res) {
    try {
      // Validate brand ID
      const { error, value } = brandIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin/brands");
      }

      const brand = await Brand.findOne({
        _id: value.brandId,

        isDeleted: true,
      });

      if (!brand) {
        req.flash("error", "Brand not found.");

        return res.redirect("/admin/brands");
      }

      const productExists = await Product.exists({
        brand: brand._id,
      });

      if (productExists) {
        req.flash(
          "error",
          "This brand cannot be permanently deleted because it is assigned to one or more products.",
        );

        return res.redirect("/admin/brands");
      }

      if (brand.logo.publicId) {
        await cloudinaryImageDelete(brand.logo.publicId);
      }

      await Brand.findByIdAndDelete(brand._id);

      await createAuditLog({
        user: req.user._id,

        action: "DELETE_BRAND",

        resource: "Brand",

        resourceId: brand._id,

        details: `Brand "${brand.name}" permanently deleted.`,
      });

      logger.info(
        `Brand permanently deleted. Brand: ${brand.name}, Admin: ${req.user.email}`,
      );

      req.flash("success", "Brand permanently deleted successfully.");

      return res.redirect("/admin/brands");
    } catch (error) {
      logger.error(`Permanent delete brand failed: ${error.message}`);

      req.flash("error", "Failed to permanently delete brand.");

      return res.redirect("/admin/brands");
    }
  }

  // Show products by brand
  async showBrandProductsPage(req, res) {
    try {
      const { slug } = req.params;

      const brand = await Brand.findOne({
        slug,

        status: "active",

        isDeleted: false,
      });

      if (!brand) {
        return res.status(httpStatusCode.NOT_FOUND).render("errors/404", {
          title: "Brand Not Found",
        });
      }

      const products = await Product.aggregate([
        {
          $match: {
            brand: brand._id,

            status: "active",

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

            salePrice: 1,

            images: 1,

            averageRating: 1,

            totalReviews: 1,

            stock: 1,

            category: {
              _id: "$category._id",

              name: "$category.name",

              slug: "$category.slug",
            },
          },
        },

        {
          $sort: {
            createdAt: -1,
          },
        },
      ]);

      logger.info(`Viewed products for brand: ${brand.name}`);

      return res.status(httpStatusCode.OK).render("shop/brand-products", {
        title: brand.name,

        brand,

        products,
      });
    } catch (error) {
      logger.error(`Show brand products failed: ${error.message}`);

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .render("errors/500", {
          title: "Server Error",
        });
    }
  }
}

module.exports = new BrandController();
