const express = require("express");

const NotificationController = require("../controllers/NotificationController");

const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Notification page
router.get(
  "/notifications",
  authMiddleware,
  NotificationController.showNotificationsPage,
);

// Latest notifications
router.get(
  "/notifications/latest",
  authMiddleware,
  NotificationController.getLatestNotifications,
);

// Unread notification count
router.get(
  "/notifications/unread-count",
  authMiddleware,
  NotificationController.getUnreadNotificationCount,
);

// Mark notification as read
router.patch(
  "/notifications/:notificationId/read",
  authMiddleware,
  NotificationController.markNotificationAsRead,
);

// Mark all notifications as read
router.patch(
  "/notifications/read-all",
  authMiddleware,
  NotificationController.markAllNotificationsAsRead,
);

// Delete notification
router.patch(
  "/notifications/:notificationId/delete",
  authMiddleware,
  NotificationController.deleteNotification,
);

// Delete all notifications
router.patch(
  "/notifications/delete-all",
  authMiddleware,
  NotificationController.deleteAllNotifications,
);

module.exports = router;
