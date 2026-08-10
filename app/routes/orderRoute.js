const express = require("express");

const router = express.Router();

const OrderController = require("../controllers/OrderController");

const authMiddleware = require("../middlewares/authMiddleware");

// Protect all order routes
router.use(authMiddleware);

// My orders
router.get("/", OrderController.showMyOrders);

// Order details
router.get("/:orderId", OrderController.showOrderDetails);

module.exports = router;
