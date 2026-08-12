const dotenv = require("dotenv");
const http = require("http");

console.log("server.js started");

dotenv.config();

console.log("dotenv loaded");

const app = require("./app");

console.log("app loaded");

const logger = require("./app/config/logger");

console.log("logger loaded");

const databaseConnection = require("./app/config/database");

console.log("database config loaded");

const { verifyEmailConnection } = require("./app/config/email");

console.log("email config loaded");

const { initializeSocket } = require("./app/socket/socket");
const socketHandler = require("./app/socket/socketHandler");

console.log("socket config loaded");

const PORT = process.env.PORT || 5132;

let server;
let httpServer;

const startServer = async () => {
  try {
    console.log("Starting MongoDB connection...");

    await databaseConnection();

    console.log("MongoDB connected");

    console.log("Checking Resend configuration...");

    await verifyEmailConnection();

    console.log("Resend configured");

    console.log("Creating HTTP server...");

    httpServer = http.createServer(app);

    console.log("Initializing Socket.IO...");

    const io = initializeSocket(httpServer);

    console.log("Registering socket handlers...");

    socketHandler(io);

    console.log("Starting HTTP server...");

    server = httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
      logger.info(`Server is running on port ${PORT}.`);
    });
  } catch (error) {
    console.error("APPLICATION STARTUP FAILED");
    console.error("MESSAGE:", error.message);
    console.error("STACK:", error.stack);

    logger.error(`Application startup failed: ${error.message}`);

    process.exit(1);
  }
};

const gracefulShutdown = (signal) => {
  console.log(`${signal} received. Shutting down server...`);

  if (!server) {
    process.exit(0);
  }

  server.close(() => {
    logger.info("HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("unhandledRejection", (error) => {
  console.error("UNHANDLED PROMISE REJECTION");
  console.error(error);
  console.error(error.stack);

  logger.error(`Unhandled Promise Rejection: ${error.message}`);

  gracefulShutdown("Unhandled Promise Rejection");
});

process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT EXCEPTION");
  console.error(error);
  console.error(error.stack);

  logger.error(`Uncaught Exception: ${error.message}`);

  process.exit(1);
});

startServer();
