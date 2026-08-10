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
  // Wishlist Page
  async showWishlistPage(req, res) {
    try {
      // Validate query
      const { error, value } = wishlistQueryValidation.validate(req.query);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/");
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
        `Wishlist page loaded successfully. User ID: ${req.user._id}`,
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
      logger.error(`Show wishlist page failed: ${error.message}`);

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .render("errors/500", {
          title: "Server Error",
        });
    }
  }
  // Add To Wishlist
  async addToWishlist(req, res) {
    try {
      // Validate request
      const { error, value } = addToWishlistValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("back");
      }

      // Check product
      const product = await Product.findOne({
        _id: value.productId,
        isDeleted: false,
        isActive: true,
        approvalStatus: "approved",
      });

      if (!product) {
        req.flash("error", "Product not found.");

        return res.redirect("back");
      }

      // Check existing wishlist item
      const existingWishlist = await Wishlist.findOne({
        user: req.user._id,
        product: value.productId,
      });

      if (existingWishlist) {
        req.flash("error", "Product already exists in your wishlist.");

        return res.redirect("back");
      }

      // Add to wishlist
      const wishlist = await Wishlist.create({
        user: req.user._id,
        product: value.productId,
      });

      // Audit log
      await AuditLog.create({
        action: "ADD_TO_WISHLIST",
        performedBy: req.user._id,
        targetModel: "Wishlist",
        targetId: wishlist._id,
        description: `Added ${product.name} to wishlist.`,
      });

      logger.info(
        `Product added to wishlist. User ID: ${req.user._id}, Product ID: ${product._id}`,
      );

      req.flash("success", "Product added to wishlist successfully.");

      return res.status(httpStatusCode.CREATED).redirect("/wishlist");
    } catch (error) {
      logger.error(`Add to wishlist failed: ${error.message}`);

      req.flash("error", "Failed to add product to wishlist.");

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).redirect("back");
    }
  }
  // Remove From Wishlist
  async removeFromWishlist(req, res) {
    try {
      // Validate request
      const { error, value } = removeFromWishlistValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("back");
      }

      // Find wishlist item
      const wishlist = await Wishlist.findOne({
        user: req.user._id,
        product: value.productId,
      });

      if (!wishlist) {
        req.flash("error", "Wishlist item not found.");

        return res.redirect("back");
      }

      // Delete wishlist item
      await Wishlist.deleteOne({
        _id: wishlist._id,
      });

      // Audit log
      await AuditLog.create({
        action: "REMOVE_FROM_WISHLIST",
        performedBy: req.user._id,
        targetModel: "Wishlist",
        targetId: wishlist._id,
        description: "Product removed from wishlist.",
      });

      logger.info(
        `Wishlist item removed. User ID: ${req.user._id}, Product ID: ${value.productId}`,
      );

      req.flash("success", "Product removed from wishlist successfully.");

      return res.redirect("/wishlist");
    } catch (error) {
      logger.error(`Remove wishlist item failed: ${error.message}`);

      req.flash("error", "Failed to remove wishlist item.");

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).redirect("back");
    }
  }
  // Move To Cart
  async moveToCart(req, res) {
    try {
      // Validate request
      const { error, value } = removeFromWishlistValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("back");
      }

      // Check wishlist item
      const wishlist = await Wishlist.findOne({
        user: req.user._id,
        product: value.productId,
      });

      if (!wishlist) {
        req.flash("error", "Wishlist item not found.");

        return res.redirect("back");
      }

      // Check product
      const product = await Product.findOne({
        _id: value.productId,
        isDeleted: false,
        isActive: true,
        approvalStatus: "approved",
      });

      if (!product) {
        req.flash("error", "Product not found.");

        return res.redirect("back");
      }

      if (product.stock < 1) {
        req.flash("error", "Product is out of stock.");

        return res.redirect("back");
      }

      // Find customer cart
      let cart = await Cart.findOne({
        user: req.user._id,
      });

      if (!cart) {
        cart = await Cart.create({
          user: req.user._id,
          items: [],
        });
      }

      // Check existing cart item
      const existingItem = cart.items.find(
        (item) => item.product.toString() === value.productId,
      );

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.items.push({
          product: value.productId,
          quantity: 1,
          isSelected: true,
        });
      }

      await cart.save();

      // Remove wishlist item
      await Wishlist.deleteOne({
        _id: wishlist._id,
      });

      // Audit log
      await AuditLog.create({
        action: "MOVE_WISHLIST_TO_CART",
        performedBy: req.user._id,
        targetModel: "Cart",
        targetId: cart._id,
        description: `Moved ${product.name} from wishlist to cart.`,
      });

      logger.info(
        `Wishlist item moved to cart. User ID: ${req.user._id}, Product ID: ${product._id}`,
      );

      req.flash("success", "Product moved to cart successfully.");

      return res.redirect("/cart");
    } catch (error) {
      logger.error(`Move wishlist item to cart failed: ${error.message}`);

      req.flash("error", "Failed to move product to cart.");

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).redirect("back");
    }
  }
}

module.exports = new WishlistController();
