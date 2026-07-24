const express = require("express");

const OrderController = require("../controllers/OrderController");

const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRoles");

const router = express.Router();

// Customer routes
router.get(
  "/",
  authMiddleware,
  authorizeRoles("customer"),
  OrderController.showOrdersPage,
);

router.get(
  "/:orderId",
  authMiddleware,
  authorizeRoles("customer"),
  OrderController.showOrderDetailsPage,
);

router.patch(
  "/:orderId/cancel",
  authMiddleware,
  authorizeRoles("customer"),
  OrderController.cancelOrder,
);

router.patch(
  "/:orderId/return",
  authMiddleware,
  authorizeRoles("customer"),
  OrderController.returnOrder,
);

// Admin routes
router.get(
  "/admin",
  authMiddleware,
  authorizeRoles("admin"),
  OrderController.showAdminOrdersPage,
);

router.get(
  "/admin/:orderId",
  authMiddleware,
  authorizeRoles("admin"),
  OrderController.showAdminOrderDetailsPage,
);

router.patch(
  "/admin/:orderId/status",
  authMiddleware,
  authorizeRoles("admin"),
  OrderController.updateOrderStatus,
);

module.exports = router;
