const mongoose = require("mongoose");

const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const AuditLog = require("../models/AuditLog");
const Cart = require("../models/Cart");

const logger = require("../config/logger");

const httpStatusCode = require("../utils/httpStatusCode");

const {
  addToWishlistValidation,
  removeFromWishlistValidation,
  wishlistQueryValidation,
} = require("../validations/wishlistValidation");

class WishlistController {
  // ==========================================================
  // WISHLIST PAGE
  // ==========================================================

  async showWishlistPage(req, res) {
    try {
      const { error, value } = wishlistQueryValidation.validate(req.query);

      if (error) {
        logger.warn(
          `Invalid wishlist query. User ID: ${req.user._id}, Reason: ${error.details[0].message}`,
        );

        return res.redirect("/wishlist");
      }

      const { page, limit, sortBy, sortOrder } = value;

      const skip = (page - 1) * limit;

      const wishlist = await Wishlist.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(req.user._id),
          },
        },

        {
          $lookup: {
            from: "products",
            localField: "product",
            foreignField: "_id",
            as: "product",
          },
        },

        {
          $unwind: "$product",
        },

        {
          $match: {
            "product.isDeleted": false,

            "product.status": {
              $in: ["active", "out-of-stock"],
            },

            "product.approvalStatus": "approved",
          },
        },

        {
          $project: {
            createdAt: 1,

            productId: "$product._id",

            name: "$product.name",

            slug: "$product.slug",

            images: "$product.images",

            price: "$product.price",

            discountPrice: "$product.discountPrice",

            stock: "$product.stock",
          },
        },

        {
          $sort: {
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

      const totalWishlistItems = await Wishlist.countDocuments({
        user: req.user._id,
      });

      const totalPages = Math.ceil(totalWishlistItems / limit);

      logger.info(
        `Wishlist page loaded successfully. User ID: ${req.user._id}, Items: ${totalWishlistItems}, Page: ${page}`,
      );

      return res.status(httpStatusCode.OK).render("wishlist/index", {
        title: "My Wishlist",
        wishlist,
        currentPage: page,
        totalPages,
        totalWishlistItems,
        limit,
      });
    } catch (error) {
      logger.error(
        `Show wishlist page failed. User ID: ${req.user?._id || "unknown"}, Error: ${error.stack || error.message}`,
      );

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .render("errors/500", {
          title: "Server Error",
        });
    }
  }

  // ==========================================================
  // ADD TO WISHLIST
  // ==========================================================

  async addToWishlist(req, res) {
    try {
      // ------------------------------------------------------
      // Validate request
      // ------------------------------------------------------

      const { error, value } = addToWishlistValidation.validate(req.body);

      if (error) {
        logger.warn(
          `Invalid add-to-wishlist request. User ID: ${req.user._id}, Reason: ${error.details[0].message}`,
        );

        return res.redirect("/shop");
      }

      // ------------------------------------------------------
      // Check product
      // ------------------------------------------------------

      const product = await Product.findOne({
        _id: value.productId,
        isDeleted: false,
        approvalStatus: "approved",
        status: {
          $in: ["active", "out-of-stock"],
        },
      });

      if (!product) {
        logger.warn(
          `Add to wishlist failed. Product not found or unavailable. User ID: ${req.user._id}, Product ID: ${value.productId}`,
        );

        return res.redirect("/shop");
      }

      // ------------------------------------------------------
      // Check existing wishlist item
      // ------------------------------------------------------

      const existingWishlist = await Wishlist.findOne({
        user: req.user._id,
        product: value.productId,
      });

      if (existingWishlist) {
        logger.info(
          `Product already exists in wishlist. User ID: ${req.user._id}, Product ID: ${value.productId}`,
        );

        return res.redirect(`/shop/product/${product.slug}`);
      }

      // ------------------------------------------------------
      // Add to wishlist
      // ------------------------------------------------------

      const wishlist = await Wishlist.create({
        user: req.user._id,
        product: value.productId,
      });

      // ------------------------------------------------------
      // Audit log
      // ------------------------------------------------------

      await AuditLog.create({
        action: "ADD_TO_WISHLIST",
        performedBy: req.user._id,
        targetModel: "Wishlist",
        targetId: wishlist._id,
        description: `Added ${product.name} to wishlist.`,
      });

      // ------------------------------------------------------
      // Logger
      // ------------------------------------------------------

      logger.info(
        `Product added to wishlist successfully. User ID: ${req.user._id}, Product ID: ${product._id}, Product: ${product.name}`,
      );

      // ------------------------------------------------------
      // Redirect
      // ------------------------------------------------------

      return res.redirect(`/shop/product/${product.slug}`);
    } catch (error) {
      logger.error(
        `Add to wishlist failed. User ID: ${
          req.user?._id || "unknown"
        }, Product ID: ${
          req.body?.productId || "unknown"
        }, Error: ${error.stack || error.message}`,
      );

      return res.redirect("/shop");
    }
  }

