const Notification = require("../models/Notification");

const logger = require("../config/logger");

const emitToUser = require("../socket/emitToUser");

// Send notification
const sendNotification = async ({
  recipient,
  sender = null,
  title,
  message,
  type,
  referenceType = null,
  referenceId = null,
  actionUrl = "",
}) => {
  try {
    const notification = await Notification.create({
      recipient,

      sender,

      title,

      message,

      type,

      referenceType,

      referenceId,

      actionUrl,
    });

    emitToUser(recipient, "notification", notification);

    logger.info(
      `Notification sent successfully. Recipient: ${recipient}, Type: ${type}`,
    );

    return notification;
  } catch (error) {
    logger.error(`Send notification failed: ${error.message}`);

    throw error;
  }
};

module.exports = sendNotification;
