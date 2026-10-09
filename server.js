// const dotenv = require("dotenv");
// const http = require("http");

// console.log("server.js started");

// dotenv.config();

// console.log("dotenv loaded");

// const app = require("./app");

// console.log("app loaded");

// const logger = require("./app/config/logger");

// console.log("logger loaded");

// const databaseConnection = require("./app/config/database");

// console.log("database config loaded");

// const { verifyEmailConnection } = require("./app/config/email");

// console.log("email config loaded");

// const { initializeSocket } = require("./app/socket/socket");
// const socketHandler = require("./app/socket/socketHandler");

// console.log("socket config loaded");

// const PORT = process.env.PORT || 5132;

// let server;
// let httpServer;

// const startServer = async () => {
//   try {
//     console.log("Starting MongoDB connection...");

//     await databaseConnection();

//     console.log("MongoDB connected");

//     console.log("Checking Resend configuration...");

//     await verifyEmailConnection();

//     console.log("Resend configured");

//     console.log("Creating HTTP server...");

//     httpServer = http.createServer(app);

//     console.log("Initializing Socket.IO...");

//     const io = initializeSocket(httpServer);

//     console.log("Registering socket handlers...");

//     socketHandler(io);

//     console.log("Starting HTTP server...");

//     server = httpServer.listen(PORT, "0.0.0.0", () => {
//       console.log(`Server running on port ${PORT}`);
//       logger.info(`Server is running on port ${PORT}.`);
//     });
//   } catch (error) {
//     console.error("APPLICATION STARTUP FAILED");
//     console.error("MESSAGE:", error.message);
//     console.error("STACK:", error.stack);

//     logger.error(`Application startup failed: ${error.message}`);

//     process.exit(1);
//   }
// };

// const gracefulShutdown = (signal) => {
//   console.log(`${signal} received. Shutting down server...`);

//   if (!server) {
//     process.exit(0);
//   }

//   server.close(() => {
//     logger.info("HTTP server closed.");
//     process.exit(0);
//   });
// };

// process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// process.on("unhandledRejection", (error) => {
//   console.error("UNHANDLED PROMISE REJECTION");
//   console.error(error);
//   console.error(error.stack);

//   logger.error(`Unhandled Promise Rejection: ${error.message}`);

//   gracefulShutdown("Unhandled Promise Rejection");
// });

// process.on("uncaughtException", (error) => {
//   console.error("UNCAUGHT EXCEPTION");
//   console.error(error);
//   console.error(error.stack);

//   logger.error(`Uncaught Exception: ${error.message}`);

//   process.exit(1);
// });

// startServer();

// console.log("1️⃣ server.js started");

// const dotenv = require("dotenv");

// console.log("2️⃣ dotenv package loaded");

// dotenv.config();

// console.log("3️⃣ dotenv loaded");

// console.log("4️⃣ Before requiring app.js");

// let app;

// try {
//   app = require("./app");
//   console.log("5️⃣ app.js loaded successfully");
// } catch (error) {
//   console.error("❌ APP.JS FAILED TO LOAD");
//   console.error(error);
//   console.error(error.stack);
//   process.exit(1);
// }

// console.log("6️⃣ Before requiring logger");

// let logger;

// try {
//   logger = require("./app/config/logger");
//   console.log("7️⃣ logger loaded");
// } catch (error) {
//   console.error("❌ LOGGER FAILED");
//   console.error(error);
//   console.error(error.stack);
//   process.exit(1);
// }

// console.log("8️⃣ Before requiring database");

// let databaseConnection;

// try {
//   databaseConnection = require("./app/config/database");
//   console.log("9️⃣ database loaded");
// } catch (error) {
//   console.error("❌ DATABASE MODULE FAILED");
//   console.error(error);
//   console.error(error.stack);
//   process.exit(1);
// }

// console.log("🔟 Before requiring email");

// let verifyEmailConnection;

