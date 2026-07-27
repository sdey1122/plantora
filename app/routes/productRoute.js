const express = require("express");
const ProductController = require("../controllers/ProductController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRoles");
const {
  uploadProductImages,
  handleUploadError,
} = require("../middlewares/uploadMiddleware");

const router = express.Router();

// Admin & Seller
// Product List
router.get(
  "/",
  authMiddleware,
  authorizeRoles("admin", "seller", "customer"),
  ProductController.showProductsPage,
);

// Create Product
router.get(
  "/create",
  authMiddleware,
  authorizeRoles("admin", "seller"),
  ProductController.showCreateProductPage,
);

router.post(
  "/",
  authMiddleware,
  authorizeRoles("admin", "seller"),
  uploadProductImages,
  handleUploadError,
  ProductController.createProduct,
);

// Edit Product
router.get(
  "/:productId/edit",
  authMiddleware,
  authorizeRoles("admin", "seller"),
  ProductController.showEditProductPage,
);

router.put(
  "/:productId",
  authMiddleware,
  authorizeRoles("admin", "seller"),
  uploadProductImages,
  handleUploadError,
  ProductController.updateProduct,
);

// Pending Products (Admin)
router.get(
  "/pending",
  authMiddleware,
  authorizeRoles("admin"),
  ProductController.showPendingProductsPage,
);

// Approve Product (Admin)
router.put(
  "/:productId/approve",
  authMiddleware,
  authorizeRoles("admin"),
  ProductController.approveProduct,
);

// Reject Product (Admin)
router.put(
  "/:productId/reject",
  authMiddleware,
  authorizeRoles("admin"),
  ProductController.rejectProduct,
);

// Toggle Status
router.patch(
  "/:productId/status",
  authMiddleware,
  authorizeRoles("admin", "seller"),
  ProductController.toggleProductStatus,
);

// Toggle Featured (Admin)
router.patch(
  "/:productId/featured",
  authMiddleware,
  authorizeRoles("admin"),
  ProductController.toggleFeaturedProduct,
);

// Trash
router.get(
  "/trash",
  authMiddleware,
  authorizeRoles("admin", "seller"),
  ProductController.showTrashProductsPage,
);

// Soft Delete
router.delete(
  "/:productId",
  authMiddleware,
  authorizeRoles("admin", "seller"),
  ProductController.softDeleteProduct,
);

// Restore
router.patch(
  "/:productId/restore",
  authMiddleware,
  authorizeRoles("admin", "seller"),
  ProductController.restoreProduct,
);

// Permanent Delete
router.delete(
  "/:productId/permanent",
  authMiddleware,
  authorizeRoles("admin", "seller"),
  ProductController.deleteProduct,
);

// Analytics (Admin)
router.get(
  "/analytics",
  authMiddleware,
  authorizeRoles("admin"),
  ProductController.getProductAnalytics,
);

// Public Routes
// Featured Products
router.get("/featured", ProductController.getFeaturedProducts);

// Latest Products
router.get("/latest", ProductController.getLatestProducts);

// Related Products
router.get("/:productId/related", ProductController.getRelatedProducts);

// Product Details
router.get("/:slug", ProductController.getProductBySlug);

module.exports = router;
