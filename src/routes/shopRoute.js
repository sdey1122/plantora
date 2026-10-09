// const express = require("express");

// const router = express.Router();

// const ShopController = require("../controllers/ShopController");

// // ==========================================================
// // SHOP
// // ==========================================================

// // Public shop
// router.get("/", ShopController.showShopPage);

// // ==========================================================
// // PUBLIC PRODUCT DETAILS
// // ==========================================================

// // IMPORTANT:
// // Do NOT add authMiddleware here.
// // Guests, customers, sellers and admins can all view products.

// router.get("/product/:slug", ShopController.showProductDetails);

// module.exports = router;

const express = require("express");

const router = express.Router();

const ShopController = require("../controllers/ShopController");

// ==========================================================
// SHOP
// ==========================================================

// Public shop
router.get("/", ShopController.showShopPage);

// ==========================================================
// PUBLIC PRODUCT DETAILS
// ==========================================================

// Guests, customers, sellers and admins can view products.

router.get("/product/:slug", ShopController.showProductDetails);

module.exports = router;
