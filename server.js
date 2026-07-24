// Import package
const dotenv = require("dotenv");
const http = require("http");

// Load environment variables
dotenv.config();

// Import application
const app = require("./app");

// Import configurations
const logger = require("./app/config/logger");
const databaseConnection = require("./app/config/database");
const { redisConnection } = require("./app/config/redis");
const { verifyEmailConnection } = require("./app/config/email");

// Import Socket.IO
const { initializeSocket } = require("./app/socket/socket");
const socketHandler = require("./app/socket/socketHandler");

// Server port
const PORT = process.env.PORT || 5132;

// Server instances
let server;

let httpServer;

// Start application
const startServer = async () => {
  try {
    // Connect MongoDB
    await databaseConnection();

    // Connect Redis
    await redisConnection();

    // Verify email connection
    await verifyEmailConnection();

    // Create HTTP server
    httpServer = http.createServer(app);

    // Initialize Socket.IO
    const io = initializeSocket(httpServer);

    // Register socket events
    socketHandler(io);

    // Start HTTP server
    server = httpServer.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}.`);
    });
  } catch (error) {
    logger.error(`Application startup failed: ${error.message}`);

    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Shutting down server...`);

  if (!server) {
    process.exit(0);
  }

  server.close(() => {
    logger.info("HTTP server closed.");

    process.exit(0);
  });
};

// Handle process termination
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  logger.error(`Unhandled Promise Rejection: ${error.message}`);

  gracefulShutdown("Unhandled Promise Rejection");
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);

  process.exit(1);
});

// Start server
startServer();
