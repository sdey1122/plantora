// Import mongoose
const mongoose = require("mongoose");

// Import custom logger
const logger = require("./logger");

// Connect to MongoDB
const databaseConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    logger.info("MongoDB connected successfully.");
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);

    process.exit(1);
  }
};

// Export database connection
module.exports = databaseConnection;