  async removeFromWishlist(req, res) {
    try {
      const { error, value } = removeFromWishlistValidation.validate(req.body);

      if (error) {
        logger.warn(
          `Invalid remove-from-wishlist request. User ID: ${req.user._id}, Reason: ${error.details[0].message}`,
        );

        return res.redirect("/wishlist");
      }

      const wishlist = await Wishlist.findOne({
        user: req.user._id,
        product: value.productId,
      });

      if (!wishlist) {
        logger.warn(
          `Wishlist item not found during removal. User ID: ${req.user._id}, Product ID: ${value.productId}`,
        );

        return res.redirect("/wishlist");
      }

      await Wishlist.deleteOne({
        _id: wishlist._id,
      });

      await AuditLog.create({
        action: "REMOVE_FROM_WISHLIST",
        performedBy: req.user._id,
        targetModel: "Wishlist",
        targetId: wishlist._id,
        description: "Product removed from wishlist.",
      });

      logger.info(
        `Wishlist item removed successfully. User ID: ${req.user._id}, Product ID: ${value.productId}`,
      );

      return res.redirect("/wishlist");
    } catch (error) {
      logger.error(
        `Remove wishlist item failed. User ID: ${
          req.user?._id || "unknown"
        }, Product ID: ${
          req.body?.productId || "unknown"
        }, Error: ${error.stack || error.message}`,
      );

      return res.redirect("/wishlist");
    }
  }

  // ==========================================================
  // MOVE TO CART
  // ==========================================================

  async moveToCart(req, res) {
    try {
      const { error, value } = removeFromWishlistValidation.validate(req.body);

      if (error) {
        logger.warn(
          `Invalid move-wishlist-to-cart request. User ID: ${req.user._id}, Reason: ${error.details[0].message}`,
        );

        return res.redirect("/wishlist");
      }

      const wishlist = await Wishlist.findOne({
        user: req.user._id,
        product: value.productId,
      });

      if (!wishlist) {
        logger.warn(
          `Wishlist item not found while moving to cart. User ID: ${req.user._id}, Product ID: ${value.productId}`,
        );

        return res.redirect("/wishlist");
      }

      const product = await Product.findOne({
        _id: value.productId,
        isDeleted: false,
        isActive: true,
        approvalStatus: "approved",
      });

      if (!product) {
        logger.warn(
          `Move to cart failed because product is unavailable. User ID: ${req.user._id}, Product ID: ${value.productId}`,
        );

        return res.redirect("/wishlist");
      }

      if (product.stock < 1) {
        logger.warn(
          `Move to cart failed because product is out of stock. User ID: ${req.user._id}, Product ID: ${product._id}, Product: ${product.name}`,
        );

        return res.redirect("/wishlist");
      }

      let cart = await Cart.findOne({
        user: req.user._id,
      });

      if (!cart) {
        cart = await Cart.create({
          user: req.user._id,
          items: [],
        });

        logger.info(
          `New cart created while moving wishlist item to cart. User ID: ${req.user._id}, Cart ID: ${cart._id}`,
        );
      }

      const existingItem = cart.items.find(
        (item) => item.product.toString() === value.productId,
      );

      if (existingItem) {
        existingItem.quantity += 1;

        logger.info(
          `Existing cart item quantity increased while moving from wishlist. User ID: ${req.user._id}, Product ID: ${product._id}, New Quantity: ${existingItem.quantity}`,
        );
      } else {
        cart.items.push({
          product: value.productId,
          quantity: 1,
          isSelected: true,
        });

        logger.info(
          `Wishlist product added as new cart item. User ID: ${req.user._id}, Product ID: ${product._id}`,
        );
      }

      await cart.save();

      await Wishlist.deleteOne({
        _id: wishlist._id,
      });

      await AuditLog.create({
        action: "MOVE_WISHLIST_TO_CART",
        performedBy: req.user._id,
        targetModel: "Cart",
        targetId: cart._id,
        description: `Moved ${product.name} from wishlist to cart.`,
      });

      logger.info(
        `Wishlist item moved to cart successfully. User ID: ${req.user._id}, Product ID: ${product._id}, Product: ${product.name}`,
      );

      return res.redirect("/cart");
    } catch (error) {
      logger.error(
        `Move wishlist item to cart failed. User ID: ${req.user?._id || "unknown"}, Product ID: ${req.body?.productId || "unknown"}, Error: ${error.stack || error.message}`,
      );

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .redirect("/wishlist");
    }
  }
}

module.exports = new WishlistController();
