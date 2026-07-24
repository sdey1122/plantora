const { getIO } = require("./socket");

// Emit event to all admins
const emitToAdmins = (event, data) => {
  try {
    const io = getIO();

    io.to("admins").emit(event, data);
  } catch (error) {
    throw error;
  }
};

module.exports = emitToAdmins;
