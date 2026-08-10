const express = require("express");

const router = express.Router();

const CheckoutController = require("../controllers/CheckoutController");

const authMiddleware = require("../middlewares/authMiddleware");

// Protect all routes
router.use(authMiddleware);

// Checkout Page
router.get("/", CheckoutController.showCheckoutPage);

// Apply Coupon
router.post("/apply-coupon", CheckoutController.applyCoupon);

// Remove Coupon
router.post("/remove-coupon", CheckoutController.removeCoupon);

// Place Order
router.post("/place-order", CheckoutController.placeOrder);

module.exports = router;
