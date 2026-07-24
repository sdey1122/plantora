const express = require("express");

const CouponController = require("../controllers/CouponController");

const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRoles");

const router = express.Router();

// Customer routes
router.post(
  "/apply",
  authMiddleware,
  authorizeRoles("customer"),
  CouponController.applyCoupon,
);

router.delete(
  "/remove",
  authMiddleware,
  authorizeRoles("customer"),
  CouponController.removeCoupon,
);

// Admin routes
router.get(
  "/admin",
  authMiddleware,
  authorizeRoles("admin"),
  CouponController.showCouponsPage,
);

router.get(
  "/admin/create",
  authMiddleware,
  authorizeRoles("admin"),
  CouponController.showCreateCouponPage,
);

router.post(
  "/admin/create",
  authMiddleware,
  authorizeRoles("admin"),
  CouponController.createCoupon,
);

router.get(
  "/admin/:couponId/edit",
  authMiddleware,
  authorizeRoles("admin"),
  CouponController.showEditCouponPage,
);

router.put(
  "/admin/:couponId",
  authMiddleware,
  authorizeRoles("admin"),
  CouponController.updateCoupon,
);

router.patch(
  "/admin/:couponId/status",
  authMiddleware,
  authorizeRoles("admin"),
  CouponController.updateCouponStatus,
);

router.patch(
  "/admin/:couponId/delete",
  authMiddleware,
  authorizeRoles("admin"),
  CouponController.softDeleteCoupon,
);

router.patch(
  "/admin/:couponId/restore",
  authMiddleware,
  authorizeRoles("admin"),
  CouponController.restoreCoupon,
);

router.delete(
  "/admin/:couponId",
  authMiddleware,
  authorizeRoles("admin"),
  CouponController.deleteCoupon,
);

module.exports = router;
