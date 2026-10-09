const mongoose = require("mongoose");

const Address = require("../models/Address");
const AuditLog = require("../models/AuditLog");

const logger = require("../config/logger");

const httpStatusCode = require("../utils/httpStatusCode");

const {
  addressQueryValidation,
  createAddressValidation,
  updateAddressValidation,
  addressIdValidation,
} = require("../validations/addressValidation");

class AddressController {
  // ==========================================================
  // ADDRESSES PAGE
  // ==========================================================

  async showAddressesPage(req, res) {
    try {
      const { error, value } = addressQueryValidation.validate(req.query);

      if (error) {
        logger.warn(
          `Address query validation failed. User ID: ${req.user._id}, Error: ${error.details[0].message}`,
        );

        return res.redirect("/addresses");
      }

      const { page, limit, search, addressType, isDefault, sortBy, sortOrder } =
        value;

      const matchStage = {
        user: new mongoose.Types.ObjectId(req.user._id),
        isDeleted: false,
      };

      // Search
      if (search) {
        matchStage.$or = [
          { fullName: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { city: { $regex: search, $options: "i" } },
          { state: { $regex: search, $options: "i" } },
          { postalCode: { $regex: search, $options: "i" } },
        ];
      }

      // Address type
      if (addressType) {
        matchStage.addressType = addressType;
      }

      // Default
      if (typeof isDefault === "boolean") {
        matchStage.isDefault = isDefault;
      }

      const skip = (page - 1) * limit;

      const addresses = await Address.aggregate([
        {
          $match: matchStage,
        },

        {
          $sort: {
            isDefault: -1,
            [sortBy]: sortOrder === "asc" ? 1 : -1,
          },
        },

        {
          $skip: skip,
        },

        {
          $limit: limit,
        },
      ]);

      const totalAddresses = await Address.countDocuments(matchStage);

      const totalPages =
        totalAddresses > 0 ? Math.ceil(totalAddresses / limit) : 0;

      // Invalid page
      if (totalPages > 0 && page > totalPages) {
        logger.info(
          `Invalid address page requested. Redirecting to last page. User ID: ${req.user._id}, Requested page: ${page}, Last page: ${totalPages}`,
        );

        return res.redirect(`/addresses?page=${totalPages}`);
      }

      return res.status(httpStatusCode.OK).render("address/index", {
        title: "My Addresses",
        addresses,
        currentPage: page,
        totalPages,
        totalAddresses,
        limit,
        filters: value,
      });
    } catch (error) {
      logger.error(
        `Show addresses page failed: ${error.stack || error.message}`,
      );

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .render("errors/500", {
          title: "Server Error",
        });
    }
  }

  // ==========================================================
  // CREATE ADDRESS PAGE
  // ==========================================================

  async showCreateAddressPage(req, res) {
    try {
      return res.status(httpStatusCode.OK).render("address/create", {
        title: "Add Address",
      });
    } catch (error) {
      logger.error(
        `Show create address page failed: ${error.stack || error.message}`,
      );

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .render("errors/500", {
          title: "Server Error",
        });
    }
  }

  // ==========================================================
  // CREATE ADDRESS
  // ==========================================================

  async createAddress(req, res) {
    try {
      const { error, value } = createAddressValidation.validate(req.body);

      if (error) {
        logger.warn(
          `Create address validation failed. User ID: ${req.user._id}, Error: ${error.details[0].message}`,
        );

        return res.redirect("/addresses/create");
      }

      // Maximum 10 addresses
      const totalAddresses = await Address.countDocuments({
        user: req.user._id,
        isDeleted: false,
      });

      if (totalAddresses >= 10) {
        logger.warn(
          `Address creation limit reached. User ID: ${req.user._id}, Limit: 10`,
        );

        return res.redirect("/addresses");
      }

      // First address automatically becomes default
      let isDefault = value.isDefault || false;

      if (totalAddresses === 0) {
        isDefault = true;

        logger.info(
          `First address will be set as default. User ID: ${req.user._id}`,
        );
      }

      // Remove previous default
      if (isDefault) {
        await Address.updateMany(
          {
            user: req.user._id,
            isDeleted: false,
          },
          {
            $set: {
              isDefault: false,
            },
          },
        );
      }

      const address = await Address.create({
        user: req.user._id,

        fullName: value.fullName,

        countryCode: value.countryCode,

        phone: value.phone,

        alternatePhone: value.alternatePhone || "",

        addressLine1: value.addressLine1,

        addressLine2: value.addressLine2 || "",

        area: value.area || "",

        landmark: value.landmark || "",

        city: value.city,

        state: value.state,

        postalCode: value.postalCode,

        country: value.country || "India",

        addressType: value.addressType || "home",

        isDefault,
      });

      await AuditLog.create({
        module: "Address",
        action: "Create",

        actor: {
          user: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },

        target: {
          model: "Address",
          id: address._id,
          name: `${address.addressType} address`,
        },

        description: `Created ${address.addressType} address.`,
      });

      logger.info(
        `Address created successfully. Address ID: ${address._id}, User ID: ${req.user._id}`,
      );

      return res.redirect("/addresses");
    } catch (error) {
      logger.error(`Create address failed: ${error.stack || error.message}`);

      return res.redirect("/addresses/create");
    }
  }

  // ==========================================================
  // EDIT ADDRESS PAGE
  // ==========================================================

  async showEditAddressPage(req, res) {
    try {
      const { error, value } = addressIdValidation.validate(req.params);

      if (error) {
        logger.warn(
          `Edit address ID validation failed. User ID: ${req.user._id}, Error: ${error.details[0].message}`,
        );

        return res.redirect("/addresses");
      }

      const address = await Address.findOne({
        _id: value.addressId,
        user: req.user._id,
        isDeleted: false,
      }).lean();

      if (!address) {
        logger.warn(
          `Address not found while opening edit page. Address ID: ${value.addressId}, User ID: ${req.user._id}`,
        );

        return res.redirect("/addresses");
      }

      return res.status(httpStatusCode.OK).render("address/edit", {
        title: "Edit Address",
        address,
      });
    } catch (error) {
      logger.error(
        `Show edit address page failed: ${error.stack || error.message}`,
      );

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .render("errors/500", {
          title: "Server Error",
        });
    }
  }

  // ==========================================================
  // UPDATE ADDRESS
  // ==========================================================

  async updateAddress(req, res) {
    try {
      const { error: idError, value: idValue } = addressIdValidation.validate(
        req.params,
      );

      if (idError) {
        logger.warn(
          `Update address ID validation failed. User ID: ${req.user._id}, Error: ${idError.details[0].message}`,
        );

        return res.redirect("/addresses");
      }

      const { error, value } = updateAddressValidation.validate(req.body);

      if (error) {
        logger.warn(
          `Update address validation failed. Address ID: ${idValue.addressId}, User ID: ${req.user._id}, Error: ${error.details[0].message}`,
        );

        return res.redirect(`/addresses/${idValue.addressId}/edit`);
      }

      const address = await Address.findOne({
        _id: idValue.addressId,
        user: req.user._id,
        isDeleted: false,
      });

      if (!address) {
        logger.warn(
          `Address not found while updating. Address ID: ${idValue.addressId}, User ID: ${req.user._id}`,
        );

        return res.redirect("/addresses");
      }

      // ==========================================================
      // DEFAULT ADDRESS
      // ==========================================================

      if (value.isDefault) {
        await Address.updateMany(
          {
            user: req.user._id,
            _id: { $ne: address._id },
            isDeleted: false,
          },
          {
            $set: {
              isDefault: false,
            },
          },
        );
      } else if (address.isDefault) {
        // Prevent the user from ending up with no default address
        value.isDefault = true;

        logger.info(
          `Existing default address retained during update. Address ID: ${address._id}, User ID: ${req.user._id}`,
        );
      }

      address.fullName = value.fullName;
      address.countryCode = value.countryCode;
      address.phone = value.phone;
      address.alternatePhone = value.alternatePhone || "";
      address.addressLine1 = value.addressLine1;
      address.addressLine2 = value.addressLine2 || "";
      address.area = value.area || "";
      address.landmark = value.landmark || "";
      address.city = value.city;
      address.state = value.state;
      address.postalCode = value.postalCode;
      address.country = value.country || "India";
      address.addressType = value.addressType || "home";
      address.isDefault = value.isDefault;

      await address.save();

      await AuditLog.create({
        action: "UPDATE_ADDRESS",

        performedBy: req.user._id,

        targetModel: "Address",

        targetId: address._id,

        description: `Updated ${address.addressType} address.`,
      });

      logger.info(
        `Address updated successfully. Address ID: ${address._id}, User ID: ${req.user._id}`,
      );

      return res.redirect("/addresses");
    } catch (error) {
      logger.error(`Update address failed: ${error.stack || error.message}`);

      return res.redirect("/addresses");
    }
  }

  // ==========================================================
  // SET DEFAULT
  // ==========================================================

  async setDefaultAddress(req, res) {
    try {
      const { error, value } = addressIdValidation.validate(req.params);

      if (error) {
        logger.warn(
          `Set default address validation failed. User ID: ${req.user._id}, Error: ${error.details[0].message}`,
        );

        return res.redirect("/addresses");
      }

      const address = await Address.findOne({
        _id: value.addressId,
        user: req.user._id,
        isDeleted: false,
      });

      if (!address) {
        logger.warn(
          `Address not found while setting default. Address ID: ${value.addressId}, User ID: ${req.user._id}`,
        );

        return res.redirect("/addresses");
      }

      await Address.updateMany(
        {
          user: req.user._id,
          isDeleted: false,
        },
        {
          $set: {
            isDefault: false,
          },
        },
      );

      address.isDefault = true;

      await address.save();

      await AuditLog.create({
        action: "SET_DEFAULT_ADDRESS",

        performedBy: req.user._id,

        targetModel: "Address",

        targetId: address._id,

        description: "Changed default delivery address.",
      });

      logger.info(
        `Default address updated successfully. Address ID: ${address._id}, User ID: ${req.user._id}`,
      );

      return res.redirect("/addresses");
    } catch (error) {
      logger.error(
        `Set default address failed: ${error.stack || error.message}`,
      );

      return res.redirect("/addresses");
    }
  }

  // ==========================================================
  // SOFT DELETE
  // ==========================================================

  async softDeleteAddress(req, res) {
    try {
      const { error, value } = addressIdValidation.validate(req.params);

      if (error) {
        logger.warn(
          `Delete address validation failed. User ID: ${req.user._id}, Error: ${error.details[0].message}`,
        );

        return res.redirect("/addresses");
      }

      const address = await Address.findOne({
        _id: value.addressId,
        user: req.user._id,
        isDeleted: false,
      });

      if (!address) {
        logger.warn(
          `Address not found while deleting. Address ID: ${value.addressId}, User ID: ${req.user._id}`,
        );

        return res.redirect("/addresses");
      }

      const wasDefault = address.isDefault;

      address.isDeleted = true;
      address.deletedAt = new Date();
      address.isDefault = false;

      await address.save();

      // Give another address default status
      if (wasDefault) {
        const nextAddress = await Address.findOne({
          user: req.user._id,
          isDeleted: false,
        }).sort({
          createdAt: 1,
        });

        if (nextAddress) {
          nextAddress.isDefault = true;

          await nextAddress.save();

          logger.info(
            `Previous default address deleted. New default assigned. New address ID: ${nextAddress._id}, User ID: ${req.user._id}`,
          );
        }
      }

      await AuditLog.create({
        action: "SOFT_DELETE_ADDRESS",

        performedBy: req.user._id,

        targetModel: "Address",

        targetId: address._id,

        description: "Soft deleted address.",
      });

      logger.info(
        `Address soft deleted successfully. Address ID: ${address._id}, User ID: ${req.user._id}`,
      );

      return res.redirect("/addresses");
    } catch (error) {
      logger.error(
        `Soft delete address failed: ${error.stack || error.message}`,
      );

      return res.redirect("/addresses");
    }
  }

  // ==========================================================
  // DELETED ADDRESSES
  // ==========================================================

  async showDeletedAddressesPage(req, res) {
    try {
      const addresses = await Address.find({
        user: req.user._id,
        isDeleted: true,
      })
        .sort({
          deletedAt: -1,
        })
        .lean();

      return res.status(httpStatusCode.OK).render("address/deleted", {
        title: "Deleted Addresses",
        addresses,
      });
    } catch (error) {
      logger.error(
        `Show deleted addresses failed: ${error.stack || error.message}`,
      );

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .render("errors/500", {
          title: "Server Error",
        });
    }
  }

  // ==========================================================
  // RESTORE
  // ==========================================================

  async restoreAddress(req, res) {
    try {
      const { error, value } = addressIdValidation.validate(req.params);

      if (error) {
        logger.warn(
          `Restore address validation failed. User ID: ${req.user._id}, Error: ${error.details[0].message}`,
        );

        return res.redirect("/addresses/trash");
      }

      const address = await Address.findOne({
        _id: value.addressId,
        user: req.user._id,
        isDeleted: true,
      });

      if (!address) {
        logger.warn(
          `Deleted address not found while restoring. Address ID: ${value.addressId}, User ID: ${req.user._id}`,
        );

        return res.redirect("/addresses/trash");
      }

      const activeCount = await Address.countDocuments({
        user: req.user._id,
        isDeleted: false,
      });

      if (activeCount >= 10) {
        logger.warn(
          `Address restore blocked because maximum limit was reached. User ID: ${req.user._id}, Active addresses: ${activeCount}`,
        );

        return res.redirect("/addresses/trash");
      }

      address.isDeleted = false;
      address.deletedAt = null;

      // If no default address exists
      const defaultAddress = await Address.findOne({
        user: req.user._id,
        isDeleted: false,
        isDefault: true,
      });

      if (!defaultAddress) {
        address.isDefault = true;
      }

      await address.save();

      await AuditLog.create({
        action: "RESTORE_ADDRESS",

        performedBy: req.user._id,

        targetModel: "Address",

        targetId: address._id,

        description: "Restored address.",
      });

      logger.info(
        `Address restored successfully. Address ID: ${address._id}, User ID: ${req.user._id}`,
      );

      return res.redirect("/addresses/trash");
    } catch (error) {
      logger.error(`Restore address failed: ${error.stack || error.message}`);

      return res.redirect("/addresses/trash");
    }
  }

  // ==========================================================
  // PERMANENT DELETE
  // ==========================================================

  async deleteAddress(req, res) {
    try {
      const { error, value } = addressIdValidation.validate(req.params);

      if (error) {
        logger.warn(
          `Permanent delete address validation failed. User ID: ${req.user._id}, Error: ${error.details[0].message}`,
        );

        return res.redirect("/addresses/trash");
      }

      const address = await Address.findOne({
        _id: value.addressId,
        user: req.user._id,
        isDeleted: true,
      });

      if (!address) {
        logger.warn(
          `Deleted address not found for permanent deletion. Address ID: ${value.addressId}, User ID: ${req.user._id}`,
        );

        return res.redirect("/addresses/trash");
      }

      await Address.deleteOne({
        _id: address._id,
      });

      await AuditLog.create({
        action: "DELETE_ADDRESS",

        performedBy: req.user._id,

        targetModel: "Address",

        targetId: address._id,

        description: "Permanently deleted address.",
      });

      logger.info(
        `Address permanently deleted. Address ID: ${address._id}, User ID: ${req.user._id}`,
      );

      return res.redirect("/addresses/trash");
    } catch (error) {
      logger.error(
        `Delete address permanently failed: ${error.stack || error.message}`,
      );

      return res.redirect("/addresses/trash");
    }
  }
}

module.exports = new AddressController();
