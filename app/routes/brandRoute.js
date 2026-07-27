const express = require("express");

const BrandController = require("../controllers/BrandController");

const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRoles");

const {
  uploadBrandLogo,
  handleUploadError,
} = require("../middlewares/uploadMiddleware");

const router = express.Router();

// Customer routes
router.get("/brands/:slug", BrandController.showBrandProductsPage);

// Admin routes
router.get(
  "/admin/brands",
  authMiddleware,
  authorizeRoles("admin"),
  BrandController.showBrandsPage,
);

router.get(
  "/admin/brands/create",
  authMiddleware,
  authorizeRoles("admin"),
  BrandController.showCreateBrandPage,
);

router.post(
  "/admin/brands/create",
  authMiddleware,
  authorizeRoles("admin"),
  uploadBrandLogo,
  handleUploadError,
  BrandController.createBrand,
);

router.get(
  "/admin/brands/:brandId/edit",
  authMiddleware,
  authorizeRoles("admin"),
  BrandController.showEditBrandPage,
);

router.post(
  "/admin/brands/:brandId/edit",
  authMiddleware,
  authorizeRoles("admin"),
  uploadBrandLogo,
  handleUploadError,
  BrandController.updateBrand,
);

router.patch(
  "/admin/brands/:brandId/soft-delete",
  authMiddleware,
  authorizeRoles("admin"),
  BrandController.softDeleteBrand,
);

router.patch(
  "/admin/brands/:brandId/restore",
  authMiddleware,
  authorizeRoles("admin"),
  BrandController.restoreBrand,
);

router.delete(
  "/admin/brands/:brandId/delete",
  authMiddleware,
  authorizeRoles("admin"),
  BrandController.deleteBrand,
);

module.exports = router;
