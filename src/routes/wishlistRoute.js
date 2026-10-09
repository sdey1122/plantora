const express = require("express");

const router = express.Router();

const WishlistController = require("../controllers/WishlistController");

const authMiddleware = require("../middlewares/authMiddleware");

// Protect all routes
router.use(authMiddleware);

// Wishlist Page
router.get("/", WishlistController.showWishlistPage);

// Add To Wishlist
router.post("/add", WishlistController.addToWishlist);

// Remove From Wishlist
router.post("/remove", WishlistController.removeFromWishlist);

// Move To Cart
router.post("/move-to-cart", WishlistController.moveToCart);

module.exports = router;
