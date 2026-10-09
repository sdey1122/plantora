const express = require("express");

const router = express.Router();

const AddressController = require("../controllers/AddressController");

const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

// Active addresses
router.get("/", AddressController.showAddressesPage);

// Create
router.get("/create", AddressController.showCreateAddressPage);

router.post("/create", AddressController.createAddress);

// Edit
router.get("/:addressId/edit", AddressController.showEditAddressPage);

router.post("/:addressId/edit", AddressController.updateAddress);

// Default
router.post("/:addressId/default", AddressController.setDefaultAddress);

// Trash
router.get("/trash", AddressController.showDeletedAddressesPage);

// Soft delete
router.post("/:addressId/delete", AddressController.softDeleteAddress);

// Restore
router.post("/:addressId/restore", AddressController.restoreAddress);

// Permanent delete
router.post("/:addressId/permanent-delete", AddressController.deleteAddress);

module.exports = router;
