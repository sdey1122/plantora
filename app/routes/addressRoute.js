const express = require("express");

const router = express.Router();

const AddressController = require("../controllers/AddressController");

const authMiddleware = require("../middlewares/authMiddleware");

const authorizeRoles = require("../middlewares/authorizeRoles");

// Protect all routes
router.use(authMiddleware);

router.use(authorizeRoles("customer"));

// Address List
router.get("/", AddressController.showAddressesPage);

// Create Address
router.get("/create", AddressController.showCreateAddressPage);

router.post("/create", AddressController.createAddress);

// Edit Address
router.get("/:addressId/edit", AddressController.showEditAddressPage);

router.post("/:addressId/edit", AddressController.updateAddress);

// Set Default Address
router.post("/:addressId/default", AddressController.setDefaultAddress);

// Deleted Addresses
router.get("/trash", AddressController.showDeletedAddressesPage);

// Soft Delete
router.post("/:addressId/delete", AddressController.softDeleteAddress);

// Restore
router.post("/:addressId/restore", AddressController.restoreAddress);

// Permanent Delete
router.post("/:addressId/permanent-delete", AddressController.deleteAddress);

module.exports = router;
