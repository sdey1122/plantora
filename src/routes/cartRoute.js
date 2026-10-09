const express = require("express");

const router = express.Router();

const CartController = require("../controllers/CartController");

const authMiddleware = require("../middlewares/authMiddleware");

// ==========================================================
// PROTECT ALL CART ROUTES
// ==========================================================

router.use(authMiddleware);

// ==========================================================
// CART PAGE
// GET /cart
// ==========================================================

router.get("/", CartController.showCartPage);

// ==========================================================
// CART SUMMARY
// GET /cart/summary
// ==========================================================

router.get("/summary", CartController.getCartSummary);

// ==========================================================
// ADD TO CART
// POST /cart/add
// ==========================================================

router.post("/add", CartController.addToCart);

// ==========================================================
// UPDATE QUANTITY
// POST /cart/quantity
// ==========================================================

router.post("/quantity", CartController.updateCartQuantity);

// ==========================================================
// TOGGLE SELECTION
// POST /cart/toggle
// ==========================================================

router.post("/toggle", CartController.toggleCartItem);

// ==========================================================
// REMOVE PRODUCT
// POST /cart/remove
// ==========================================================

router.post("/remove", CartController.removeFromCart);

// ==========================================================
// CLEAR CART
// POST /cart/clear
// ==========================================================

router.post("/clear", CartController.clearCart);

module.exports = router;
