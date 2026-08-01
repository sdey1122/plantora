const { getIO } = require("./socket");

// Emit notification to a specific user
const emitToUser = (userId, event, data) => {
  const io = getIO();

  io.to(`user:${userId.toString()}`).emit(event, data);
};

module.exports = emitToUser;
