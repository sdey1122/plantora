const express = require("express");

const AdminDashboardController = require("../controllers/AdminDashboardController");

const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRoles");

const router = express.Router();

// ==========================================================
// DASHBOARD
// ==========================================================

router.get(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  AdminDashboardController.showDashboard,
);

// ==========================================================
// STATISTICS
// ==========================================================

router.get(
  "/statistics",
  authMiddleware,
  authorizeRoles("admin"),
  AdminDashboardController.getDashboardStatistics,
);

// ==========================================================
// RECENT ORDERS
// ==========================================================

router.get(
  "/recent-orders",
  authMiddleware,
  authorizeRoles("admin"),
  AdminDashboardController.getRecentOrders,
);

// ==========================================================
// REVENUE CHART
// ==========================================================

router.get(
  "/revenue-chart",
  authMiddleware,
  authorizeRoles("admin"),
  AdminDashboardController.getRevenueChart,
);

// ==========================================================
// ORDERS CHART
// ==========================================================

router.get(
  "/orders-chart",
  authMiddleware,
  authorizeRoles("admin"),
  AdminDashboardController.getOrdersChart,
);

// ==========================================================
// USERS / CUSTOMERS CHART
// ==========================================================

router.get(
  "/users-chart",
  authMiddleware,
  authorizeRoles("admin"),
  AdminDashboardController.getUsersChart,
);

// ==========================================================
// INVENTORY CHART
// ==========================================================

router.get(
  "/inventory-chart",
  authMiddleware,
  authorizeRoles("admin"),
  AdminDashboardController.getInventoryChart,
);

// ==========================================================
// TOP SELLING PRODUCTS
// ==========================================================

router.get(
  "/top-products",
  authMiddleware,
  authorizeRoles("admin"),
  AdminDashboardController.getTopSellingProducts,
);

// ==========================================================
// TOP CATEGORIES
// ==========================================================

router.get(
  "/top-categories",
  authMiddleware,
  authorizeRoles("admin"),
  AdminDashboardController.getTopCategories,
);

// ==========================================================
// TOP BRANDS
// ==========================================================

router.get(
  "/top-brands",
  authMiddleware,
  authorizeRoles("admin"),
  AdminDashboardController.getTopBrands,
);

// ==========================================================
// TOP SELLERS
// ==========================================================

router.get(
  "/top-sellers",
  authMiddleware,
  authorizeRoles("admin"),
  AdminDashboardController.getTopSellers,
);

// ==========================================================
// LATEST CUSTOMERS
// ==========================================================

router.get(
  "/latest-customers",
  authMiddleware,
  authorizeRoles("admin"),
  AdminDashboardController.getLatestCustomers,
);

// ==========================================================
// EXPORT
// ==========================================================

module.exports = router;
