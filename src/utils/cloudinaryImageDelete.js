// Import configured Cloudinary instance
const cloudinary = require("../config/cloudinary");

// Import logger
const logger = require("../config/logger");

// Delete image from Cloudinary
const cloudinaryImageDelete = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);

    logger.info(`Image '${publicId}' deleted successfully.`);
  } catch (error) {
    logger.error(`Cloudinary delete failed: ${error.message}`);

    throw error;
  }
};

// Export utility
module.exports = cloudinaryImageDelete;
