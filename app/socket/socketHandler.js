const jwt = require("jsonwebtoken");

const User = require("../models/User");

const logger = require("../config/logger");

// Handle Socket.IO connections
const socketHandler = (io) => {
  io.on("connection", async (socket) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        logger.warn("Socket connection rejected. Missing token.");

        return socket.disconnect(true);
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      const user = await User.findById(decoded.id).select(
        "_id name email role",
      );

      if (!user) {
        logger.warn("Socket connection rejected. User not found.");

        return socket.disconnect(true);
      }

      // Join personal room
      socket.join(`user:${user._id}`);

      // Join role room
      if (user.role === "admin") {
        socket.join("admins");
      } else {
        socket.join("customers");
      }

      logger.info(
        `Socket connected. User: ${user.email}, Socket: ${socket.id}`,
      );

      socket.on("disconnect", () => {
        logger.info(
          `Socket disconnected. User: ${user.email}, Socket: ${socket.id}`,
        );
      });
    } catch (error) {
      logger.error(`Socket authentication failed: ${error.message}`);

      socket.disconnect(true);
    }
  });
};

module.exports = socketHandler;
