const express = require("express");

const CategoryController = require("../controllers/CategoryController");

const authMiddleware = require("../middlewares/authMiddleware");

const authorizeRoles = require("../middlewares/authorizeRoles");

const upload = require("../middlewares/upload");

const router = express.Router();

// Admin authentication
router.use(authMiddleware);

router.use(authorizeRoles("admin"));

// Categories page
router.get("/", CategoryController.showCategoriesPage);

// Deleted categories page
router.get("/deleted", CategoryController.showDeletedCategoriesPage);

// Category analytics
router.get("/analytics", CategoryController.getCategoryAnalytics);

// Category options
router.get("/options", CategoryController.getCategoryOptions);

// Create category page
router.get("/create", CategoryController.showCreateCategoryPage);

// Create category
router.post(
  "/create",
  upload.single("image"),
  CategoryController.createCategory,
);

// Edit category page
router.get("/:categoryId/edit", CategoryController.showEditCategoryPage);

// Update category
router.post(
  "/:categoryId/edit",
  upload.single("image"),
  CategoryController.updateCategory,
);

// Toggle category status
router.patch("/:categoryId/status", CategoryController.toggleCategoryStatus);

// Toggle featured category
router.patch(
  "/:categoryId/featured",
  CategoryController.toggleFeaturedCategory,
);

// Soft delete category
router.delete("/:categoryId", CategoryController.softDeleteCategory);

// Restore category
router.patch("/:categoryId/restore", CategoryController.restoreCategory);

// Permanently delete category
router.delete("/:categoryId/permanent", CategoryController.deleteCategory);

module.exports = router;
