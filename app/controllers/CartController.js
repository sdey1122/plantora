const mongoose = require("mongoose");

const Cart = require("../models/Cart");
const Product = require("../models/Product");
const AuditLog = require("../models/AuditLog");

const logger = require("../config/logger");

const httpStatusCode = require("../utils/httpStatusCode");

const {
  addToCartValidation,
  updateCartQuantityValidation,
  removeFromCartValidation,
  toggleCartItemValidation,
  clearCartValidation,
  cartQueryValidation,
} = require("../validations/cartValidation");

class CartController {
  // Cart Page
  async showCartPage(req, res) {
    try {
      // Validate query
      const { error, value } = cartQueryValidation.validate(req.query);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/");
      }

      const { page, limit } = value;

      const skip = (page - 1) * limit;

      const cart = await Cart.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(req.user._id),
          },
        },
        {
          $unwind: "$items",
        },
        {
          $lookup: {
            from: "products",
            localField: "items.product",
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
            "product.status": "active",
            "product.approvalStatus": "approved",
          },
        },
        {
          $project: {
            _id: 0,

            productId: "$product._id",

            name: "$product.name",

            slug: "$product.slug",

            images: "$product.images",

            price: "$product.price",

            stock: "$product.stock",

            quantity: "$items.quantity",

            isSelected: "$items.isSelected",

            subtotal: {
              $multiply: ["$product.price", "$items.quantity"],
            },
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ]);

      const totalItems = cart.length;

      const totalPages = Math.ceil(totalItems / limit);

      logger.info(`Cart page loaded successfully. User ID: ${req.user._id}`);

      return res.status(httpStatusCode.OK).render("cart/index", {
        title: "Shopping Cart",
        cart,
        currentPage: page,
        totalPages,
        totalItems,
        limit,
      });
    } catch (error) {
      logger.error(`Show cart page failed: ${error.message}`);

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .render("errors/500", {
          title: "Server Error",
        });
    }
  }
  // Add To Cart
  async addToCart(req, res) {
    try {
      // Validate request
      const { error, value } = addToCartValidation.validate(req.body);

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

      // Check stock
      if (product.stock < value.quantity) {
        req.flash("error", "Insufficient stock available.");

        return res.redirect("back");
      }

      // Find cart
      let cart = await Cart.findOne({
        user: req.user._id,
      });

      // Create cart
      if (!cart) {
        cart = await Cart.create({
          user: req.user._id,
          items: [
            {
              product: product._id,
              quantity: value.quantity,
            },
          ],
        });
      } else {
        const existingItem = cart.items.find(
          (item) => item.product.toString() === value.productId,
        );

        if (existingItem) {
          const totalQuantity = existingItem.quantity + value.quantity;

          if (totalQuantity > product.stock) {
            req.flash("error", "Requested quantity exceeds available stock.");

            return res.redirect("back");
          }

          existingItem.quantity = totalQuantity;
        } else {
          cart.items.push({
            product: product._id,
            quantity: value.quantity,
          });
        }

        await cart.save();
      }

      // Audit log
      await AuditLog.create({
        action: "ADD_TO_CART",
        performedBy: req.user._id,
        targetModel: "Cart",
        targetId: cart._id,
        description: `Added ${product.name} to cart.`,
      });

      logger.info(
        `Product added to cart. User ID: ${req.user._id}, Product ID: ${product._id}`,
      );

      req.flash("success", "Product added to cart.");

      return res.status(httpStatusCode.CREATED).redirect("/cart");
    } catch (error) {
      logger.error(`Add to cart failed: ${error.message}`);

      req.flash("error", "Failed to add product to cart.");

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).redirect("back");
    }
  }
  // Update Cart Quantity
  async updateCartQuantity(req, res) {
    try {
      // Validate request
      const { error, value } = updateCartQuantityValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/cart");
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

        return res.redirect("/cart");
      }

      // Check stock
      if (value.quantity > product.stock) {
        req.flash("error", "Insufficient stock available.");

        return res.redirect("/cart");
      }

      // Find cart
      const cart = await Cart.findOne({
        user: req.user._id,
      });

      if (!cart) {
        req.flash("error", "Cart not found.");

        return res.redirect("/cart");
      }

      const item = cart.items.find(
        (item) => item.product.toString() === value.productId,
      );

      if (!item) {
        req.flash("error", "Cart item not found.");

        return res.redirect("/cart");
      }

      item.quantity = value.quantity;

      await cart.save();

      // Audit log
      await AuditLog.create({
        action: "UPDATE_CART_QUANTITY",
        performedBy: req.user._id,
        targetModel: "Cart",
        targetId: cart._id,
        description: `Updated quantity for ${product.name}.`,
      });

      logger.info(
        `Cart quantity updated. User ID: ${req.user._id}, Product ID: ${product._id}`,
      );

      req.flash("success", "Cart updated successfully.");

      return res.status(httpStatusCode.OK).redirect("/cart");
    } catch (error) {
      logger.error(`Update cart quantity failed: ${error.message}`);

      req.flash("error", "Failed to update cart.");

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).redirect("/cart");
    }
  }
  // Remove From Cart
  async removeFromCart(req, res) {
    try {
      // Validate request
      const { error, value } = removeFromCartValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/cart");
      }

      // Find cart
      const cart = await Cart.findOne({
        user: req.user._id,
      });

      if (!cart) {
        req.flash("error", "Cart not found.");

        return res.redirect("/cart");
      }

      const item = cart.items.find(
        (item) => item.product.toString() === value.productId,
      );

      if (!item) {
        req.flash("error", "Product not found in cart.");

        return res.redirect("/cart");
      }

      cart.items = cart.items.filter(
        (item) => item.product.toString() !== value.productId,
      );

      await cart.save();

      // Audit log
      await AuditLog.create({
        action: "REMOVE_FROM_CART",
        performedBy: req.user._id,
        targetModel: "Cart",
        targetId: cart._id,
        description: `Removed product from cart.`,
      });

      logger.info(
        `Product removed from cart. User ID: ${req.user._id}, Product ID: ${value.productId}`,
      );

      req.flash("success", "Product removed from cart successfully.");

      return res.status(httpStatusCode.OK).redirect("/cart");
    } catch (error) {
      logger.error(`Remove from cart failed: ${error.message}`);

      req.flash("error", "Failed to remove product from cart.");

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).redirect("/cart");
    }
  }
  // Toggle Cart Item
  async toggleCartItem(req, res) {
    try {
      // Validate request
      const { error, value } = toggleCartItemValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/cart");
      }

      // Find cart
      const cart = await Cart.findOne({
        user: req.user._id,
      });

      if (!cart) {
        req.flash("error", "Cart not found.");

        return res.redirect("/cart");
      }

      const item = cart.items.find(
        (item) => item.product.toString() === value.productId,
      );

      if (!item) {
        req.flash("error", "Product not found in cart.");

        return res.redirect("/cart");
      }

      item.isSelected = value.isSelected;

      await cart.save();

      // Audit log
      await AuditLog.create({
        action: "TOGGLE_CART_ITEM",
        performedBy: req.user._id,
        targetModel: "Cart",
        targetId: cart._id,
        description: `${value.isSelected ? "Selected" : "Deselected"} a cart item.`,
      });

      logger.info(
        `Cart item selection updated. User ID: ${req.user._id}, Product ID: ${value.productId}`,
      );

      req.flash("success", "Cart updated successfully.");

      return res.status(httpStatusCode.OK).redirect("/cart");
    } catch (error) {
      logger.error(`Toggle cart item failed: ${error.message}`);

      req.flash("error", "Failed to update cart item.");

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).redirect("/cart");
    }
  }
  // Clear Cart
  async clearCart(req, res) {
    try {
      // Validate request
      const { error } = clearCartValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/cart");
      }

      // Find cart
      const cart = await Cart.findOne({
        user: req.user._id,
      });

      if (!cart) {
        req.flash("error", "Cart not found.");

        return res.redirect("/cart");
      }

      // Clear cart
      cart.items = [];

      await cart.save();

      // Audit log
      await AuditLog.create({
        action: "CLEAR_CART",
        performedBy: req.user._id,
        targetModel: "Cart",
        targetId: cart._id,
        description: "Cleared all items from cart.",
      });

      logger.info(`Cart cleared successfully. User ID: ${req.user._id}`);

      req.flash("success", "Cart cleared successfully.");

      return res.status(httpStatusCode.OK).redirect("/cart");
    } catch (error) {
      logger.error(`Clear cart failed: ${error.message}`);

      req.flash("error", "Failed to clear cart.");

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).redirect("/cart");
    }
  }
  // Cart Summary
  async getCartSummary(req, res) {
    try {
      const cart = await Cart.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(req.user._id),
          },
        },
        {
          $unwind: "$items",
        },
        {
          $match: {
            "items.isSelected": true,
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "items.product",
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
            "product.isActive": true,
            "product.approvalStatus": "approved",
          },
        },
        {
          $group: {
            _id: null,

            totalItems: {
              $sum: "$items.quantity",
            },

            totalAmount: {
              $sum: {
                $multiply: ["$items.quantity", "$product.price"],
              },
            },
          },
        },
      ]);

      const summary =
        cart.length > 0
          ? cart[0]
          : {
              totalItems: 0,
              totalAmount: 0,
            };

      logger.info(`Cart summary loaded successfully. User ID: ${req.user._id}`);

      return res.status(httpStatusCode.OK).json({
        success: true,
        summary,
      });
    } catch (error) {
      logger.error(`Get cart summary failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to load cart summary.",
      });
    }
  }
}

module.exports = new CartController();
