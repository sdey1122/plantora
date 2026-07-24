const { getIO } = require("./socket");

// Emit event to a specific user
const emitToUser = (userId, event, data) => {
  try {
    const io = getIO();

    io.to(`user:${userId}`).emit(event, data);
  } catch (error) {
    throw error;
  }
};

module.exports = emitToUser;
