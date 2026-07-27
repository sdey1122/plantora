const express = require("express");

const BannerController = require("../controllers/BannerController");

const authMiddleware = require("../middlewares/authMiddleware");

const authorizeRoles = require("../middlewares/authorizeRoles");

const {
  uploadBannerImage,
  handleUploadError,
} = require("../middlewares/uploadMiddleware");

const router = express.Router();

// Customer routes
router.get("/banners", BannerController.showActiveBanners);

// Admin routes
router.get(
  "/admin/banners",
  authMiddleware,
  authorizeRoles("admin"),
  BannerController.showBannersPage,
);

router.get(
  "/admin/banners/create",
  authMiddleware,
  authorizeRoles("admin"),
  BannerController.showCreateBannerPage,
);

router.post(
  "/admin/banners",
  authMiddleware,
  authorizeRoles("admin"),
  uploadBannerImage,
  handleUploadError,
  BannerController.createBanner,
);

router.get(
  "/admin/banners/:bannerId/edit",
  authMiddleware,
  authorizeRoles("admin"),
  BannerController.showEditBannerPage,
);

router.put(
  "/admin/banners/:bannerId",
  authMiddleware,
  authorizeRoles("admin"),
  uploadBannerImage,
  handleUploadError,
  BannerController.updateBanner,
);

router.patch(
  "/admin/banners/:bannerId/delete",
  authMiddleware,
  authorizeRoles("admin"),
  BannerController.softDeleteBanner,
);

router.patch(
  "/admin/banners/:bannerId/restore",
  authMiddleware,
  authorizeRoles("admin"),
  BannerController.restoreBanner,
);

router.delete(
  "/admin/banners/:bannerId",
  authMiddleware,
  authorizeRoles("admin"),
  BannerController.deleteBanner,
);

module.exports = router;
