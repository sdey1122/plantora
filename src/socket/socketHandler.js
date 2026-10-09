const jwt = require("jsonwebtoken");

const User = require("../models/User");

const socketHandler = (io) => {
  io.on("connection", async (socket) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return socket.disconnect(true);
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      const user = await User.findById(decoded.id).select("_id role");

      if (!user) {
        return socket.disconnect(true);
      }

      socket.join(`user:${user._id}`);

      socket.on("disconnect", () => {});
    } catch (error) {
      socket.disconnect(true);
    }
  });
};

module.exports = socketHandler;
