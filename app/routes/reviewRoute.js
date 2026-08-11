const express = require("express");

const ReviewController = require("../controllers/ReviewController");

const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRoles");

const router = express.Router();

// ==========================================================
// CUSTOMER / SELLER
// ==========================================================

// Product reviews page
router.get("/product/:productId", ReviewController.showProductReviewsPage);

// Create review
router.post(
  "/product/:productId",
  authMiddleware,
  authorizeRoles("customer", "seller"),
  ReviewController.createReview,
);

// Edit own review page
router.get(
  "/:reviewId/edit",
  authMiddleware,
  authorizeRoles("customer", "seller"),
  ReviewController.showEditReviewPage,
);

// Update own review
router.post(
  "/:reviewId/edit",
  authMiddleware,
  authorizeRoles("customer", "seller"),
  ReviewController.updateReview,
);

// Helpful
router.post(
  "/:reviewId/helpful",
  authMiddleware,
  authorizeRoles("customer", "seller"),
  ReviewController.markReviewHelpful,
);

// Remove helpful
router.delete(
  "/:reviewId/helpful",
  authMiddleware,
  authorizeRoles("customer", "seller"),
  ReviewController.removeHelpfulVote,
);

// ==========================================================
// ADMIN
// ==========================================================

// Admin review list
router.get(
  "/admin",
  authMiddleware,
  authorizeRoles("admin"),
  ReviewController.showReviewsPage,
);

// Admin review details
router.get(
  "/admin/:reviewId",
  authMiddleware,
  authorizeRoles("admin"),
  ReviewController.showReviewDetailsPage,
);

// Admin approve/reject
router.patch(
  "/admin/:reviewId/status",
  authMiddleware,
  authorizeRoles("admin"),
  ReviewController.updateReviewStatus,
);

// Admin permanent delete
router.delete(
  "/admin/:reviewId",
  authMiddleware,
  authorizeRoles("admin"),
  ReviewController.deleteReviewPermanently,
);

module.exports = router;
