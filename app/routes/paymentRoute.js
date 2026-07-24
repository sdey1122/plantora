const express = require("express");

const PaymentController = require("../controllers/PaymentController");

const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRoles");

const router = express.Router();

// Customer routes
router.get(
  "/",
  authMiddleware,
  authorizeRoles("customer"),
  PaymentController.showPaymentsPage,
);

router.get(
  "/:paymentId",
  authMiddleware,
  authorizeRoles("customer"),
  PaymentController.showPaymentDetailsPage,
);

router.post(
  "/create",
  authMiddleware,
  authorizeRoles("customer"),
  PaymentController.createPayment,
);

router.post(
  "/verify",
  authMiddleware,
  authorizeRoles("customer"),
  PaymentController.verifyPayment,
);

// Razorpay webhook
router.post("/webhook", PaymentController.handleWebhook);

// Admin routes
router.get(
  "/admin",
  authMiddleware,
  authorizeRoles("admin"),
  PaymentController.showAdminPaymentsPage,
);

router.get(
  "/admin/:paymentId",
  authMiddleware,
  authorizeRoles("admin"),
  PaymentController.showAdminPaymentDetailsPage,
);

router.patch(
  "/admin/:paymentId/refund",
  authMiddleware,
  authorizeRoles("admin"),
  PaymentController.refundPayment,
);

module.exports = router;
