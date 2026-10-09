const mongoose = require("mongoose");

const Coupon = require("../models/Coupon");
const Order = require("../models/Order");

const logger = require("../config/logger");

const httpStatusCode = require("../utils/httpStatusCode");

const createAuditLog = require("../utils/createAuditLog");

const {
  createCouponValidation,
  updateCouponValidation,
  couponIdValidation,
  applyCouponValidation,
  couponQueryValidation,
  couponStatusValidation,
} = require("../validations/couponValidation");

class CouponController {
  // Show coupons page
  async showCouponsPage(req, res) {
    try {
      // Validate query
      const { error, value } = couponQueryValidation.validate(req.query);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin");
      }

      const {
        page,
        limit,
        search,
        status,
        discountType,
        isPublic,
        sortBy,
        sortOrder,
      } = value;

      const matchStage = {
        isDeleted: false,
      };

      // Search coupon code
      if (search) {
        matchStage.code = {
          $regex: search,
          $options: "i",
        };
      }

      // Filter by status
      if (status) {
        matchStage.status = status;
      }

      // Filter by discount type
      if (discountType) {
        matchStage.discountType = discountType;
      }

      // Filter by public coupon
      if (isPublic !== undefined) {
        matchStage.isPublic = isPublic;
      }

      const result = await Coupon.aggregate([
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
            code: 1,

            discountType: 1,

            discountValue: 1,

            minimumOrderAmount: 1,

            usageLimit: 1,

            usedCount: 1,

            isPublic: 1,

            status: 1,

            validFrom: 1,

            validUntil: 1,

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
            coupons: [
              {
                $skip: (page - 1) * limit,
              },

              {
                $limit: limit,
              },
            ],

            totalCoupons: [
              {
                $count: "count",
              },
            ],
          },
        },
      ]);

      const coupons = result[0].coupons;

      const totalCoupons =
        result[0].totalCoupons.length > 0 ? result[0].totalCoupons[0].count : 0;

      const totalPages = Math.ceil(totalCoupons / limit);

      logger.info(`Admin viewed coupon list. Admin: ${req.user.email}`);

      return res.status(httpStatusCode.OK).render("admin/coupons/index", {
        title: "Manage Coupons",

        coupons,

        filters: value,

        pagination: {
          currentPage: page,

          totalPages,

          totalCoupons,

          limit,
        },
      });
    } catch (error) {
      logger.error(`Show coupons failed: ${error.message}`);

      req.flash("error", "Failed to load coupons.");

      return res.redirect("/admin");
    }
  }

  // Show create coupon page
  async showCreateCouponPage(req, res) {
    try {
      logger.info(`Admin opened create coupon page. Admin: ${req.user.email}`);

      return res.status(httpStatusCode.OK).render("admin/coupons/create", {
        title: "Create Coupon",
      });
    } catch (error) {
      logger.error(`Show create coupon page failed: ${error.message}`);

      req.flash("error", "Failed to load create coupon page.");

      return res.redirect("/admin/coupons");
    }
  }
  // Create coupon
  async createCoupon(req, res) {
    try {
      // Validate request body
      const { error, value } = createCouponValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin/coupons/create");
      }

      // Check existing coupon
      const existingCoupon = await Coupon.findOne({
        code: value.code,
      });

      if (existingCoupon) {
        req.flash("error", "Coupon code already exists.");

        return res.redirect("/admin/coupons/create");
      }

      // Create coupon
      const coupon = await Coupon.create({
        ...value,

        createdBy: req.user._id,

        updatedBy: req.user._id,
      });

      // Create audit log
      await createAuditLog({
        user: req.user._id,

        action: "CREATE_COUPON",

        resource: "Coupon",

        resourceId: coupon._id,

        details: `Coupon "${coupon.code}" created.`,
      });

      logger.info(
        `Coupon created successfully. Coupon: ${coupon.code}, Admin: ${req.user.email}`,
      );

      req.flash("success", "Coupon created successfully.");

      return res.redirect("/admin/coupons");
    } catch (error) {
      logger.error(`Create coupon failed: ${error.message}`);

      req.flash("error", "Failed to create coupon.");

      return res.redirect("/admin/coupons/create");
    }
  }

  // Show edit coupon page
  async showEditCouponPage(req, res) {
    try {
      // Validate coupon ID
      const { error, value } = couponIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin/coupons");
      }

      const coupon = await Coupon.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(value.couponId),

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
            code: 1,

            description: 1,

            discountType: 1,

            discountValue: 1,

            minimumOrderAmount: 1,

            maximumDiscountAmount: 1,

            usageLimit: 1,

            maximumUsagePerUser: 1,

            usedCount: 1,

            isPublic: 1,

            status: 1,

            validFrom: 1,

            validUntil: 1,

            createdBy: {
              _id: "$createdBy._id",

              name: "$createdBy.name",

              email: "$createdBy.email",
            },
          },
        },
      ]);

      if (!coupon.length) {
        req.flash("error", "Coupon not found.");

        return res.redirect("/admin/coupons");
      }

      logger.info(
        `Admin opened edit coupon page. Coupon: ${coupon[0].code}, Admin: ${req.user.email}`,
      );

      return res.status(httpStatusCode.OK).render("admin/coupons/edit", {
        title: "Edit Coupon",

        coupon: coupon[0],
      });
    } catch (error) {
      logger.error(`Show edit coupon page failed: ${error.message}`);

      req.flash("error", "Failed to load coupon.");

      return res.redirect("/admin/coupons");
    }
  }
  // Update coupon
  async updateCoupon(req, res) {
    try {
      // Validate coupon ID
      const { error: idError, value: idValue } = couponIdValidation.validate(
        req.params,
      );

      if (idError) {
        req.flash("error", idError.details[0].message);

        return res.redirect("/admin/coupons");
      }

      // Validate request body
      const { error, value } = updateCouponValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect(`/admin/coupons/${idValue.couponId}/edit`);
      }

      const coupon = await Coupon.findOne({
        _id: idValue.couponId,
        isDeleted: false,
      });

      if (!coupon) {
        req.flash("error", "Coupon not found.");

        return res.redirect("/admin/coupons");
      }

      // Check duplicate coupon code
      if (value.code) {
        const existingCoupon = await Coupon.findOne({
          code: value.code,
          _id: { $ne: coupon._id },
        });

        if (existingCoupon) {
          req.flash("error", "Coupon code already exists.");

          return res.redirect(`/admin/coupons/${coupon._id}/edit`);
        }
      }

      // Update coupon
      Object.assign(coupon, value);

      coupon.updatedBy = req.user._id;

      await coupon.save();

      // Create audit log
      await createAuditLog({
        user: req.user._id,

        action: "UPDATE_COUPON",

        resource: "Coupon",

        resourceId: coupon._id,

        details: `Coupon "${coupon.code}" updated.`,
      });

      logger.info(
        `Coupon updated successfully. Coupon: ${coupon.code}, Admin: ${req.user.email}`,
      );

      req.flash("success", "Coupon updated successfully.");

      return res.redirect("/admin/coupons");
    } catch (error) {
      logger.error(`Update coupon failed: ${error.message}`);

      req.flash("error", "Failed to update coupon.");

      return res.redirect("/admin/coupons");
    }
  }

  // Update coupon status
  async updateCouponStatus(req, res) {
    try {
      // Validate coupon ID
      const { error: idError, value: idValue } = couponIdValidation.validate(
        req.params,
      );

      if (idError) {
        req.flash("error", idError.details[0].message);

        return res.redirect("/admin/coupons");
      }

      // Validate status
      const { error, value } = couponStatusValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin/coupons");
      }

      const coupon = await Coupon.findOne({
        _id: idValue.couponId,
        isDeleted: false,
      });

      if (!coupon) {
        req.flash("error", "Coupon not found.");

        return res.redirect("/admin/coupons");
      }

      coupon.status = value.status;

      coupon.updatedBy = req.user._id;

      await coupon.save();

      // Create audit log
      await createAuditLog({
        user: req.user._id,

        action: "UPDATE_COUPON_STATUS",

        resource: "Coupon",

        resourceId: coupon._id,

        details: `Coupon "${coupon.code}" status changed to "${coupon.status}".`,
      });

      logger.info(
        `Coupon status updated. Coupon: ${coupon.code}, Status: ${coupon.status}, Admin: ${req.user.email}`,
      );

      req.flash("success", "Coupon status updated successfully.");

      return res.redirect("/admin/coupons");
    } catch (error) {
      logger.error(`Update coupon status failed: ${error.message}`);

      req.flash("error", "Failed to update coupon status.");

      return res.redirect("/admin/coupons");
    }
  }
  // Soft delete coupon
  async softDeleteCoupon(req, res) {
    try {
      // Validate coupon ID
      const { error, value } = couponIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin/coupons");
      }

      const coupon = await Coupon.findOne({
        _id: value.couponId,
        isDeleted: false,
      });

      if (!coupon) {
        req.flash("error", "Coupon not found.");

        return res.redirect("/admin/coupons");
      }

      coupon.isDeleted = true;

      coupon.deletedAt = new Date();

      coupon.updatedBy = req.user._id;

      await coupon.save();

      // Create audit log
      await createAuditLog({
        user: req.user._id,

        action: "SOFT_DELETE_COUPON",

        resource: "Coupon",

        resourceId: coupon._id,

        details: `Coupon "${coupon.code}" soft deleted.`,
      });

      logger.info(
        `Coupon soft deleted. Coupon: ${coupon.code}, Admin: ${req.user.email}`,
      );

      req.flash("success", "Coupon deleted successfully.");

      return res.redirect("/admin/coupons");
    } catch (error) {
      logger.error(`Soft delete coupon failed: ${error.message}`);

      req.flash("error", "Failed to delete coupon.");

      return res.redirect("/admin/coupons");
    }
  }

  // Restore coupon
  async restoreCoupon(req, res) {
    try {
      // Validate coupon ID
      const { error, value } = couponIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin/coupons");
      }

      const coupon = await Coupon.findOne({
        _id: value.couponId,
        isDeleted: true,
      });

      if (!coupon) {
        req.flash("error", "Coupon not found.");

        return res.redirect("/admin/coupons");
      }

      coupon.isDeleted = false;

      coupon.deletedAt = null;

      coupon.updatedBy = req.user._id;

      await coupon.save();

      // Create audit log
      await createAuditLog({
        user: req.user._id,

        action: "RESTORE_COUPON",

        resource: "Coupon",

        resourceId: coupon._id,

        details: `Coupon "${coupon.code}" restored.`,
      });

      logger.info(
        `Coupon restored. Coupon: ${coupon.code}, Admin: ${req.user.email}`,
      );

      req.flash("success", "Coupon restored successfully.");

      return res.redirect("/admin/coupons");
    } catch (error) {
      logger.error(`Restore coupon failed: ${error.message}`);

      req.flash("error", "Failed to restore coupon.");

      return res.redirect("/admin/coupons");
    }
  }
  // Permanently delete coupon
  async deleteCoupon(req, res) {
    try {
      // Validate coupon ID
      const { error, value } = couponIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin/coupons");
      }

      const coupon = await Coupon.findOne({
        _id: value.couponId,
        isDeleted: true,
      });

      if (!coupon) {
        req.flash(
          "error",
          "Coupon not found or must be soft deleted before permanent deletion.",
        );

        return res.redirect("/admin/coupons");
      }

      await Coupon.deleteOne({
        _id: coupon._id,
      });

      // Create audit log
      await createAuditLog({
        user: req.user._id,

        action: "DELETE_COUPON",

        resource: "Coupon",

        resourceId: coupon._id,

        details: `Coupon "${coupon.code}" permanently deleted.`,
      });

      logger.info(
        `Coupon permanently deleted. Coupon: ${coupon.code}, Admin: ${req.user.email}`,
      );

      req.flash("success", "Coupon permanently deleted successfully.");

      return res.redirect("/admin/coupons");
    } catch (error) {
      logger.error(`Delete coupon failed: ${error.message}`);

      req.flash("error", "Failed to permanently delete coupon.");

      return res.redirect("/admin/coupons");
    }
  }

  // Apply coupon
  async applyCoupon(req, res) {
    try {
      // Validate request body
      const { error, value } = applyCouponValidation.validate(req.body);

      if (error) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,

          message: error.details[0].message,
        });
      }

      const coupon = await Coupon.findOne({
        code: value.code,
        status: "active",
        isDeleted: false,
      });

      if (!coupon) {
        return res.status(httpStatusCode.NOT_FOUND).json({
          success: false,

          message: "Invalid coupon code.",
        });
      }

      const now = new Date();

      // Check coupon validity period
      if (now < coupon.validFrom || now > coupon.validUntil) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,

          message: "Coupon has expired or is not yet active.",
        });
      }

      // Check usage limit
      if (coupon.usedCount >= coupon.usageLimit) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,

          message: "Coupon usage limit has been reached.",
        });
      }

      // Check customer's previous usage
      const userUsageCount = await Order.countDocuments({
        user: req.user._id,

        coupon: coupon._id,

        orderStatus: {
          $nin: ["cancelled", "returned"],
        },
      });

      if (userUsageCount >= coupon.maximumUsagePerUser) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,

          message:
            "You have already used this coupon the maximum number of times.",
        });
      }

      logger.info(
        `Coupon "${coupon.code}" applied by customer ${req.user.email}.`,
      );

      return res.status(httpStatusCode.OK).json({
        success: true,

        message: "Coupon applied successfully.",

        coupon: {
          _id: coupon._id,

          code: coupon.code,

          discountType: coupon.discountType,

          discountValue: coupon.discountValue,

          minimumOrderAmount: coupon.minimumOrderAmount,

          maximumDiscountAmount: coupon.maximumDiscountAmount,
        },
      });
    } catch (error) {
      logger.error(`Apply coupon failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to apply coupon.",
      });
    }
  }
  // Remove coupon
  async removeCoupon(req, res) {
    try {
      logger.info(`Coupon removed by customer ${req.user.email}.`);

      return res.status(httpStatusCode.OK).json({
        success: true,

        message: "Coupon removed successfully.",
      });
    } catch (error) {
      logger.error(`Remove coupon failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to remove coupon.",
      });
    }
  }

  // Coupon options
  async getCouponOptions(req, res) {
    try {
      const coupons = await Coupon.aggregate([
        {
          $match: {
            status: "active",
            isDeleted: false,
          },
        },
        {
          $sort: {
            code: 1,
          },
        },
        {
          $project: {
            _id: 1,
            code: 1,
            discountType: 1,
            discountValue: 1,
          },
        },
      ]);

      return res.status(httpStatusCode.OK).json({
        success: true,
        data: coupons,
      });
    } catch (error) {
      logger.error(`Get coupon options failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to load coupons.",
      });
    }
  }
}

module.exports = new CouponController();
