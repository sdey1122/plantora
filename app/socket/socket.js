const { Server } = require("socket.io");

let io = null;

const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized.");
  }

  return io;
};

module.exports = {
  initializeSocket,
  getIO,
};
