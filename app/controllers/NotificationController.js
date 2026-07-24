const mongoose = require("mongoose");

const Notification = require("../models/Notification");

const logger = require("../config/logger");

const httpStatusCode = require("../utils/httpStatusCode");

const createAuditLog = require("../utils/createAuditLog");

const {
  notificationIdValidation,
  markNotificationAsReadValidation,
  markAllNotificationsAsReadValidation,
  notificationQueryValidation,
} = require("../validations/notificationValidation");

class NotificationController {
  // Show notifications page
  async showNotificationsPage(req, res) {
    try {
      // Validate query
      const { error, value } = notificationQueryValidation.validate(req.query);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/");
      }

      const { page, limit, type, isRead, sortBy, sortOrder } = value;

      const matchStage = {
        recipient: new mongoose.Types.ObjectId(req.user._id),

        isDeleted: false,
      };

      if (type) {
        matchStage.type = type;
      }

      if (isRead !== undefined) {
        matchStage.isRead = isRead;
      }

      const result = await Notification.aggregate([
        {
          $match: matchStage,
        },

        {
          $lookup: {
            from: "users",
            localField: "sender",
            foreignField: "_id",
            as: "sender",
          },
        },

        {
          $unwind: {
            path: "$sender",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            title: 1,

            message: 1,

            type: 1,

            actionUrl: 1,

            isRead: 1,

            readAt: 1,

            createdAt: 1,

            sender: {
              _id: "$sender._id",

              name: "$sender.name",

              email: "$sender.email",
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
            notifications: [
              {
                $skip: (page - 1) * limit,
              },

              {
                $limit: limit,
              },
            ],

            totalNotifications: [
              {
                $count: "count",
              },
            ],

            unreadCount: [
              {
                $match: {
                  isRead: false,
                },
              },

              {
                $count: "count",
              },
            ],
          },
        },
      ]);

      const notifications = result[0].notifications;

      const totalNotifications =
        result[0].totalNotifications.length > 0
          ? result[0].totalNotifications[0].count
          : 0;

      const unreadCount =
        result[0].unreadCount.length > 0 ? result[0].unreadCount[0].count : 0;

      logger.info(`Notifications viewed. User: ${req.user.email}`);

      return res.status(httpStatusCode.OK).render("notifications/index", {
        title: "Notifications",

        notifications,

        unreadCount,

        filters: value,

        pagination: {
          currentPage: page,

          totalPages: Math.ceil(totalNotifications / limit),

          totalNotifications,

          limit,
        },
      });
    } catch (error) {
      logger.error(`Show notifications failed: ${error.message}`);

      req.flash("error", "Failed to load notifications.");

      return res.redirect("/");
    }
  }

