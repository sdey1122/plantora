const express = require("express");

const AdminDashboardController = require("../controllers/AdminDashboardController");

const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRoles");

const router = express.Router();

// Dashboard
router.get(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  AdminDashboardController.showDashboard,
);

// Statistics
router.get(
  "/statistics",
  authMiddleware,
  authorizeRoles("admin"),
  AdminDashboardController.getDashboardStatistics,
);

// Recent orders
router.get(
  "/recent-orders",
  authMiddleware,
  authorizeRoles("admin"),
  AdminDashboardController.getRecentOrders,
);

// Revenue chart
router.get(
  "/revenue-chart",
  authMiddleware,
  authorizeRoles("admin"),
  AdminDashboardController.getRevenueChart,
);

// Orders chart
router.get(
  "/orders-chart",
  authMiddleware,
  authorizeRoles("admin"),
  AdminDashboardController.getOrdersChart,
);

// Users chart
router.get(
  "/users-chart",
  authMiddleware,
  authorizeRoles("admin"),
  AdminDashboardController.getUsersChart,
);

// Inventory chart
router.get(
  "/inventory-chart",
  authMiddleware,
  authorizeRoles("admin"),
  AdminDashboardController.getInventoryChart,
);

// Top selling products
router.get(
  "/top-products",
  authMiddleware,
  authorizeRoles("admin"),
  AdminDashboardController.getTopSellingProducts,
);

// Top categories
router.get(
  "/top-categories",
  authMiddleware,
  authorizeRoles("admin"),
  AdminDashboardController.getTopCategories,
);

// Top brands
router.get(
  "/top-brands",
  authMiddleware,
  authorizeRoles("admin"),
  AdminDashboardController.getTopBrands,
);

// Top sellers
router.get(
  "/top-sellers",
  authMiddleware,
  authorizeRoles("admin"),
  AdminDashboardController.getTopSellers,
);

// Latest customers
router.get(
  "/latest-customers",
  authMiddleware,
  authorizeRoles("admin"),
  AdminDashboardController.getLatestCustomers,
);

module.exports = router;
