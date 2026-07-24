const express = require("express");

const router = express.Router();

const UserController = require("../controllers/UserController");

const authMiddleware = require("../middlewares/authMiddleware");

const authorizeRoles = require("../middlewares/authorizeRoles");

const upload = require("../middlewares/upload");

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

// Update User
router.post(
  "/:userId/edit",
  upload.single("profileImage"),
  UserController.updateUser,
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
router.get("/analytics", UserController.getUserAnalytics);

module.exports = router;