  // Mark notification as read
  async markNotificationAsRead(req, res) {
    try {
      // Validate notification ID
      const { error, value } = markNotificationAsReadValidation.validate(
        req.params,
      );

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/notifications");
      }

      const notification = await Notification.findOne({
        _id: value.notificationId,

        recipient: req.user._id,

        isDeleted: false,
      });

      if (!notification) {
        req.flash("error", "Notification not found.");

        return res.redirect("/notifications");
      }

      notification.isRead = true;

      notification.readAt = new Date();

      await notification.save();

      await createAuditLog({
        user: req.user._id,

        action: "READ_NOTIFICATION",

        resource: "Notification",

        resourceId: notification._id,

        details: `Notification marked as read.`,
      });

      logger.info(`Notification marked as read. User: ${req.user.email}`);

      req.flash("success", "Notification marked as read.");

      return res.redirect(notification.actionUrl || "/notifications");
    } catch (error) {
      logger.error(`Mark notification as read failed: ${error.message}`);

      req.flash("error", "Failed to update notification.");

      return res.redirect("/notifications");
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(req, res) {
    try {
      // Validate request
      const { error } = markAllNotificationsAsReadValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/notifications");
      }

      await Notification.updateMany(
        {
          recipient: req.user._id,

          isRead: false,

          isDeleted: false,
        },
        {
          $set: {
            isRead: true,

            readAt: new Date(),
          },
        },
      );

      await createAuditLog({
        user: req.user._id,

        action: "READ_ALL_NOTIFICATIONS",

        resource: "Notification",

        details: "All notifications marked as read.",
      });

      logger.info(`All notifications marked as read. User: ${req.user.email}`);

      req.flash("success", "All notifications marked as read.");

      return res.redirect("/notifications");
    } catch (error) {
      logger.error(`Mark all notifications as read failed: ${error.message}`);

      req.flash("error", "Failed to update notifications.");

      return res.redirect("/notifications");
    }
  }
  // Delete notification
  async deleteNotification(req, res) {
    try {
      // Validate notification ID
      const { error, value } = notificationIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/notifications");
      }

      const notification = await Notification.findOne({
        _id: value.notificationId,

        recipient: req.user._id,

        isDeleted: false,
      });

      if (!notification) {
        req.flash("error", "Notification not found.");

        return res.redirect("/notifications");
      }

      notification.isDeleted = true;

      notification.deletedAt = new Date();

      await notification.save();

      await createAuditLog({
        user: req.user._id,

        action: "DELETE_NOTIFICATION",

        resource: "Notification",

        resourceId: notification._id,

        details: "Notification deleted.",
      });

      logger.info(`Notification deleted. User: ${req.user.email}`);

      req.flash("success", "Notification deleted successfully.");

      return res.redirect("/notifications");
    } catch (error) {
      logger.error(`Delete notification failed: ${error.message}`);

      req.flash("error", "Failed to delete notification.");

      return res.redirect("/notifications");
    }
  }

  // Delete all notifications
  async deleteAllNotifications(req, res) {
    try {
      await Notification.updateMany(
        {
          recipient: req.user._id,

          isDeleted: false,
        },
        {
          $set: {
            isDeleted: true,

            deletedAt: new Date(),
          },
        },
      );

      await createAuditLog({
        user: req.user._id,

        action: "DELETE_ALL_NOTIFICATIONS",

        resource: "Notification",

        details: "All notifications deleted.",
      });

      logger.info(`All notifications deleted. User: ${req.user.email}`);

      req.flash("success", "All notifications deleted successfully.");

      return res.redirect("/notifications");
    } catch (error) {
      logger.error(`Delete all notifications failed: ${error.message}`);

      req.flash("error", "Failed to delete notifications.");

      return res.redirect("/notifications");
    }
  }

  // Get unread notification count
  async getUnreadNotificationCount(req, res) {
    try {
      const unreadCount = await Notification.countDocuments({
        recipient: req.user._id,

        isRead: false,

        isDeleted: false,
      });

      return res.status(httpStatusCode.OK).json({
        success: true,

        unreadCount,
      });
    } catch (error) {
      logger.error(`Get unread notification count failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to load notification count.",
      });
    }
  }
  // Get latest notifications
  async getLatestNotifications(req, res) {
    try {
      const notifications = await Notification.aggregate([
        {
          $match: {
            recipient: new mongoose.Types.ObjectId(req.user._id),

            isDeleted: false,
          },
        },

        {
          $lookup: {
            from: "users",
            localField: "sender",
            foreignField: "_id",
            as: "sender",
          },
        },

        {
          $unwind: {
            path: "$sender",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            title: 1,

            message: 1,

            type: 1,

            actionUrl: 1,

            isRead: 1,

            createdAt: 1,

            sender: {
              _id: "$sender._id",

              name: "$sender.name",
            },
          },
        },

        {
          $sort: {
            createdAt: -1,
          },
        },

        {
          $limit: 10,
        },
      ]);

      return res.status(httpStatusCode.OK).json({
        success: true,

        notifications,
      });
    } catch (error) {
      logger.error(`Get latest notifications failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to load notifications.",
      });
    }
  }
}

module.exports = new NotificationController();
