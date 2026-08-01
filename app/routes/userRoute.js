const express = require("express");

const router = express.Router();

const UserController = require("../controllers/UserController");

const authMiddleware = require("../middlewares/authMiddleware");

const authorizeRoles = require("../middlewares/authorizeRoles");

const upload = require("../middlewares/uploadMiddleware");

// Update User
const {
  uploadProfileImage,
  handleUploadError,
} = require("../middlewares/uploadMiddleware");

// Protect all routes
router.use(authMiddleware);

router.use(authorizeRoles("admin"));

// User Management
router.get("/", UserController.showUsersPage);

// Deleted Users
router.get("/trash", UserController.showDeletedUsersPage);

// User Details
router.get("/customers/:userId", UserController.showCustomerDetails);

router.get("/sellers/:userId", UserController.showSellerDetails);

// Seller Request Page
router.get(
  "/seller-request/:userId",
  authMiddleware,
  authorizeRoles("admin"),
  UserController.showSellerRequestPage,
);

// Approve Seller
router.post(
  "/seller-request/:userId/approve",
  authMiddleware,
  authorizeRoles("admin"),
  UserController.approveSeller,
);

// Reject Seller
router.post(
  "/seller-request/:userId/reject",
  authMiddleware,
  authorizeRoles("admin"),
  UserController.rejectSeller,
);

// Toggle User Status
router.post("/:userId/status", UserController.toggleUserStatus);

// Seller Approval
router.post("/:userId/seller-approval", UserController.toggleSellerApproval);

// Soft Delete
router.post("/:userId/delete", UserController.softDeleteUser);

// Restore
router.post("/:userId/restore", UserController.restoreUser);

// Permanent Delete
router.post("/:userId/permanent-delete", UserController.deleteUser);

// User Analytics
// router.get("/analytics", UserController.getUserAnalytics);

module.exports = router;
