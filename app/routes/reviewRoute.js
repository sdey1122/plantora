const express = require("express");

const ReviewController = require("../controllers/ReviewController");

const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRoles");

const router = express.Router();

// Customer routes
router.get("/product/:productId", ReviewController.showProductReviewsPage);

router.post(
  "/product/:productId",
  authMiddleware,
  authorizeRoles("customer"),
  ReviewController.createReview,
);

router.get(
  "/:reviewId/edit",
  authMiddleware,
  authorizeRoles("customer"),
  ReviewController.showEditReviewPage,
);

router.put(
  "/:reviewId",
  authMiddleware,
  authorizeRoles("customer"),
  ReviewController.updateReview,
);

router.patch(
  "/:reviewId/delete",
  authMiddleware,
  authorizeRoles("customer"),
  ReviewController.deleteReview,
);

router.post(
  "/:reviewId/helpful",
  authMiddleware,
  authorizeRoles("customer"),
  ReviewController.markReviewHelpful,
);

router.delete(
  "/:reviewId/helpful",
  authMiddleware,
  authorizeRoles("customer"),
  ReviewController.removeHelpfulVote,
);

// Admin routes
router.get(
  "/admin",
  authMiddleware,
  authorizeRoles("admin"),
  ReviewController.showReviewsPage,
);

router.get(
  "/admin/:reviewId",
  authMiddleware,
  authorizeRoles("admin"),
  ReviewController.showReviewDetailsPage,
);

router.patch(
  "/admin/:reviewId/status",
  authMiddleware,
  authorizeRoles("admin"),
  ReviewController.updateReviewStatus,
);

router.patch(
  "/admin/:reviewId/restore",
  authMiddleware,
  authorizeRoles("admin"),
  ReviewController.restoreReview,
);

router.delete(
  "/admin/:reviewId",
  authMiddleware,
  authorizeRoles("admin"),
  ReviewController.deleteReviewPermanently,
);

module.exports = router;