// try {
//   ({ verifyEmailConnection } = require("./app/config/email"));
//   console.log("1️⃣1️⃣ email module loaded");
// } catch (error) {
//   console.error("❌ EMAIL MODULE FAILED");
//   console.error(error);
//   console.error(error.stack);
//   process.exit(1);
// }

// console.log("1️⃣2️⃣ Before requiring socket");

// let initializeSocket;
// let socketHandler;

// try {
//   ({ initializeSocket } = require("./app/socket/socket"));
//   socketHandler = require("./app/socket/socketHandler");

//   console.log("1️⃣3️⃣ socket modules loaded");
// } catch (error) {
//   console.error("❌ SOCKET MODULE FAILED");
//   console.error(error);
//   console.error(error.stack);
//   process.exit(1);
// }

// const http = require("http");

// console.log("1️⃣4️⃣ http loaded");

// const PORT = process.env.PORT || 5132;

// console.log("1️⃣5️⃣ PORT =", PORT);

// const startServer = async () => {
//   try {
//     console.log("1️⃣6️⃣ Connecting MongoDB...");

//     await databaseConnection();

//     console.log("1️⃣7️⃣ MongoDB connected");

//     console.log("1️⃣8️⃣ Verifying email configuration...");

//     await verifyEmailConnection();

//     console.log("1️⃣9️⃣ Email configuration verified");

//     const httpServer = http.createServer(app);

//     console.log("2️⃣0️⃣ HTTP server created");

//     const io = initializeSocket(httpServer);

//     console.log("2️⃣1️⃣ Socket initialized");

//     socketHandler(io);

//     console.log("2️⃣2️⃣ Socket handlers registered");

//     const server = httpServer.listen(PORT, "0.0.0.0", () => {
//       console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
//     });

//     process.on("SIGTERM", () => {
//       console.log("SIGTERM received");

//       server.close(() => {
//         process.exit(0);
//       });
//     });

//     process.on("SIGINT", () => {
//       console.log("SIGINT received");

//       server.close(() => {
//         process.exit(0);
//       });
//     });
//   } catch (error) {
//     console.error("🔥 STARTUP FAILED");
//     console.error(error);
//     console.error(error.stack);

//     process.exit(1);
//   }
// };

// startServer();

require("dotenv").config();

const http = require("http");
const app = require("./src/app");
const databaseConnection = require("./src/config/database");
const logger = require("./src/config/logger");
const { verifyEmailConnection } = require("./src/config/email");
const { initializeSocket } = require("./src/socket/socket");
const socketHandler = require("./src/socket/socketHandler");

const PORT = process.env.PORT || 5132;

let httpServer;

const startServer = async () => {
  try {
    // 1. Connect to MongoDB before accepting requests.
    await databaseConnection();
    console.log("MongoDB connected successfully.");

    // 2. Create the HTTP server.
    httpServer = http.createServer(app);

    // 3. Initialize Socket.IO.
    const io = initializeSocket(httpServer);
    socketHandler(io);

    // 4. Listen on the port provided by Render.
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Plantora server running on port ${PORT}`);
      logger.info(`Plantora server running on port ${PORT}`);

      // SMTP verification must not prevent the website from starting.
      verifyEmailConnection()
        .then(() => {
          console.log("SMTP connection verified successfully.");
        })
        .catch((error) => {
          console.error("SMTP connection verification failed:", error.message);
          logger.error(`SMTP verification failed: ${error.message}`);
        });
    });
  } catch (error) {
    console.error("Plantora startup failed:", error.message);
    logger.error(`Plantora startup failed: ${error.message}`);

    process.exit(1);
  }
};

// Gracefully close the HTTP server during shutdown.
const gracefulShutdown = (signal) => {
  console.log(`${signal} received. Shutting down Plantora...`);

  if (!httpServer) {
    process.exit(0);
    return;
  }

  httpServer.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
};

process.once("SIGINT", () => gracefulShutdown("SIGINT"));
process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
  logger.error(`Unhandled promise rejection: ${error.message}`);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  logger.error(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

startServer();
