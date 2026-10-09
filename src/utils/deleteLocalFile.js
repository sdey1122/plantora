// Import built-in packages
const fs = require("fs").promises;

// Import logger
const logger = require("../config/logger");

// Delete local file
const deleteLocalFile = async (filePath) => {
  try {
    if (!filePath) {
      return;
    }

    await fs.unlink(filePath);

    logger.info(`Local file deleted successfully: ${filePath}`);
  } catch (error) {
    // Ignore if file does not exist
    if (error.code === "ENOENT") {
      return;
    }

    logger.error(`Failed to delete local file: ${error.message}`);
  }
};

// Export utility
module.exports = deleteLocalFile;
