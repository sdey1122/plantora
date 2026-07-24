// Import core packages
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Import package
const multer = require("multer");

// Import utility
const httpStatusCode = require("../utils/httpStatusCode");

// Temporary upload directory
const uploadDirectory = path.join(__dirname, "../../uploads/temp");

// Create upload directory if it doesn't exist
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname);

    const uniqueFileName = `${crypto.randomUUID()}${extension}`;

    callback(null, uniqueFileName);
  },
});

// Validate uploaded file
const fileFilter = (req, file, callback) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    const error = new Error("Only JPG, JPEG, PNG and WEBP images are allowed.");

    error.statusCode = httpStatusCode.BAD_REQUEST;

    return callback(error);
  }

  callback(null, true);
};

// Shared Multer instance
const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
  },
});

// Handle upload errors
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = "File upload failed.";

    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        message = `Maximum file size allowed is ${
          Number(process.env.MAX_FILE_SIZE) / (1024 * 1024) || 5
        } MB.`;
        break;

      case "LIMIT_FILE_COUNT":
        message = "Too many files uploaded.";
        break;

      case "LIMIT_UNEXPECTED_FILE":
        message = "Unexpected file field.";
        break;

      default:
        break;
    }

    return res.status(httpStatusCode.BAD_REQUEST).json({
      success: false,
      message,
    });
  }

  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
};

// Upload profile image
const uploadProfileImage = upload.single("profileImage");

// Upload category image
const uploadCategoryImage = upload.single("categoryImage");

// Upload brand logo
const uploadBrandLogo = upload.single("brandLogo");

// Upload banner image
const uploadBannerImage = upload.single("bannerImage");

// Upload product images
const uploadProductImages = upload.array(
  "images",
  Number(process.env.MAX_PRODUCT_IMAGES) || 5,
);

// Upload review images
const uploadReviewImages = upload.array(
  "images",
  Number(process.env.MAX_REVIEW_IMAGES) || 5,
);

// Export middlewares
module.exports = {
  uploadProfileImage,
  uploadCategoryImage,
  uploadBrandLogo,
  uploadBannerImage,
  uploadProductImages,
  uploadReviewImages,
  handleUploadError,
};
