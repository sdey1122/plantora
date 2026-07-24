// Import package
const express = require("express");

// Import controller
const SellerDashboardController = require("../controllers/SellerDashboardController");

// Import middlewares
const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRoles");
const sellerMiddleware = require("../middlewares/sellerMiddleware");

const router = express.Router();

// Dashboard
router.get(
  "/",
  authMiddleware,
  authorizeRoles("customer"),
  sellerMiddleware,
  SellerDashboardController.showDashboard,
);

// Statistics
router.get(
  "/statistics",
  authMiddleware,
  authorizeRoles("customer"),
  sellerMiddleware,
  SellerDashboardController.getDashboardStatistics,
);

// Recent orders
router.get(
  "/recent-orders",
  authMiddleware,
  authorizeRoles("customer"),
  sellerMiddleware,
  SellerDashboardController.getRecentOrders,
);

// Revenue chart
router.get(
  "/revenue-chart",
  authMiddleware,
  authorizeRoles("customer"),
  sellerMiddleware,
  SellerDashboardController.getRevenueChart,
);

// Orders chart
router.get(
  "/orders-chart",
  authMiddleware,
  authorizeRoles("customer"),
  sellerMiddleware,
  SellerDashboardController.getOrdersChart,
);

// Inventory chart
router.get(
  "/inventory-chart",
  authMiddleware,
  authorizeRoles("customer"),
  sellerMiddleware,
  SellerDashboardController.getInventoryChart,
);

// Top selling products
router.get(
  "/top-products",
  authMiddleware,
  authorizeRoles("customer"),
  sellerMiddleware,
  SellerDashboardController.getTopSellingProducts,
);

// Latest reviews
router.get(
  "/latest-reviews",
  authMiddleware,
  authorizeRoles("customer"),
  sellerMiddleware,
  SellerDashboardController.getLatestReviews,
);

// Revenue analytics
router.get(
  "/revenue-analytics",
  authMiddleware,
  authorizeRoles("customer"),
  sellerMiddleware,
  SellerDashboardController.getRevenueAnalytics,
);

// Export router
module.exports = router;
