const mongoose = require("mongoose");

const User = require("../models/User");
const createAuditLog = require("../utils/createAuditLog");
const cloudinaryImageDelete = require("../utils/cloudinaryImageDelete");

const logger = require("../config/logger");

const sendNotification = require("../utils/sendNotification");
const sendEmail = require("../utils/sendEmail");

const {
  getSellerApprovedEmail,
  getSellerRejectedEmail,
} = require("../utils/emailTemplates");

const {
  userQueryValidation,
  userIdValidation,
  updateUserValidation,
  toggleUserStatusValidation,
  sellerApprovalValidation,
} = require("../validations/userValidation");

class UserController {
  // Users Page
  async showUsersPage(req, res) {
    try {
      // Validate query
      const { error, value } = userQueryValidation.validate(req.query);

      if (error) {
        logger.warn(
          `Invalid query parameters received while opening User Management. Reason: ${error.details[0].message}`,
        );

        return res.redirect("/admin/users");
      }

      const {
        page,
        limit,
        search,
        role,
        status,
        sellerStatus,
        isEmailVerified,
        sortBy,
        sortOrder,
      } = value;

      const matchStage = {
        isDeleted: false,
      };

      // Search
      if (search) {
        matchStage.$or = [
          {
            name: {
              $regex: search,
              $options: "i",
            },
          },
          {
            email: {
              $regex: search,
              $options: "i",
            },
          },
        ];
      }

      // Filters
      if (role) {
        matchStage.role = role;
      }

      if (status) {
        matchStage.status = status;
      }

      if (sellerStatus) {
        matchStage["seller.status"] = sellerStatus;
      }

      if (typeof isEmailVerified === "boolean") {
        matchStage.isEmailVerified = isEmailVerified;
      }

      const sortStage = {
        [sortBy]: sortOrder === "asc" ? 1 : -1,
      };

      const skip = (page - 1) * limit;

      const [result] = await User.aggregate([
        {
          $match: matchStage,
        },
        {
          $facet: {
            users: [
              {
                $project: {
                  name: 1,
                  email: 1,
                  role: 1,
                  status: 1,
                  seller: 1,
                  isEmailVerified: 1,
                  profileImage: 1,
                  lastLogin: 1,
                  createdAt: 1,

                  totalPurchases: {
                    $literal: 0,
                  },

                  totalProducts: {
                    $literal: 0,
                  },

                  totalSoldProducts: {
                    $literal: 0,
                  },
                },
              },
              {
                $sort: sortStage,
              },
              {
                $skip: skip,
              },
              {
                $limit: limit,
              },
            ],

            totalUsers: [
              {
                $count: "count",
              },
            ],

            statistics: [
              {
                $group: {
                  _id: null,

                  totalUsers: {
                    $sum: 1,
                  },

                  customers: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$role", "customer"],
                        },
                        1,
                        0,
                      ],
                    },
                  },

                  admins: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$role", "admin"],
                        },
                        1,
                        0,
                      ],
                    },
                  },

                  activeUsers: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$status", "active"],
                        },
                        1,
                        0,
                      ],
                    },
                  },

                  blockedUsers: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$status", "blocked"],
                        },
                        1,
                        0,
                      ],
                    },
                  },

                  pendingSellers: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$seller.status", "pending"],
                        },
                        1,
                        0,
                      ],
                    },
                  },

                  approvedSellers: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$seller.status", "approved"],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      ]);

      const users = result.users;

      const totalUsers = result.totalUsers[0]?.count || 0;

      const totalPages = Math.ceil(totalUsers / limit);

      const statistics = result.statistics[0] || {};

      statistics.sellers = statistics.approvedSellers || 0;

      statistics.verified = statistics.activeUsers || 0;

      statistics.unverified = statistics.blockedUsers || 0;

      statistics.deleted = 0;

      //   return res.render("admin/users/index", {
      //     title: "Users",
      //     users,
      //     currentPage: page,
      //     totalPages,
      //     totalUsers,
      //     limit,
      //     filters: value,
      //     statistics,
      //   });

      return res.render("admin/users/index", {
        title: "User Management",

        pageTitle: "User Management",

        users,

        statistics,

        filters: value,

        currentPage: page,

        totalPages,

        totalUsers,

        limit,

        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalUsers,
          startItem: totalUsers === 0 ? 0 : (page - 1) * limit + 1,
          endItem: Math.min(page * limit, totalUsers),
          hasPrevPage: page > 1,
          hasNextPage: page < totalPages,
        },
        currentUser: req.user,
      });
    } catch (error) {
      logger.error(
        `Failed to load User Management page. Error: ${error.message}`,
      );

      return res.status(500).render("errors/500", {
        title: "Server Error",
      });
    }
  }
  // Deleted Users Page
  async showDeletedUsersPage(req, res) {
    try {
      // Validate query
      const { error, value } = userQueryValidation.validate(req.query);

      if (error) {
        logger.warn(
          `Invalid query parameters received while opening Trash page.: ${error.details[0].message}`,
        );

        return res.redirect("/admin/users/trash");
      }

      const {
        page,
        limit,
        search,
        role,
        status,
        sellerStatus,
        isEmailVerified,
        sortBy,
        sortOrder,
      } = value;

      const matchStage = {
        isDeleted: true,
      };

      // Search
      if (search) {
        matchStage.$or = [
          {
            name: {
              $regex: search,
              $options: "i",
            },
          },
          {
            email: {
              $regex: search,
              $options: "i",
            },
          },
        ];
      }

      // Filters
      if (role) {
        matchStage.role = role;
      }

      if (status) {
        matchStage.status = status;
      }

      if (sellerStatus) {
        matchStage["seller.status"] = sellerStatus;
      }

      if (typeof isEmailVerified === "boolean") {
        matchStage.isEmailVerified = isEmailVerified;
      }

      const sortStage = {
        [sortBy]: sortOrder === "asc" ? 1 : -1,
      };

      const skip = (page - 1) * limit;

      const users = await User.aggregate([
        {
          $match: matchStage,
        },

        {
          $project: {
            name: 1,
            email: 1,
            role: 1,
            status: 1,
            seller: 1,
            isEmailVerified: 1,
            profileImage: 1,
            deletedAt: 1,
            createdAt: 1,
          },
        },

        {
          $sort: sortStage,
        },

        {
          $skip: skip,
        },

        {
          $limit: limit,
        },
      ]);

      const totalUsers = await User.countDocuments(matchStage);

      const totalPages = Math.ceil(totalUsers / limit);

      const statistics = {
        totalUsers,

        customers: users.filter((user) => user.seller?.status !== "approved")
          .length,

        sellers: users.filter((user) => user.seller?.status === "approved")
          .length,

        verified: users.filter((user) => user.isEmailVerified).length,

        deleted: totalUsers,
      };

      const filters = value;

      const pagination = {
        currentPage: page,

        totalPages,

        totalItems: totalUsers,

        startItem: totalUsers === 0 ? 0 : (page - 1) * limit + 1,

        endItem: Math.min(page * limit, totalUsers),

        hasPrevPage: page > 1,

        hasNextPage: page < totalPages,
      };

      return res.render("admin/trash/index", {
        title: "Trash",

        pageTitle: "Trash",

        users,

        statistics,

        filters,

        pagination,

        currentUser: req.user,
      });
    } catch (error) {
      logger.error(`Show deleted users page failed: ${error.message}`);

      return res.status(500).render("errors/500", {
        title: "Server Error",
      });
    }
  }
  // Customer Details Page
  async showCustomerDetails(req, res) {
    try {
      // Validate user id
      const { error, value } = userIdValidation.validate(req.params);

      if (error) {
        logger.warn(`Invalid customer ID. Reason: ${error.details[0].message}`);

        return res.redirect("/admin/users");
      }

      const { userId } = value;

      const users = await User.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(userId),
            role: "customer",
            isDeleted: false,
          },
        },

        {
          $project: {
            name: 1,
            email: 1,
            profileImage: 1,
            role: 1,
            status: 1,
            seller: 1,
            isEmailVerified: 1,
            termsAccepted: 1,
            termsAcceptedAt: 1,
            failedLoginAttempts: 1,
            accountLockedUntil: 1,
            lockReason: 1,
            lastLogin: 1,
            lastActive: 1,
            passwordChangedAt: 1,
            emailChangedAt: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]);

      if (!users.length) {
        logger.warn(`Customer not found. Requested User ID: ${userId}`);

        return res.redirect("/admin/users");
      }

      return res.render("admin/users/customer-details", {
        title: "Customer Details",
        user: users[0],
      });
    } catch (error) {
      logger.error(`Show customer details failed: ${error.message}`);

      return res.status(500).render("errors/500", {
        title: "Server Error",
      });
    }
  }
  // Seller Details Page
  async showSellerDetails(req, res) {
    try {
      // Validate user id
      const { error, value } = userIdValidation.validate(req.params);

      if (error) {
        logger.warn(`Invalid seller ID. Reason: ${error.details[0].message}`);

        return res.redirect("/admin/users");
      }

      const { userId } = value;

      const users = await User.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(userId),
            role: "customer",
            "seller.status": "approved",
            isDeleted: false,
          },
        },

        {
          $project: {
            name: 1,
            email: 1,
            profileImage: 1,
            role: 1,
            status: 1,
            isEmailVerified: 1,
            seller: 1,
            termsAccepted: 1,
            termsAcceptedAt: 1,
            failedLoginAttempts: 1,
            accountLockedUntil: 1,
            lockReason: 1,
            lastLogin: 1,
            lastActive: 1,
            passwordChangedAt: 1,
            emailChangedAt: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]);

      if (!users.length) {
        logger.warn(`Seller not found. Requested User ID: ${userId}`);

        return res.redirect("/admin/users");
      }

      return res.render("admin/users/seller-details", {
        title: "Seller Details",
        user: users[0],
      });
    } catch (error) {
      logger.error(`Show seller details failed: ${error.message}`);

      return res.status(500).render("errors/500", {
        title: "Server Error",
      });
    }
  }

  // Show Seller Request Page
  async showSellerRequestPage(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findOne({
        _id: userId,
        isDeleted: false,
      });

      if (!user) {
        logger.warn(`User not found. Requested User ID: ${userId}`);
        return res.status(404).render("errors/404", {
          title: "User Not Found",
        });
      }

      if (user.seller.status !== "pending") {
        return res.render("admin/users/seller-rejected", {
          title: "Seller Request",
          message: "This seller request is no longer pending.",
        });
      }

      return res.render("admin/users/seller-request", {
        title: "Seller Request",
        user,
      });
    } catch (error) {
      logger.error(`Show seller request page failed: ${error.message}`);

      return res.status(500).render("errors/500", {
        title: "Server Error",
      });
    }
  }

  // Approve Seller
  async approveSeller(req, res) {
    try {
      const user = await User.findById(req.params.userId);
      const adminRemark = req.body.adminRemark || "";

      if (!user) {
        return res.status(404).render("errors/404", {
          title: "User Not Found",
        });
      }

      user.seller.status = "approved";
      user.seller.approvedAt = new Date();
      user.seller.approvedBy = req.user._id;
      user.seller.adminRemark = adminRemark;

      await user.save();

      await sendNotification({
        recipient: user._id,
        sender: req.user._id,
        title: "Seller Account Approved",
        message: adminRemark
          ? `Congratulations! Your seller account has been approved.\n\nAdmin Remark: ${adminRemark}`
          : "Congratulations! Your seller account has been approved.",
        type: "seller",
        referenceType: "User",
        referenceId: user._id,
        actionUrl: "/auth/profile",
      });

      const { subject, html, text } = getSellerApprovedEmail(
        user.name,
        `${process.env.APP_URL}/auth/profile`,
      );

      await sendEmail({
        to: user.email,
        subject,
        html,
        text,
      });

      await createAuditLog({
        req,
        actor: req.user,
        module: "Seller",
        action: "approve_seller",
        severity: "warning",
        target: {
          id: user._id,
          model: "User",
        },
        description: `Approved seller request for ${user.name}.`,
      });

      return res.render("admin/users/seller-approved", {
        title: "Seller Approved",
        user,
      });
    } catch (error) {
      logger.error(`Failed to approve seller request. Error: ${error.message}`);

      return res.status(500).render("errors/500", {
        title: "Server Error",
      });
    }
  }

  // Reject Seller
  async rejectSeller(req, res) {
    try {
      const user = await User.findById(req.params.userId);

      if (!user) {
        return res.status(404).render("errors/404", {
          title: "User Not Found",
        });
      }

      const remark = req.body.adminRemark || "No reason provided.";

      user.seller.status = "rejected";
      user.seller.rejectedAt = new Date();
      user.seller.adminRemark = remark;

      await user.save();

      await sendNotification({
        recipient: user._id,
        sender: req.user._id,
        title: "Seller Request Rejected",
        message: remark
          ? `Your seller application has been rejected.\n\nReason:\n${remark}`
          : "Your seller application has been rejected.",
        type: "seller",
        referenceType: "User",
        referenceId: user._id,
        actionUrl: "/auth/profile",
      });

      const { subject, html, text } = getSellerRejectedEmail(user.name, remark);

      await sendEmail({
        to: user.email,
        subject,
        html,
        text,
      });

      await createAuditLog({
        req,
        actor: req.user,
        module: "Seller",
        action: "reject_seller",
        severity: "warning",
        target: {
          id: user._id,
          model: "User",
        },
        description: `Rejected seller request for ${user.name}.`,
      });

      return res.render("admin/users/seller-rejected", {
        title: "Seller Rejected",
        user,
        remark,
      });
    } catch (error) {
      logger.error(`Failed to reject seller request. Error: ${error.message}`);

      return res.status(500).render("errors/500", {
        title: "Server Error",
      });
    }
  }

  // Update User
  async updateUser(req, res) {
    try {
      // Validate user id
      const { error: idError, value: idValue } = userIdValidation.validate(
        req.params,
      );

      if (idError) {
        logger.warn(
          `Invalid User ID received from admin ${req.user.email}. Reason: ${idError.details[0].message}`,
        );

        return res.redirect("/admin/users");
      }

      // Validate request body
      const { error, value } = updateUserValidation.validate(req.body);

      if (error) {
        logger.warn(
          `Invalid update request. Reason: ${error.details[0].message}`,
        );

        return res.redirect(`/admin/users/${idValue.userId}`);
      }

      const { userId } = idValue;

      const { name, status, adminRemark } = value;

      const user = await User.findOne({
        _id: userId,
        isDeleted: false,
      });

      if (!user) {
        logger.warn(`User not found. Requested User ID: ${userId}`);

        return res.redirect("/admin/users");
      }

      // Update name
      if (name) {
        user.name = name;
      }

      // Update status
      if (status) {
        user.status = status;
      }

      // Update admin remark
      if (adminRemark !== undefined) {
        user.seller.adminRemark = adminRemark;
      }

      // Update profile image
      if (req.file) {
        if (
          user.profileImage.publicId &&
          user.profileImage.publicId !==
            process.env.DEFAULT_PROFILE_IMAGE_PUBLIC_ID
        ) {
          await cloudinaryImageDelete(user.profileImage.publicId);
        }

        user.profileImage = {
          publicId: req.file.filename,
          url: req.file.path,
        };
      }

      await user.save();

      await createAuditLog({
        req,
        actor: req.user,
        module: "User Management",
        action: "Update User",
        severity: "info",
        target: {
          id: user._id,
          model: "User",
        },
        description: `Updated user "${user.name}".`,
      });

      logger.info(
        `User "${user.name}" (${user.email}) updated successfully by ${req.user.email}.`,
      );

      return res.redirect("/admin/users");
    } catch (error) {
      logger.error(`Update user failed: ${error.message}`);

      return res.redirect("/admin/users");
    }
  }
  // Toggle User Status
  async toggleUserStatus(req, res) {
    try {
      // Validate user id
      const { error: idError, value: idValue } = userIdValidation.validate(
        req.params,
      );

      if (idError) {
        logger.warn(
          `Invalid User ID supplied by ${req.user.email}. Reason: ${idError.details[0].message}`,
        );

        return res.redirect("/admin/users");
      }
      // Validate request body
      const { error, value } = toggleUserStatusValidation.validate(req.body);

      if (error) {
        logger.warn(
          `Invalid status update request. Reason: ${error.details[0].message}`,
        );

        return res.redirect("/admin/users");
      }

      const { userId } = idValue;

      const { status } = value;

      const user = await User.findOne({
        _id: userId,
        isDeleted: false,
      });

      if (!user) {
        logger.warn(`User not found. Requested User ID: ${userId}`);

        return res.redirect("/admin/users");
      }

      // Prevent changing own status
      if (user._id.toString() === req.user._id.toString()) {
        logger.warn(
          `Admin ${req.user.email} attempted to change their own account status.`,
        );

        return res.redirect("/admin/users");
      }

      // Prevent unnecessary update
      if (user.status === status) {
        logger.info(
          `Status update skipped because "${user.name}" is already "${status}".`,
        );

        return res.redirect("/admin/users");
      }

      user.status = status;

      // Reset lock information when activating user
      if (status === "active") {
        user.failedLoginAttempts = 0;
        user.accountLockedUntil = null;
        user.lockReason = "";
        user.lockedBy = null;
      }

      await user.save();

      await createAuditLog({
        req,
        actor: req.user,
        module: "User Management",
        action: "Toggle User Status",
        severity: "warning",
        target: {
          id: user._id,
          model: "User",
        },
        description: `Changed user status to "${status}".`,
      });

      logger.info(
        `User status changed to ${status}. User ID: ${user._id}, Updated By: ${req.user._id}`,
      );

      logger.info(`User status updated successfully.`);

      return res.redirect("/admin/users");
    } catch (error) {
      logger.error(`Toggle user status failed: ${error.message}`);

      return res.redirect("/admin/users");
    }
  }
  // Toggle Seller Approval
  async toggleSellerApproval(req, res) {
    try {
      // Validate user id
      const { error: idError, value: idValue } = userIdValidation.validate(
        req.params,
      );

      if (idError) {
        logger.warn(
          `Invalid User ID supplied by ${req.user.email}. Reason: ${idError.details[0].message}`,
        );

        return res.redirect("/admin/users");
      }

      // Validate request body
      const { error, value } = sellerApprovalValidation.validate(req.body);

      if (error) {
        logger.warn(
          `Invalid seller approval request. Reason: ${error.details[0].message}`,
        );

        return res.redirect("/admin/users");
      }

      const { userId } = idValue;

      const { sellerStatus, adminRemark } = value;

      const user = await User.findOne({
        _id: userId,
        isDeleted: false,
      });

      if (!user) {
        logger.warn(`User not found. Requested User ID: ${userId}`);

        return res.redirect("/admin/users");
      }

      if (user.seller.status === "none") {
        logger.warn(
          `Seller approval skipped because user has not applied for seller access.`,
        );

        return res.redirect("/admin/users");
      }

      if (user.seller.status === sellerStatus) {
        logger.info(`Seller request already marked as "${sellerStatus}".`);

        return res.redirect("/admin/users");
      }

      user.seller.status = sellerStatus;
      user.seller.adminRemark = adminRemark || "";

      if (sellerStatus === "approved") {
        user.seller.approvedAt = new Date();
        user.seller.approvedBy = req.user._id;

        // clear previous rejection
        user.seller.requestedAt = null;
      }

      if (sellerStatus === "rejected") {
        user.seller.approvedAt = new Date();
        user.seller.approvedBy = null;

        // save rejection time
        user.seller.requestedAt = new Date();
      }

      await user.save();

      // Notify user
      if (sellerStatus === "approved") {
        await sendNotification({
          recipient: user._id,
          sender: req.user._id,
          title: "Seller Request Approved",
          message: adminRemark
            ? `Your seller application has been approved.\n\nRemark:\n${adminRemark}`
            : "Your seller application has been approved successfully.",
          type: "seller",
          referenceType: "User",
          referenceId: user._id,
          actionUrl: "/seller/dashboard",
        });

        const { subject, html, text } = getSellerApprovedEmail(
          user.name,
          `${process.env.APP_URL}/seller/dashboard`,
        );

        await sendEmail({
          to: user.email,
          subject,
          html,
          text,
        });
      }

      if (sellerStatus === "rejected") {
        await sendNotification({
          recipient: user._id,
          sender: req.user._id,
          title: "Seller Request Rejected",
          message:
            "Your seller request has been rejected. Please review the admin remark.",
          type: "seller",
          referenceType: "User",
          referenceId: user._id,
          actionUrl: "/auth/profile",
        });

        const { subject, html, text } = getSellerRejectedEmail(
          user.name,
          adminRemark,
        );

        await sendEmail({
          to: user.email,
          subject,
          html,
          text,
        });
      }

      await createAuditLog({
        req,
        actor: req.user,
        module: "User Management",
        action: "Seller Approval",
        severity: "warning",
        target: {
          id: user._id,
          model: "User",
        },
        description: `Seller request ${sellerStatus} for "${user.name}".`,
      });

      logger.info(
        `Seller approval updated. User ID: ${user._id}, Status: ${sellerStatus}, Updated By: ${req.user._id}`,
      );

      return res.redirect("/admin/users");
    } catch (error) {
      logger.error(`Toggle seller approval failed: ${error.message}`);

      return res.redirect("/admin/users");
    }
  }
  // Soft Delete User
  async softDeleteUser(req, res) {
    try {
      // Validate user id
      const { error, value } = userIdValidation.validate(req.params);

      if (error) {
        logger.warn(
          `Invalid user ID supplied. Reason: ${error.details[0].message}`,
        );

        return res.redirect("/admin/users");
      }

      const { userId } = value;

      const user = await User.findOne({
        _id: userId,
        isDeleted: false,
      });

      if (!user) {
        logger.warn(`User not found. Requested User ID: ${userId}`);

        return res.redirect("/admin/users");
      }

      // Prevent deleting own account
      if (user._id.toString() === req.user._id.toString()) {
        logger.warn(
          `Admin ${req.user.email} attempted to delete their own account.`,
        );

        return res.redirect("/admin/users");
      }

      user.isDeleted = true;

      user.deletedAt = new Date();

      await user.save();

      await createAuditLog({
        req,
        actor: req.user,
        module: "User Management",
        action: "Soft Delete User",
        severity: "high",
        target: {
          id: user._id,
          model: "User",
        },
        description: `Soft deleted user "${user.name}".`,
      });

      logger.info(`User "${user.name}" moved to Trash by ${req.user.email}.`);

      return res.redirect("/admin/users");
    } catch (error) {
      logger.error(`Soft delete user failed: ${error.message}`);

      return res.redirect("/admin/users");
    }
  }

  // Restore User
  async restoreUser(req, res) {
    try {
      // Validate user id
      const { error, value } = userIdValidation.validate(req.params);

      if (error) {
        logger.warn(
          `Invalid user ID supplied. Reason: ${error.details[0].message}`,
        );

        return res.redirect("/admin/users/trash");
      }

      const { userId } = value;

      const user = await User.findOne({
        _id: userId,
        isDeleted: true,
      });

      if (!user) {
        logger.warn(`User not found. Requested User ID: ${userId}`);

        return res.redirect("/admin/users/trash");
      }

      user.isDeleted = false;

      user.deletedAt = null;

      await user.save();

      await createAuditLog({
        req,
        actor: req.user,
        module: "User Management",
        action: "Restore User",
        severity: "warning",
        target: {
          id: user._id,
          model: "User",
        },
        description: `Restored user "${user.name}".`,
      });

      logger.info(
        `User "${user.name}" restored successfully by ${req.user.email}.`,
      );

      return res.redirect("/admin/users/trash");
    } catch (error) {
      logger.error(`Restore user failed: ${error.message}`);

      return res.redirect("/admin/users/trash");
    }
  }

  // Permanent Delete User
  async deleteUser(req, res) {
    try {
      // Validate user id
      const { error, value } = userIdValidation.validate(req.params);

      if (error) {
        logger.warn(
          `Invalid user ID supplied. Reason: ${error.details[0].message}`,
        );

        return res.redirect("/admin/users/trash");
      }

      const { userId } = value;

      const user = await User.findOne({
        _id: userId,
        isDeleted: true,
      });

      if (!user) {
        logger.warn(`User not found. Requested User ID: ${userId}`);

        return res.redirect("/admin/users/trash");
      }

      // Prevent deleting own account
      if (user._id.toString() === req.user._id.toString()) {
        logger.warn(
          `Admin ${req.user.email} attempted to permanently delete their own account.`,
        );

        return res.redirect("/admin/users/trash");
      }

      // Delete profile image from Cloudinary
      if (
        user.profileImage.publicId &&
        user.profileImage.publicId !==
          process.env.DEFAULT_PROFILE_IMAGE_PUBLIC_ID
      ) {
        await cloudinaryImageDelete(user.profileImage.publicId);
      }

      await User.deleteOne({
        _id: user._id,
      });

      await createAuditLog({
        req,
        actor: req.user,
        module: "User Management",
        action: "Delete User",
        severity: "critical",
        target: {
          id: user._id,
          model: "User",
        },
        description: `Permanently deleted user "${user.name}".`,
      });

      logger.info(
        `User "${user.name}" permanently deleted by ${req.user.email}.`,
      );

      return res.redirect("/admin/users/trash");
    } catch (error) {
      logger.error(
        `Failed to permanently delete user. Error: ${error.message}`,
      );

      return res.redirect("/admin/users/trash");
    }
  }
}

module.exports = new UserController();
