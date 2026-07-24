// Import Redis client
const { createClient } = require("redis");

// Import logger
const logger = require("./logger");

// Create Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL,
});

// Redis events
redisClient.on("connect", () => {
  logger.info("Connecting to Redis...");
});

redisClient.on("ready", () => {
  logger.info("Redis connected successfully.");
});

redisClient.on("error", (error) => {
  logger.error(`Redis error: ${error.message}`);
});

redisClient.on("reconnecting", () => {
  logger.warn("Redis reconnecting...");
});

redisClient.on("end", () => {
  logger.warn("Redis connection closed.");
});

// Connect Redis
const redisConnection = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error(`Redis connection failed: ${error.message}`);

    process.exit(1);
  }
};

module.exports = {
  redisClient,
  redisConnection,
};
