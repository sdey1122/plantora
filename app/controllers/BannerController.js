const mongoose = require("mongoose");

const Banner = require("../models/Banner");

const logger = require("../config/logger");

const cloudinary = require("../config/cloudinary");

const createAuditLog = require("../utils/createAuditLog");

const {
  createBannerValidation,
  updateBannerValidation,
  bannerIdValidation,
  bannerQueryValidation,
} = require("../validations/bannerValidation");

const httpStatusCode = require("../utils/httpStatusCode");

class BannerController {
  // Show banners page
  async showBannersPage(req, res) {
    try {
      const { error, value } = bannerQueryValidation.validate(req.query);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin/dashboard");
      }

      const { page, limit, status, isFeatured, sortBy, sortOrder } = value;

      const matchStage = {
        isDeleted: false,
      };

      if (status) {
        matchStage.status = status;
      }

      if (typeof isFeatured === "boolean") {
        matchStage.isFeatured = isFeatured;
      }

      const skip = (page - 1) * limit;

      const banners = await Banner.aggregate([
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
            title: 1,

            image: 1,

            imageAlt: 1,

            buttonText: 1,

            redirectUrl: 1,

            displayOrder: 1,

            status: 1,

            isFeatured: 1,

            startDate: 1,

            endDate: 1,

            createdAt: 1,

            createdBy: {
              _id: "$createdBy._id",

              name: "$createdBy.name",
            },
          },
        },

        {
          $sort: {
            [sortBy]: sortOrder === "asc" ? 1 : -1,
          },
        },

        {
          $skip: skip,
        },

        {
          $limit: limit,
        },
      ]);

      const totalBanners = await Banner.countDocuments(matchStage);

      return res.render("admin/banner/index", {
        title: "Banner Management",

        banners,

        currentPage: page,

        totalPages: Math.ceil(totalBanners / limit),

        filters: value,
      });
    } catch (error) {
      logger.error(`Show banners page failed: ${error.message}`);

      req.flash("error", "Failed to load banners.");

      return res.redirect("/admin/dashboard");
    }
  }

  // Show create banner page
  async showCreateBannerPage(req, res) {
    try {
      return res.render("admin/banner/create", {
        title: "Create Banner",
      });
    } catch (error) {
      logger.error(`Show create banner page failed: ${error.message}`);

      req.flash("error", "Failed to load create banner page.");

      return res.redirect("/admin/banners");
    }
  }

  // Create banner
  async createBanner(req, res) {
    try {
      const bannerData = {
        ...req.body,

        image: req.file
          ? {
              publicId: req.file.filename,

              url: req.file.path,
            }
          : undefined,

        createdBy: req.user._id,
      };

      const { error, value } = createBannerValidation.validate(bannerData);

      if (error) {
        if (req.file) {
          await cloudinary.uploader.destroy(req.file.filename);
        }

        req.flash("error", error.details[0].message);

        return res.redirect("/admin/banners/create");
      }

      const banner = await Banner.create(value);

      await createAuditLog({
        userId: req.user._id,

        action: "CREATE",

        module: "Banner",

        targetId: banner._id,

        description: `Banner "${banner.title}" created.`,
      });

      logger.info(`Banner created: ${banner.title}`);

      req.flash("success", "Banner created successfully.");

      return res.redirect("/admin/banners");
    } catch (error) {
      if (req.file) {
        await cloudinary.uploader.destroy(req.file.filename);
      }

      logger.error(`Create banner failed: ${error.message}`);

      req.flash("error", "Failed to create banner.");

      return res.redirect("/admin/banners/create");
    }
  }
  // Show edit banner page
  async showEditBannerPage(req, res) {
    try {
      const { error } = bannerIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin/banners");
      }

      const banner = await Banner.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(req.params.bannerId),

            isDeleted: false,
          },
        },

        {
          $limit: 1,
        },
      ]);

      if (!banner.length) {
        req.flash("error", "Banner not found.");

        return res.redirect("/admin/banners");
      }

      return res.render("admin/banner/edit", {
        title: "Edit Banner",

        banner: banner[0],
      });
    } catch (error) {
      logger.error(`Show edit banner page failed: ${error.message}`);

      req.flash("error", "Failed to load banner.");

      return res.redirect("/admin/banners");
    }
  }

  // Update banner
  async updateBanner(req, res) {
    try {
      const { error: idError } = bannerIdValidation.validate(req.params);

      if (idError) {
        if (req.file) {
          await cloudinary.uploader.destroy(req.file.filename);
        }

        req.flash("error", idError.details[0].message);

        return res.redirect("/admin/banners");
      }

      const banner = await Banner.findOne({
        _id: req.params.bannerId,

        isDeleted: false,
      });

      if (!banner) {
        if (req.file) {
          await cloudinary.uploader.destroy(req.file.filename);
        }

        req.flash("error", "Banner not found.");

        return res.redirect("/admin/banners");
      }

      const updateData = {
        ...req.body,

        updatedBy: req.user._id,
      };

      if (req.file) {
        updateData.image = {
          publicId: req.file.filename,

          url: req.file.path,
        };
      }

      const { error, value } = updateBannerValidation.validate(updateData);

      if (error) {
        if (req.file) {
          await cloudinary.uploader.destroy(req.file.filename);
        }

        req.flash("error", error.details[0].message);

        return res.redirect(`/admin/banners/${banner._id}/edit`);
      }

      if (req.file && banner.image.publicId) {
        await cloudinary.uploader.destroy(banner.image.publicId);
      }

      await Banner.updateOne(
        {
          _id: banner._id,
        },
        {
          $set: value,
        },
      );

      await createAuditLog({
        userId: req.user._id,

        action: "UPDATE",

        module: "Banner",

        targetId: banner._id,

        description: `Banner "${banner.title}" updated.`,
      });

      logger.info(`Banner updated: ${banner.title}`);

      req.flash("success", "Banner updated successfully.");

      return res.redirect("/admin/banners");
    } catch (error) {
      if (req.file) {
        await cloudinary.uploader.destroy(req.file.filename);
      }

      logger.error(`Update banner failed: ${error.message}`);

      req.flash("error", "Failed to update banner.");

      return res.redirect("/admin/banners");
    }
  }

  // Soft delete banner
  async softDeleteBanner(req, res) {
    try {
      const { error } = bannerIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin/banners");
      }

      const banner = await Banner.findOne({
        _id: req.params.bannerId,

        isDeleted: false,
      });

      if (!banner) {
        req.flash("error", "Banner not found.");

        return res.redirect("/admin/banners");
      }

      await Banner.updateOne(
        {
          _id: banner._id,
        },
        {
          $set: {
            isDeleted: true,

            deletedAt: new Date(),

            updatedBy: req.user._id,
          },
        },
      );

      await createAuditLog({
        userId: req.user._id,

        action: "DELETE",

        module: "Banner",

        targetId: banner._id,

        description: `Banner "${banner.title}" moved to trash.`,
      });

      logger.info(`Banner soft deleted: ${banner.title}`);

      req.flash("success", "Banner moved to trash successfully.");

      return res.redirect("/admin/banners");
    } catch (error) {
      logger.error(`Soft delete banner failed: ${error.message}`);

      req.flash("error", "Failed to delete banner.");

      return res.redirect("/admin/banners");
    }
  }
  // Restore banner
  async restoreBanner(req, res) {
    try {
      const { error } = bannerIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin/banners");
      }

      const banner = await Banner.findOne({
        _id: req.params.bannerId,

        isDeleted: true,
      });

      if (!banner) {
        req.flash("error", "Banner not found.");

        return res.redirect("/admin/banners");
      }

      await Banner.updateOne(
        {
          _id: banner._id,
        },
        {
          $set: {
            isDeleted: false,

            deletedAt: null,

            updatedBy: req.user._id,
          },
        },
      );

      await createAuditLog({
        userId: req.user._id,

        action: "RESTORE",

        module: "Banner",

        targetId: banner._id,

        description: `Banner "${banner.title}" restored.`,
      });

      logger.info(`Banner restored: ${banner.title}`);

      req.flash("success", "Banner restored successfully.");

      return res.redirect("/admin/banners");
    } catch (error) {
      logger.error(`Restore banner failed: ${error.message}`);

      req.flash("error", "Failed to restore banner.");

      return res.redirect("/admin/banners");
    }
  }

  // Delete banner permanently
  async deleteBanner(req, res) {
    try {
      const { error } = bannerIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin/banners");
      }

      const banner = await Banner.findOne({
        _id: req.params.bannerId,

        isDeleted: true,
      });

      if (!banner) {
        req.flash("error", "Banner not found.");

        return res.redirect("/admin/banners");
      }

      if (banner.image.publicId) {
        await cloudinary.uploader.destroy(banner.image.publicId);
      }

      await Banner.deleteOne({
        _id: banner._id,
      });

      await createAuditLog({
        userId: req.user._id,

        action: "PERMANENT_DELETE",

        module: "Banner",

        targetId: banner._id,

        description: `Banner "${banner.title}" permanently deleted.`,
      });

      logger.info(`Banner permanently deleted: ${banner.title}`);

      req.flash("success", "Banner permanently deleted successfully.");

      return res.redirect("/admin/banners");
    } catch (error) {
      logger.error(`Delete banner failed: ${error.message}`);

      req.flash("error", "Failed to permanently delete banner.");

      return res.redirect("/admin/banners");
    }
  }

  // Show active banners
  async showActiveBanners(req, res) {
    try {
      const currentDate = new Date();

      const banners = await Banner.aggregate([
        {
          $match: {
            isDeleted: false,

            status: "active",

            $and: [
              {
                $or: [
                  {
                    startDate: null,
                  },
                  {
                    startDate: {
                      $lte: currentDate,
                    },
                  },
                ],
              },
              {
                $or: [
                  {
                    endDate: null,
                  },
                  {
                    endDate: {
                      $gte: currentDate,
                    },
                  },
                ],
              },
            ],
          },
        },

        {
          $project: {
            title: 1,

            description: 1,

            image: 1,

            imageAlt: 1,

            buttonText: 1,

            redirectUrl: 1,

            displayOrder: 1,

            isFeatured: 1,
          },
        },

        {
          $sort: {
            isFeatured: -1,

            displayOrder: 1,

            createdAt: -1,
          },
        },
      ]);

      return res.status(httpStatusCode.OK).json({
        success: true,

        banners,
      });
    } catch (error) {
      logger.error(`Show active banners failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to load banners.",
      });
    }
  }
}

module.exports = new BannerController();
