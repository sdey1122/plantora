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
        req.flash("error", error.details[0].message);

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
            isEmailVerified: 1,
            seller: 1,
            profileImage: 1,
            lastLogin: 1,
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

      return res.render("admin/users/index", {
        title: "Users",
        users,
        currentPage: page,
        totalPages,
        totalUsers,
        limit,
        filters: value,
      });
    } catch (error) {
      logger.error(`Show users page failed: ${error.message}`);

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
        req.flash("error", error.details[0].message);

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

      return res.render("admin/users/trash", {
        title: "Deleted Users",
        users,
        currentPage: page,
        totalPages,
        totalUsers,
        limit,
        filters: value,
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
        req.flash("error", error.details[0].message);

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
        req.flash("error", "Customer not found.");

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
        req.flash("error", error.details[0].message);

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
        req.flash("error", "Seller not found.");

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
  // Update User
  async updateUser(req, res) {
    try {
      // Validate user id
      const { error: idError, value: idValue } = userIdValidation.validate(
        req.params,
      );

      if (idError) {
        req.flash("error", idError.details[0].message);

        return res.redirect("/admin/users");
      }

      // Validate request body
      const { error, value } = updateUserValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect(`/admin/users/${idValue.userId}`);
      }

      const { userId } = idValue;

      const { name, status, adminRemark } = value;

      const user = await User.findOne({
        _id: userId,
        isDeleted: false,
      });

      if (!user) {
        req.flash("error", "User not found.");

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
        severity: "low",
        target: {
          id: user._id,
          model: "User",
        },
        description: `Updated user "${user.name}".`,
      });

      logger.info(
        `User updated successfully. User ID: ${user._id}, Updated By: ${req.user._id}`,
      );

      req.flash("success", "User updated successfully.");

      return res.redirect(`/admin/users/${user._id}`);
    } catch (error) {
      logger.error(`Update user failed: ${error.message}`);

      req.flash("error", "Failed to update user.");

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
        req.flash("error", idError.details[0].message);

        return res.redirect("/admin/users");
      }

      // Validate request body
      const { error, value } = toggleUserStatusValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin/users");
      }

      const { userId } = idValue;

      const { status } = value;

      const user = await User.findOne({
        _id: userId,
        isDeleted: false,
      });

      if (!user) {
        req.flash("error", "User not found.");

        return res.redirect("/admin/users");
      }

      // Prevent changing own status
      if (user._id.toString() === req.user._id.toString()) {
        req.flash("error", "You cannot change your own account status.");

        return res.redirect("/admin/users");
      }

      // Prevent unnecessary update
      if (user.status === status) {
        req.flash("error", `User is already ${status}.`);

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
        severity: "medium",
        target: {
          id: user._id,
          model: "User",
        },
        description: `Changed user status to "${status}".`,
      });

      logger.info(
        `User status changed to ${status}. User ID: ${user._id}, Updated By: ${req.user._id}`,
      );

      req.flash("success", "User status updated successfully.");

      return res.redirect("/admin/users");
    } catch (error) {
      logger.error(`Toggle user status failed: ${error.message}`);

      req.flash("error", "Failed to update user status.");

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
        req.flash("error", idError.details[0].message);

        return res.redirect("/admin/users");
      }

      // Validate request body
      const { error, value } = sellerApprovalValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin/users");
      }

      const { userId } = idValue;

      const { sellerStatus, adminRemark } = value;

      const user = await User.findOne({
        _id: userId,
        isDeleted: false,
      });

      if (!user) {
        req.flash("error", "User not found.");

        return res.redirect("/admin/users");
      }

      if (user.seller.status === "none") {
        req.flash("error", "This user has not requested a seller account.");

        return res.redirect("/admin/users");
      }

      if (user.seller.status === sellerStatus) {
        req.flash("error", `Seller request is already ${sellerStatus}.`);

        return res.redirect("/admin/users");
      }

      user.seller.status = sellerStatus;
      user.seller.adminRemark = adminRemark || "";

      if (sellerStatus === "approved") {
        user.seller.approvedAt = new Date();
        user.seller.approvedBy = req.user._id;
      }

      if (sellerStatus === "rejected") {
        user.seller.approvedAt = null;
        user.seller.approvedBy = null;
      }

      await user.save();

      // Notify user
      if (sellerStatus === "approved") {
        await sendNotification({
          recipient: user._id,
          sender: req.user._id,
          title: "Seller Request Approved",
          message: "Congratulations! Your seller account has been approved.",
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
          actionUrl: "/profile",
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
        severity: "medium",
        target: {
          id: user._id,
          model: "User",
        },
        description: `Seller request ${sellerStatus} for "${user.name}".`,
      });

      logger.info(
        `Seller approval updated. User ID: ${user._id}, Status: ${sellerStatus}, Updated By: ${req.user._id}`,
      );

      req.flash("success", `Seller request ${sellerStatus} successfully.`);

      return res.redirect("/admin/users");
    } catch (error) {
      logger.error(`Toggle seller approval failed: ${error.message}`);

      req.flash("error", "Failed to update seller approval.");

      return res.redirect("/admin/users");
    }
  }
  // Soft Delete User
  async softDeleteUser(req, res) {
    try {
      // Validate user id
      const { error, value } = userIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin/users");
      }

      const { userId } = value;

      const user = await User.findOne({
        _id: userId,
        isDeleted: false,
      });

      if (!user) {
        req.flash("error", "User not found.");

        return res.redirect("/admin/users");
      }

      // Prevent deleting own account
      if (user._id.toString() === req.user._id.toString()) {
        req.flash("error", "You cannot delete your own account.");

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

      logger.info(
        `User soft deleted. User ID: ${user._id}, Deleted By: ${req.user._id}`,
      );

      req.flash("success", "User moved to trash successfully.");

      return res.redirect("/admin/users");
    } catch (error) {
      logger.error(`Soft delete user failed: ${error.message}`);

      req.flash("error", "Failed to delete user.");

      return res.redirect("/admin/users");
    }
  }
  // Restore User
  async restoreUser(req, res) {
    try {
      // Validate user id
      const { error, value } = userIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin/users/trash");
      }

      const { userId } = value;

      const user = await User.findOne({
        _id: userId,
        isDeleted: true,
      });

      if (!user) {
        req.flash("error", "User not found.");

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
        severity: "medium",
        target: {
          id: user._id,
          model: "User",
        },
        description: `Restored user "${user.name}".`,
      });

      logger.info(
        `User restored successfully. User ID: ${user._id}, Restored By: ${req.user._id}`,
      );

      req.flash("success", "User restored successfully.");

      return res.redirect("/admin/users/trash");
    } catch (error) {
      logger.error(`Restore user failed: ${error.message}`);

      req.flash("error", "Failed to restore user.");

      return res.redirect("/admin/users/trash");
    }
  }
  // Permanent Delete User
  async deleteUser(req, res) {
    try {
      // Validate user id
      const { error, value } = userIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin/users/trash");
      }

      const { userId } = value;

      const user = await User.findOne({
        _id: userId,
        isDeleted: true,
      });

      if (!user) {
        req.flash("error", "User not found.");

        return res.redirect("/admin/users/trash");
      }

      // Prevent deleting own account
      if (user._id.toString() === req.user._id.toString()) {
        req.flash("error", "You cannot permanently delete your own account.");

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
        `User permanently deleted. User ID: ${user._id}, Deleted By: ${req.user._id}`,
      );

      req.flash("success", "User deleted permanently.");

      return res.redirect("/admin/users/trash");
    } catch (error) {
      logger.error(`Permanent delete user failed: ${error.message}`);

      req.flash("error", "Failed to permanently delete user.");

      return res.redirect("/admin/users/trash");
    }
  }
}

module.exports = new UserController();
