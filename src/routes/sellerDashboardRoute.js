const express = require("express");

const SellerDashboardController = require("../controllers/SellerDashboardController");

const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRoles");

const router = express.Router();

// ==========================================================
// DASHBOARD
// ==========================================================

router.get(
  "/",
  authMiddleware,
  authorizeRoles("seller"),
  SellerDashboardController.showDashboard,
);

// ==========================================================
// STATISTICS
// ==========================================================

router.get(
  "/statistics",
  authMiddleware,
  authorizeRoles("seller"),
  SellerDashboardController.getDashboardStatistics,
);

// ==========================================================
// RECENT ORDERS
// ==========================================================

router.get(
  "/recent-orders",
  authMiddleware,
  authorizeRoles("seller"),
  SellerDashboardController.getRecentOrders,
);

// ==========================================================
// REVENUE CHART
// ==========================================================

router.get(
  "/revenue-chart",
  authMiddleware,
  authorizeRoles("seller"),
  SellerDashboardController.getRevenueChart,
);

// ==========================================================
// ORDERS CHART
// ==========================================================

router.get(
  "/orders-chart",
  authMiddleware,
  authorizeRoles("seller"),
  SellerDashboardController.getOrdersChart,
);

// ==========================================================
// USERS CHART
// ==========================================================

router.get(
  "/users-chart",
  authMiddleware,
  authorizeRoles("seller"),
  SellerDashboardController.getUsersChart,
);

// ==========================================================
// INVENTORY CHART
// ==========================================================

router.get(
  "/inventory-chart",
  authMiddleware,
  authorizeRoles("seller"),
  SellerDashboardController.getInventoryChart,
);

// ==========================================================
// TOP PRODUCTS
// ==========================================================

router.get(
  "/top-products",
  authMiddleware,
  authorizeRoles("seller"),
  SellerDashboardController.getTopSellingProducts,
);

// ==========================================================
// TOP CATEGORIES
// ==========================================================

router.get(
  "/top-categories",
  authMiddleware,
  authorizeRoles("seller"),
  SellerDashboardController.getTopCategories,
);

// ==========================================================
// TOP BRANDS
// ==========================================================

router.get(
  "/top-brands",
  authMiddleware,
  authorizeRoles("seller"),
  SellerDashboardController.getTopBrands,
);

// ==========================================================
// TOP SELLERS
// ==========================================================

router.get(
  "/top-sellers",
  authMiddleware,
  authorizeRoles("seller"),
  SellerDashboardController.getTopSellers,
);

// ==========================================================
// LATEST CUSTOMERS
// ==========================================================

router.get(
  "/latest-customers",
  authMiddleware,
  authorizeRoles("seller"),
  SellerDashboardController.getLatestCustomers,
);

// ==========================================================
// PAYMENT METHODS
// ==========================================================

router.get(
  "/payment-methods",
  authMiddleware,
  authorizeRoles("seller"),
  SellerDashboardController.getPaymentMethodsChart,
);

// ==========================================================
// REVENUE BREAKDOWN
// ==========================================================

router.get(
  "/revenue-breakdown",
  authMiddleware,
  authorizeRoles("seller"),
  SellerDashboardController.getRevenueBreakdown,
);

module.exports = router;
