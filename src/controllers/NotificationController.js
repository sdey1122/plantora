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
  // Show Notifications Page
  async showNotificationsPage(req, res, next) {
    try {
      const notifications = await Notification.find({
        recipient: req.user._id,
        isDeleted: false,
      }).sort({
        createdAt: -1,
      });

      console.log("--------------------------------");
      console.log("Logged User:", req.user._id.toString());
      console.log("Notifications Found:", notifications.length);
      console.log(notifications);

      return res.render("notifications/index", {
        title: "Notifications",
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalNotifications: notifications.length,
          limit: 10,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  // Get Latest Notifications
  async getLatestNotifications(req, res, next) {
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
              email: "$sender.email",
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

      return next(error);
    }
  }

  // Get Unread Notification Count
  async getUnreadNotificationCount(req, res, next) {
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

      return next(error);
    }
  }

  // Mark Notification As Read
  async markNotificationAsRead(req, res, next) {
    try {
      const { error, value } = markNotificationAsReadValidation.validate(
        req.params,
      );

      if (error) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const notification = await Notification.findOne({
        _id: value.notificationId,
        recipient: req.user._id,
        isDeleted: false,
      });

      if (!notification) {
        return res.status(httpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Notification not found.",
        });
      }

      notification.isRead = true;
      notification.readAt = new Date();

      await notification.save();

      await createAuditLog({
        actor: req.user,
        module: "Notifications",
        action: "update",
        target: {
          model: "Notification",
          id: notification._id,
        },
        description: "Notification marked as read.",
        success: true,
      });

      logger.info(`Notification marked as read by ${req.user.email}`);

      return res.status(httpStatusCode.OK).json({
        success: true,
        message: "Notification marked as read.",
      });
    } catch (error) {
      logger.error(`Mark notification as read failed: ${error.message}`);

      return next(error);
    }
  }
  // Mark All Notifications As Read
  async markAllNotificationsAsRead(req, res, next) {
    try {
      const { error } = markAllNotificationsAsReadValidation.validate(req.body);

      if (error) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const result = await Notification.updateMany(
        {
          recipient: req.user._id,
          isDeleted: false,
          isRead: false,
        },
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          },
        },
      );

      await createAuditLog({
        actor: req.user,

        module: "Notifications",

        action: "update",

        description: "Marked all notifications as read.",

        success: true,

        metadata: {
          modifiedCount: result.modifiedCount,
        },
      });

      logger.info(`All notifications marked as read by ${req.user.email}`);

      return res.status(httpStatusCode.OK).json({
        success: true,
        message: "All notifications marked as read.",
      });
    } catch (error) {
      logger.error(`Mark all notifications failed: ${error.message}`);

      return next(error);
    }
  }

  // Delete Notification
  async deleteNotification(req, res, next) {
    try {
      const { error, value } = notificationIdValidation.validate(req.params);

      if (error) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const notification = await Notification.findOne({
        _id: value.notificationId,
        recipient: req.user._id,
        isDeleted: false,
      });

      if (!notification) {
        return res.status(httpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Notification not found.",
        });
      }

      notification.isDeleted = true;
      notification.deletedAt = new Date();

      await notification.save();

      await createAuditLog({
        actor: req.user,

        module: "Notifications",

        action: "delete",

        target: {
          model: "Notification",
          id: notification._id,
        },

        description: "Notification deleted.",

        success: true,
      });

      logger.info(`Notification deleted by ${req.user.email}`);

      return res.status(httpStatusCode.OK).json({
        success: true,
        message: "Notification deleted successfully.",
      });
    } catch (error) {
      logger.error(`Delete notification failed: ${error.message}`);

      return next(error);
    }
  }
  // Delete All Notifications
  async deleteAllNotifications(req, res, next) {
    try {
      const result = await Notification.updateMany(
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
        actor: req.user,

        module: "Notifications",

        action: "delete",

        description: "Deleted all notifications.",

        success: true,

        metadata: {
          modifiedCount: result.modifiedCount,
        },
      });

      logger.info(`All notifications deleted by ${req.user.email}`);

      return res.status(httpStatusCode.OK).json({
        success: true,
        message: "All notifications deleted successfully.",
      });
    } catch (error) {
      logger.error(`Delete all notifications failed: ${error.message}`);

      return next(error);
    }
  }
}

module.exports = new NotificationController();
