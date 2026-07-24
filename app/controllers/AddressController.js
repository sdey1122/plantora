const mongoose = require("mongoose");

const Model = require("../models/Model");
const AuditLog = require("../models/AuditLog");

const logger = require("../config/logger");

const httpStatusCode = require("../utils/httpStatusCode");

const { validationSchema } = require("../validations/modelValidation");

class ModelController {
  // Addresses Page
  async showAddressesPage(req, res) {
    try {
      // Validate query
      const { error, value } = addressQueryValidation.validate(req.query);

      if (error) {
        req.flash("error", error.details[0].message);

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
          {
            fullName: {
              $regex: search,
              $options: "i",
            },
          },
          {
            phone: {
              $regex: search,
              $options: "i",
            },
          },
          {
            city: {
              $regex: search,
              $options: "i",
            },
          },
          {
            state: {
              $regex: search,
              $options: "i",
            },
          },
          {
            postalCode: {
              $regex: search,
              $options: "i",
            },
          },
        ];
      }

      // Filter by address type
      if (addressType) {
        matchStage.addressType = addressType;
      }

      // Filter by default address
      if (typeof isDefault === "boolean") {
        matchStage.isDefault = isDefault;
      }

      const sortStage = {
        [sortBy]: sortOrder === "asc" ? 1 : -1,
      };

      const skip = (page - 1) * limit;

      const addresses = await Address.aggregate([
        {
          $match: matchStage,
        },

        {
          $project: {
            fullName: 1,
            countryCode: 1,
            phone: 1,
            alternatePhone: 1,
            addressLine1: 1,
            addressLine2: 1,
            area: 1,
            landmark: 1,
            city: 1,
            state: 1,
            postalCode: 1,
            country: 1,
            addressType: 1,
            isDefault: 1,
            createdAt: 1,
          },
        },

        {
          $sort: sortStage,
        },

        {
          $skip: skip,
        },

        {
          $limit: limit,
        },
      ]);

      const totalAddresses = await Address.countDocuments(matchStage);

      const totalPages = Math.ceil(totalAddresses / limit);

      logger.info(
        `Addresses page loaded successfully. User ID: ${req.user._id}`,
      );

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
      logger.error(`Show addresses page failed: ${error.message}`);

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .render("errors/500", {
          title: "Server Error",
        });
    }
  }
  // Create Address Page
  async showCreateAddressPage(req, res) {
    try {
      logger.info(
        `Create address page loaded successfully. User ID: ${req.user._id}`,
      );

      return res.status(httpStatusCode.OK).render("address/create", {
        title: "Add Address",
      });
    } catch (error) {
      logger.error(`Show create address page failed: ${error.message}`);

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .render("errors/500", {
          title: "Server Error",
        });
    }
  }
  // Create Address
  async createAddress(req, res) {
    try {
      // Validate request body
      const { error, value } = createAddressValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/addresses/create");
      }

      // Maximum address limit
      const totalAddresses = await Address.countDocuments({
        user: req.user._id,
        isDeleted: false,
      });

      if (totalAddresses >= 10) {
        req.flash("error", "You can save a maximum of 10 addresses.");

        return res.redirect("/addresses");
      }

      // First address becomes default automatically
      let isDefault = value.isDefault;

      if (totalAddresses === 0) {
        isDefault = true;
      }

      // Remove previous default address
      if (isDefault) {
        await Address.updateMany(
          {
            user: req.user._id,
            isDeleted: false,
            isDefault: true,
          },
          {
            $set: {
              isDefault: false,
            },
          },
        );
      }

      // Create address
      const address = await Address.create({
        user: req.user._id,

        fullName: value.fullName,

        countryCode: value.countryCode,

        phone: value.phone,

        alternatePhone: value.alternatePhone,

        addressLine1: value.addressLine1,

        addressLine2: value.addressLine2,

        area: value.area,

        landmark: value.landmark,

        city: value.city,

        state: value.state,

        postalCode: value.postalCode,

        country: value.country,

        addressType: value.addressType,

        isDefault,
      });

      // Audit log
      await AuditLog.create({
        action: "CREATE_ADDRESS",
        performedBy: req.user._id,
        targetModel: "Address",
        targetId: address._id,
        description: `Created a new ${address.addressType} address.`,
      });

      logger.info(
        `Address created successfully. Address ID: ${address._id}, User ID: ${req.user._id}`,
      );

      req.flash("success", "Address added successfully.");

      return res.status(httpStatusCode.CREATED).redirect("/addresses");
    } catch (error) {
      logger.error(`Create address failed: ${error.message}`);

      req.flash("error", "Failed to create address.");

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .redirect("/addresses/create");
    }
  }
  // Edit Address Page
  async showEditAddressPage(req, res) {
    try {
      // Validate address ID
      const { error, value } = addressIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/addresses");
      }

      const address = await Address.findOne({
        _id: value.addressId,
        user: req.user._id,
        isDeleted: false,
      }).lean();

      if (!address) {
        req.flash("error", "Address not found.");

        return res.redirect("/addresses");
      }

      logger.info(
        `Edit address page loaded successfully. Address ID: ${address._id}, User ID: ${req.user._id}`,
      );

      return res.status(httpStatusCode.OK).render("address/edit", {
        title: "Edit Address",
        address,
      });
    } catch (error) {
      logger.error(`Show edit address page failed: ${error.message}`);

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .render("errors/500", {
          title: "Server Error",
        });
    }
  }
  // Update Address
  async updateAddress(req, res) {
    try {
      // Validate address ID
      const { error: idError, value: idValue } = addressIdValidation.validate(
        req.params,
      );

      if (idError) {
        req.flash("error", idError.details[0].message);

        return res.redirect("/addresses");
      }

      // Validate request body
      const { error, value } = updateAddressValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect(`/addresses/edit/${idValue.addressId}`);
      }

      // Check address
      const address = await Address.findOne({
        _id: idValue.addressId,
        user: req.user._id,
        isDeleted: false,
      });

      if (!address) {
        req.flash("error", "Address not found.");

        return res.redirect("/addresses");
      }

      // Only one default address
      if (value.isDefault) {
        await Address.updateMany(
          {
            user: req.user._id,
            _id: {
              $ne: address._id,
            },
            isDeleted: false,
            isDefault: true,
          },
          {
            $set: {
              isDefault: false,
            },
          },
        );
      }

      // Update address
      address.fullName = value.fullName;
      address.countryCode = value.countryCode;
      address.phone = value.phone;
      address.alternatePhone = value.alternatePhone;
      address.addressLine1 = value.addressLine1;
      address.addressLine2 = value.addressLine2;
      address.area = value.area;
      address.landmark = value.landmark;
      address.city = value.city;
      address.state = value.state;
      address.postalCode = value.postalCode;
      address.country = value.country;
      address.addressType = value.addressType;
      address.isDefault = value.isDefault;

      await address.save();

      // Audit log
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

      req.flash("success", "Address updated successfully.");

      return res.status(httpStatusCode.OK).redirect("/addresses");
    } catch (error) {
      logger.error(`Update address failed: ${error.message}`);

      req.flash("error", "Failed to update address.");

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .redirect(`/addresses/edit/${req.params.addressId}`);
    }
  }
  // Set Default Address
  async setDefaultAddress(req, res) {
    try {
      // Validate address ID
      const { error, value } = addressIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/addresses");
      }

      // Check address
      const address = await Address.findOne({
        _id: value.addressId,
        user: req.user._id,
        isDeleted: false,
      });

      if (!address) {
        req.flash("error", "Address not found.");

        return res.redirect("/addresses");
      }

      // Already default
      if (address.isDefault) {
        req.flash("success", "This address is already your default address.");

        return res.redirect("/addresses");
      }

      // Remove previous default
      await Address.updateMany(
        {
          user: req.user._id,
          isDeleted: false,
          isDefault: true,
        },
        {
          $set: {
            isDefault: false,
          },
        },
      );

      // Set new default
      address.isDefault = true;

      await address.save();

      // Audit log
      await AuditLog.create({
        action: "SET_DEFAULT_ADDRESS",
        performedBy: req.user._id,
        targetModel: "Address",
        targetId: address._id,
        description: `Set ${address.addressType} address as default.`,
      });

      logger.info(
        `Default address updated successfully. Address ID: ${address._id}, User ID: ${req.user._id}`,
      );

      req.flash("success", "Default address updated successfully.");

      return res.status(httpStatusCode.OK).redirect("/addresses");
    } catch (error) {
      logger.error(`Set default address failed: ${error.message}`);

      req.flash("error", "Failed to update default address.");

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .redirect("/addresses");
    }
  }
  // Soft Delete Address
  async softDeleteAddress(req, res) {
    try {
      // Validate address ID
      const { error, value } = addressIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/addresses");
      }

      // Check address
      const address = await Address.findOne({
        _id: value.addressId,
        user: req.user._id,
        isDeleted: false,
      });

      if (!address) {
        req.flash("error", "Address not found.");

        return res.redirect("/addresses");
      }

      const wasDefault = address.isDefault;

      // Soft delete address
      address.isDeleted = true;
      address.deletedAt = new Date();
      address.isDefault = false;

      await address.save();

      // Assign another default address
      if (wasDefault) {
        const nextDefaultAddress = await Address.findOne({
          user: req.user._id,
          isDeleted: false,
        }).sort({
          createdAt: 1,
        });

        if (nextDefaultAddress) {
          nextDefaultAddress.isDefault = true;

          await nextDefaultAddress.save();
        }
      }

      // Audit log
      await AuditLog.create({
        action: "SOFT_DELETE_ADDRESS",
        performedBy: req.user._id,
        targetModel: "Address",
        targetId: address._id,
        description: `Soft deleted ${address.addressType} address.`,
      });

      logger.info(
        `Address soft deleted successfully. Address ID: ${address._id}, User ID: ${req.user._id}`,
      );

      req.flash("success", "Address deleted successfully.");

      return res.status(httpStatusCode.OK).redirect("/addresses");
    } catch (error) {
      logger.error(`Soft delete address failed: ${error.message}`);

      req.flash("error", "Failed to delete address.");

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .redirect("/addresses");
    }
  }
  // Restore Address
  async restoreAddress(req, res) {
    try {
      // Validate address ID
      const { error, value } = addressIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/addresses/deleted");
      }

      // Check address
      const address = await Address.findOne({
        _id: value.addressId,
        user: req.user._id,
        isDeleted: true,
      });

      if (!address) {
        req.flash("error", "Address not found.");

        return res.redirect("/addresses/deleted");
      }

      // Maximum address limit
      const totalAddresses = await Address.countDocuments({
        user: req.user._id,
        isDeleted: false,
      });

      if (totalAddresses >= 10) {
        req.flash(
          "error",
          "You can only have a maximum of 10 active addresses.",
        );

        return res.redirect("/addresses/deleted");
      }

      // Restore address
      address.isDeleted = false;
      address.deletedAt = null;

      // Make restored address default if no active default exists
      const defaultAddress = await Address.findOne({
        user: req.user._id,
        isDeleted: false,
        isDefault: true,
      });

      if (!defaultAddress) {
        address.isDefault = true;
      }

      await address.save();

      // Audit log
      await AuditLog.create({
        action: "RESTORE_ADDRESS",
        performedBy: req.user._id,
        targetModel: "Address",
        targetId: address._id,
        description: `Restored ${address.addressType} address.`,
      });

      logger.info(
        `Address restored successfully. Address ID: ${address._id}, User ID: ${req.user._id}`,
      );

      req.flash("success", "Address restored successfully.");

      return res.status(httpStatusCode.OK).redirect("/addresses/deleted");
    } catch (error) {
      logger.error(`Restore address failed: ${error.message}`);

      req.flash("error", "Failed to restore address.");

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .redirect("/addresses/deleted");
    }
  }
  // Delete Address
  async deleteAddress(req, res) {
    try {
      // Validate address ID
      const { error, value } = addressIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/addresses/deleted");
      }

      // Check address
      const address = await Address.findOne({
        _id: value.addressId,
        user: req.user._id,
        isDeleted: true,
      });

      if (!address) {
        req.flash("error", "Address not found.");

        return res.redirect("/addresses/deleted");
      }

      // Permanently delete address
      await Address.deleteOne({
        _id: address._id,
      });

      // Audit log
      await AuditLog.create({
        action: "DELETE_ADDRESS",
        performedBy: req.user._id,
        targetModel: "Address",
        targetId: address._id,
        description: `Permanently deleted ${address.addressType} address.`,
      });

      logger.info(
        `Address permanently deleted successfully. Address ID: ${address._id}, User ID: ${req.user._id}`,
      );

      req.flash("success", "Address permanently deleted successfully.");

      return res.status(httpStatusCode.OK).redirect("/addresses/deleted");
    } catch (error) {
      logger.error(`Delete address failed: ${error.message}`);

      req.flash("error", "Failed to permanently delete address.");

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .redirect("/addresses/deleted");
    }
  }
  // Deleted Addresses Page
  async showDeletedAddressesPage(req, res) {
    try {
      // Validate query
      const { error, value } = addressQueryValidation.validate(req.query);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/addresses/deleted");
      }

      const { page, limit, search, addressType, sortBy, sortOrder } = value;

      const matchStage = {
        user: new mongoose.Types.ObjectId(req.user._id),
        isDeleted: true,
      };

      // Search
      if (search) {
        matchStage.$or = [
          {
            fullName: {
              $regex: search,
              $options: "i",
            },
          },
          {
            phone: {
              $regex: search,
              $options: "i",
            },
          },
          {
            city: {
              $regex: search,
              $options: "i",
            },
          },
          {
            state: {
              $regex: search,
              $options: "i",
            },
          },
          {
            postalCode: {
              $regex: search,
              $options: "i",
            },
          },
        ];
      }

      // Filter by address type
      if (addressType) {
        matchStage.addressType = addressType;
      }

      const sortStage = {
        [sortBy]: sortOrder === "asc" ? 1 : -1,
      };

      const skip = (page - 1) * limit;

      const addresses = await Address.aggregate([
        {
          $match: matchStage,
        },
        {
          $project: {
            fullName: 1,
            countryCode: 1,
            phone: 1,
            alternatePhone: 1,
            addressLine1: 1,
            addressLine2: 1,
            area: 1,
            landmark: 1,
            city: 1,
            state: 1,
            postalCode: 1,
            country: 1,
            addressType: 1,
            deletedAt: 1,
            createdAt: 1,
          },
        },
        {
          $sort: sortStage,
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ]);

      const totalAddresses = await Address.countDocuments(matchStage);

      const totalPages = Math.ceil(totalAddresses / limit);

      logger.info(
        `Deleted addresses page loaded successfully. User ID: ${req.user._id}`,
      );

      return res.status(httpStatusCode.OK).render("address/deleted", {
        title: "Deleted Addresses",
        addresses,
        currentPage: page,
        totalPages,
        totalAddresses,
        limit,
        filters: value,
      });
    } catch (error) {
      logger.error(`Show deleted addresses page failed: ${error.message}`);

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .render("errors/500", {
          title: "Server Error",
        });
    }
  }
}

module.exports = new ModelController();
