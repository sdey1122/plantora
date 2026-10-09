// Import configured Cloudinary instance
const cloudinary = require("../config/cloudinary");

// Import logger
const logger = require("../config/logger");

// Upload image to Cloudinary
const cloudinaryImageUpload = async (
  filePath,
  folder = process.env.CLOUDINARY_FOLDER,
) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "image",

      use_filename: true,
      unique_filename: true,
      overwrite: false,

      transformation: [
        {
          quality: "auto",
          fetch_format: "auto",
        },
      ],
    });

    logger.info(`Image uploaded successfully to '${folder}'.`);

    return result;
  } catch (error) {
    logger.error(`Cloudinary upload failed: ${error.message}`);

    throw error;
  }
};

// Export utility
module.exports = cloudinaryImageUpload;
