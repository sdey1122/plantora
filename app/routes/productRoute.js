const express = require("express");
const ProductController = require("../controllers/ProductController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const upload = require("../middlewares/upload");

const router = express.Router();

// Admin & Seller
// Product List
router.get(
  "/",
  authMiddleware,
  authorize("admin", "seller"),
  ProductController.showProductsPage,
);

// Create Product
router.get(
  "/create",
  authMiddleware,
  authorize("admin", "seller"),
  ProductController.showCreateProductPage,
);

router.post(
  "/",
  authMiddleware,
  authorize("admin", "seller"),
  upload.array("images", 10),
  ProductController.createProduct,
);

// Edit Product
router.get(
  "/:productId/edit",
  authMiddleware,
  authorize("admin", "seller"),
  ProductController.showEditProductPage,
);

router.put(
  "/:productId",
  authMiddleware,
  authorize("admin", "seller"),
  upload.array("images", 10),
  ProductController.updateProduct,
);

// Pending Products (Admin)
router.get(
  "/pending",
  authMiddleware,
  authorize("admin"),
  ProductController.showPendingProductsPage,
);

// Approve Product (Admin)
router.put(
  "/:productId/approve",
  authMiddleware,
  authorize("admin"),
  ProductController.approveProduct,
);

// Reject Product (Admin)
router.put(
  "/:productId/reject",
  authMiddleware,
  authorize("admin"),
  ProductController.rejectProduct,
);

// Toggle Status
router.patch(
  "/:productId/status",
  authMiddleware,
  authorize("admin", "seller"),
  ProductController.toggleProductStatus,
);

// Toggle Featured (Admin)
router.patch(
  "/:productId/featured",
  authMiddleware,
  authorize("admin"),
  ProductController.toggleFeaturedProduct,
);

// Trash
router.get(
  "/trash",
  authMiddleware,
  authorize("admin", "seller"),
  ProductController.showTrashProductsPage,
);

// Soft Delete
router.delete(
  "/:productId",
  authMiddleware,
  authorize("admin", "seller"),
  ProductController.softDeleteProduct,
);

// Restore
router.patch(
  "/:productId/restore",
  authMiddleware,
  authorize("admin", "seller"),
  ProductController.restoreProduct,
);

// Permanent Delete
router.delete(
  "/:productId/permanent",
  authMiddleware,
  authorize("admin", "seller"),
  ProductController.deleteProduct,
);

// Analytics (Admin)
router.get(
  "/analytics",
  authMiddleware,
  authorize("admin"),
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
