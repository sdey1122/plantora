const express = require("express");

const router = express.Router();

const CartController = require("../controllers/CartController");

const authMiddleware = require("../middlewares/authMiddleware");

const authorizeRoles = require("../middlewares/authorizeRoles");

// Protect all routes
router.use(authMiddleware);

router.use(authorizeRoles("customer"));

// Cart Page
router.get("/", CartController.showCartPage);

// Cart Summary
router.get("/summary", CartController.getCartSummary);

// Add To Cart
router.post("/add", CartController.addToCart);

// Update Quantity
router.post("/quantity", CartController.updateCartQuantity);

// Toggle Item Selection
router.post("/toggle", CartController.toggleCartItem);

// Remove Item
router.post("/remove", CartController.removeFromCart);

// Clear Cart
router.post("/clear", CartController.clearCart);

module.exports = router;
