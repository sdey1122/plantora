const express = require("express");

const router = express.Router();

const PaymentController = require("../controllers/PaymentController");

const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

// Payment page
router.get("/:paymentId", PaymentController.showPaymentPage);

// Verify Razorpay payment
router.post("/verify", PaymentController.verifyPayment);

// Successful payment
router.get("/success/:orderId", PaymentController.showPaymentSuccess);

module.exports = router;
