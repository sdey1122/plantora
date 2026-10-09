// const { Server } = require("socket.io");

// let io = null;

// const initializeSocket = (httpServer) => {
//   io = new Server(httpServer, {
//     cors: {
//       origin: process.env.CLIENT_URL || "*",
//       credentials: true,
//       methods: ["GET", "POST"],
//     },
//   });

//   return io;
// };

// const getIO = () => {
//   if (!io) {
//     throw new Error("Socket.IO not initialized.");
//   }

//   return io;
// };

// module.exports = {
//   initializeSocket,
//   getIO,
// };

const { Server } = require("socket.io");

let io = null;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:3001",
  "https://your-plantora-frontend.vercel.app",
  ...(process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
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
