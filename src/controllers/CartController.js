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
  // ==========================================================
  // CART PAGE
  // ==========================================================

  async showCartPage(req, res) {
    try {
      const { error, value } = cartQueryValidation.validate(req.query);

      if (error) {
        logger.warn(
          `Invalid cart query. User ID: ${req.user._id}, Error: ${error.details[0].message}`,
        );

        return res.redirect("/cart");
      }

      const { page, limit } = value;

      const skip = (page - 1) * limit;

      const cartResult = await Cart.aggregate([
        // ==================================================
        // USER CART
        // ==================================================

        {
          $match: {
            user: new mongoose.Types.ObjectId(req.user._id),
          },
        },

        // ==================================================
        // UNWIND
        // ==================================================

        {
          $unwind: "$items",
        },

        // ==================================================
        // PRODUCT
        // ==================================================

        {
          $lookup: {
            from: "products",

            localField: "items.product",

            foreignField: "_id",

            as: "product",
          },
        },

        {
          $unwind: {
            path: "$product",

            preserveNullAndEmptyArrays: false,
          },
        },

        // ==================================================
        // VALID PRODUCTS
        // ==================================================

        {
          $match: {
            "product.isDeleted": false,

            "product.approvalStatus": "approved",

            "product.status": {
              $in: ["active", "out-of-stock"],
            },
          },
        },

        // ==================================================
        // SELLING PRICE
        // ==================================================

        {
          $set: {
            sellingPrice: {
              $cond: [
                {
                  $and: [
                    {
                      $ne: ["$product.discountPrice", null],
                    },

                    {
                      $lt: ["$product.discountPrice", "$product.price"],
                    },
                  ],
                },

                "$product.discountPrice",

                "$product.price",
              ],
            },
          },
        },

        // ==================================================
        // CALCULATIONS
        // ==================================================

        {
          $set: {
            itemSubtotal: {
              $multiply: ["$sellingPrice", "$items.quantity"],
            },

            isOutOfStock: {
              $lte: ["$product.stock", 0],
            },

            hasInsufficientStock: {
              $gt: ["$items.quantity", "$product.stock"],
            },
          },
        },

        // ==================================================
        // PROJECT
        // ==================================================

        {
          $project: {
            _id: 0,

            productId: "$product._id",

            name: "$product.name",

            slug: "$product.slug",

            sku: "$product.sku",

            images: "$product.images",

            price: "$product.price",

            discountPrice: "$product.discountPrice",

            sellingPrice: 1,

            stock: "$product.stock",

            quantity: "$items.quantity",

            isSelected: "$items.isSelected",

            subtotal: "$itemSubtotal",

            isOutOfStock: 1,

            hasInsufficientStock: 1,
          },
        },

        // ==================================================
        // PAGINATION
        // ==================================================

        {
          $facet: {
            items: [
              {
                $skip: skip,
              },

              {
                $limit: limit,
              },
            ],

            totalItems: [
              {
                $count: "count",
              },
            ],
          },
        },
      ]);

      const result = cartResult[0] || {};

      const cart = result.items || [];

      const totalItems = result.totalItems?.[0]?.count || 0;

      const totalPages = totalItems > 0 ? Math.ceil(totalItems / limit) : 0;

      if (totalPages > 0 && page > totalPages) {
        return res.redirect(`/cart?page=${totalPages}`);
      }

      // ======================================================
      // SELECTED ITEMS
      // ======================================================

      const selectedItems = cart.filter(
        (item) =>
          item.isSelected && !item.isOutOfStock && !item.hasInsufficientStock,
      );

      // ======================================================
      // QUANTITY
      // ======================================================

      const selectedQuantity = selectedItems.reduce(
        (total, item) => total + Number(item.quantity || 0),

        0,
      );

      // ======================================================
      // SUBTOTAL
      // ======================================================

      const subtotal = Number(
        selectedItems
          .reduce(
            (total, item) => total + Number(item.subtotal || 0),

            0,
          )
          .toFixed(2),
      );

      // ======================================================
      // SHIPPING
      // ======================================================

      const shippingCharge = subtotal > 0 ? (subtotal > 999 ? 0 : 100) : 0;

      // ======================================================
      // GST
      // ======================================================

      const tax = subtotal > 0 ? Number((subtotal * 0.18).toFixed(2)) : 0;

      // ======================================================
      // PLATFORM
      // ======================================================

      const platformFee = subtotal > 0 ? 49 : 0;

      // ======================================================
      // DISCOUNT
      // ======================================================

      const discount = 0;

      // ======================================================
      // TOTAL
      // ======================================================

      const totalAmount = Number(
        (subtotal + shippingCharge + tax + platformFee - discount).toFixed(2),
      );

      // ======================================================
      // STOCK ISSUES
      // ======================================================

      const hasStockIssues = cart.some(
        (item) => item.isOutOfStock || item.hasInsufficientStock,
      );

      return res.status(httpStatusCode.OK).render("cart/index", {
        title: "Shopping Cart",

        cart,

        selectedItems,

        currentPage: page,

        totalPages,

        totalItems,

        limit,

        selectedQuantity,

        subtotal,

        shippingCharge,

        tax,

        platformFee,

        discount,

        totalAmount,

        hasStockIssues,
      });
    } catch (error) {
      logger.error(`Show cart page failed: ${error.stack || error.message}`);

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .render("errors/500", {
          title: "Server Error",
        });
    }
  }

  // ==========================================================
  // ADD TO CART
  // ==========================================================

  async addToCart(req, res) {
    const redirectUrl = req.get("Referer") || "/shop";

    try {
      const { productId, quantity = 1 } = req.body;

      if (!productId) {
        return res.redirect(redirectUrl);
      }

      const product = await Product.findOne({
        _id: productId,

        isDeleted: false,

        approvalStatus: "approved",

        status: "active",
      });

      if (!product) {
        return res.redirect(redirectUrl);
      }

      if (product.stock <= 0) {
        return res.redirect(redirectUrl);
      }

      const requestedQuantity = Math.max(Number(quantity) || 1, 1);

      if (requestedQuantity > product.stock) {
        return res.redirect(redirectUrl);
      }

      let cart = await Cart.findOne({
        user: req.user._id,
      });

      // ======================================================
      // CREATE
      // ======================================================

      if (!cart) {
        cart = await Cart.create({
          user: req.user._id,

          items: [
            {
              product: product._id,

              quantity: requestedQuantity,

              isSelected: true,
            },
          ],
        });
      }

      // ======================================================
      // EXISTING
      // ======================================================
      else {
        const existingItem = cart.items.find(
          (item) => item.product.toString() === product._id.toString(),
        );

        if (existingItem) {
          const newQuantity = Number(existingItem.quantity) + requestedQuantity;

          if (newQuantity > product.stock) {
            return res.redirect(redirectUrl);
          }

          existingItem.quantity = newQuantity;

          existingItem.isSelected = true;
        } else {
          cart.items.push({
            product: product._id,

            quantity: requestedQuantity,

            isSelected: true,
          });
        }

        await cart.save();
      }

      // ======================================================
      // AUDIT
      // ======================================================

      await AuditLog.create({
        action: "ADD_TO_CART",

        performedBy: req.user._id,

        targetModel: "Cart",

        targetId: cart._id,

        description: `Added ${requestedQuantity} ${
          requestedQuantity === 1 ? "unit" : "units"
        } of ${product.name} to cart.`,
      });

      return res.redirect("/cart");
    } catch (error) {
      logger.error(`Add to cart failed: ${error.stack || error.message}`);

      return res.redirect(redirectUrl);
    }
  }

  // ==========================================================
  // UPDATE QUANTITY
  // ==========================================================

  async updateCartQuantity(req, res) {
    try {
      const { productId, quantity } = req.body;

      const newQuantity = Number(quantity);

      if (!productId || !Number.isInteger(newQuantity) || newQuantity < 1) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid quantity.",
        });
      }

      // ==========================================================
      // PRODUCT
      // ==========================================================

      const product = await Product.findOne({
        _id: productId,

        isDeleted: false,

        approvalStatus: "approved",

        status: "active",
      });

      if (!product) {
        return res.status(httpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Product not found.",
        });
      }

      // ==========================================================
      // STOCK
      // ==========================================================

      if (newQuantity > product.stock) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: `Only ${product.stock} item(s) available.`,
        });
      }

      // ==========================================================
      // CART
      // ==========================================================

      const cart = await Cart.findOne({
        user: req.user._id,
      });

      if (!cart) {
        return res.status(httpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Cart not found.",
        });
      }

      // ==========================================================
      // CART ITEM
      // ==========================================================

      const item = cart.items.find(
        (item) => item.product.toString() === productId.toString(),
      );

      if (!item) {
        return res.status(httpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Product is not in your cart.",
        });
      }

      // ==========================================================
      // UPDATE QUANTITY
      // ==========================================================

      item.quantity = newQuantity;

      await cart.save();

      // ==========================================================
      // TOTAL CART QUANTITY
      //
      // Example:
      //
      // Product A = 2
      // Product B = 4
      //
      // cartTotalQuantity = 6
      // ==========================================================

      const cartTotalQuantity = cart.items.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0,
      );

      // ==========================================================
      // AUDIT
      // ==========================================================

      await AuditLog.create({
        actor: {
          user: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },

        module: "Cart",

        action: "Update Cart",

        severity: "info",

        success: true,

        target: {
          model: "Cart",
          id: cart._id,
          name: "Cart",
        },

        description: `Updated ${product.name} quantity to ${newQuantity}.`,
      });
      // ==========================================================
      // RESPONSE
      // ==========================================================

      return res.status(httpStatusCode.OK).json({
        success: true,

        message: "Cart updated successfully.",

        quantity: newQuantity,

        cartTotalQuantity,
      });
    } catch (error) {
      logger.error(
        `Update cart quantity failed: ${error.stack || error.message}`,
      );

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to update quantity. Please try again.",
      });
    }
  }
  // ==========================================================
  // TOGGLE CART ITEM
  // ==========================================================

  async toggleCartItem(req, res) {
    try {
      // ------------------------------------------------------
      // VALIDATE
      // ------------------------------------------------------

      const { error, value } = toggleCartItemValidation.validate(req.body);

      if (error) {
        logger.warn(
          `Toggle cart item validation failed. User ID: ${req.user._id}, Error: ${error.details[0].message}`,
        );

        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid cart selection.",
        });
      }

      // ------------------------------------------------------
      // CART
      // ------------------------------------------------------

      const cart = await Cart.findOne({
        user: req.user._id,
      });

      if (!cart) {
        logger.warn(
          `Cart not found during toggle operation. User ID: ${req.user._id}`,
        );

        return res.status(httpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Cart not found.",
        });
      }

      // ------------------------------------------------------
      // CART ITEM
      // ------------------------------------------------------

      const item = cart.items.find(
        (item) => item.product.toString() === value.productId.toString(),
      );

      if (!item) {
        logger.warn(
          `Cart item not found during toggle operation. User ID: ${req.user._id}, Product ID: ${value.productId}`,
        );

        return res.status(httpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Product is not in your cart.",
        });
      }

      // ------------------------------------------------------
      // UPDATE SELECTION
      // ------------------------------------------------------

      item.isSelected = value.isSelected;

      await cart.save();

      // ------------------------------------------------------
      // AUDIT LOG
      // ------------------------------------------------------

      await AuditLog.create({
        actor: {
          user: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },

        module: "Cart",

        action: "Update Cart",

        severity: "info",

        success: true,

        target: {
          model: "Cart",
          id: cart._id,
          name: "Shopping Cart",
        },

        description: `${
          value.isSelected ? "Selected" : "Deselected"
        } product in cart.`,

        metadata: {
          productId: value.productId,
          isSelected: value.isSelected,
        },

        request: {
          ipAddress: req.ip,
          method: req.method,
          path: req.originalUrl,
          userAgent: req.get("User-Agent") || "",
        },
      });

      // ------------------------------------------------------
      // LOGGER
      // ------------------------------------------------------

      logger.info(
        `Cart item selection updated. User ID: ${req.user._id}, Product ID: ${value.productId}, Selected: ${value.isSelected}`,
      );

      // ------------------------------------------------------
      // RESPONSE
      // ------------------------------------------------------

      return res.status(httpStatusCode.OK).json({
        success: true,

        message: value.isSelected ? "Product selected." : "Product deselected.",

        productId: value.productId,

        isSelected: value.isSelected,
      });
    } catch (error) {
      logger.error(`Toggle cart item failed: ${error.stack || error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to update cart selection. Please try again.",
      });
    }
  }

  // ==========================================================
  // REMOVE FROM CART
  // ==========================================================

  async removeFromCart(req, res) {
    try {
      const { productId } = req.body;

      if (!productId) {
        return res.redirect("/cart");
      }

      const cart = await Cart.findOne({
        user: req.user._id,
      });

      if (!cart) {
        return res.redirect("/cart");
      }

      const existingItem = cart.items.find(
        (item) => item.product.toString() === productId.toString(),
      );

      if (!existingItem) {
        return res.redirect("/cart");
      }

      cart.items = cart.items.filter(
        (item) => item.product.toString() !== productId.toString(),
      );

      await cart.save();

      await AuditLog.create({
        action: "REMOVE_FROM_CART",

        performedBy: req.user._id,

        targetModel: "Cart",

        targetId: cart._id,

        description: `Removed product ${productId} from cart.`,
      });

      return res.redirect("/cart");
    } catch (error) {
      logger.error(`Remove from cart failed: ${error.stack || error.message}`);

      return res.redirect("/cart");
    }
  }

  // ==========================================================
  // CLEAR CART
  // ==========================================================

  async clearCart(req, res) {
    try {
      const { error } = clearCartValidation.validate(req.body);

      if (error) {
        return res.redirect("/cart");
      }

      const cart = await Cart.findOne({
        user: req.user._id,
      });

      if (!cart) {
        return res.redirect("/cart");
      }

      cart.items = [];

      await cart.save();

      await AuditLog.create({
        action: "CLEAR_CART",

        performedBy: req.user._id,

        targetModel: "Cart",

        targetId: cart._id,

        description: "Cleared all items from cart.",
      });

      return res.redirect("/cart");
    } catch (error) {
      logger.error(`Clear cart failed: ${error.stack || error.message}`);

      return res.redirect("/cart");
    }
  }

  // ==========================================================
  // CART SUMMARY
  // ==========================================================

  async getCartSummary(req, res) {
    try {
      const cartResult = await Cart.aggregate([
        // ==================================================
        // USER
        // ==================================================

        {
          $match: {
            user: new mongoose.Types.ObjectId(req.user._id),
          },
        },

        // ==================================================
        // ITEMS
        // ==================================================

        {
          $unwind: "$items",
        },

        // ==================================================
        // SELECTED ITEMS
        // ==================================================

        {
          $match: {
            "items.isSelected": true,
          },
        },

        // ==================================================
        // PRODUCT
        // ==================================================

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

        // ==================================================
        // VALID PRODUCT
        // ==================================================

        {
          $match: {
            "product.isDeleted": false,

            "product.approvalStatus": "approved",

            "product.status": "active",

            "product.stock": {
              $gt: 0,
            },
          },
        },

        // ==================================================
        // PRICE
        // ==================================================

        {
          $set: {
            sellingPrice: {
              $cond: [
                {
                  $and: [
                    {
                      $ne: ["$product.discountPrice", null],
                    },

                    {
                      $lt: ["$product.discountPrice", "$product.price"],
                    },
                  ],
                },

                "$product.discountPrice",

                "$product.price",
              ],
            },
          },
        },

        // ==================================================
        // ITEM SUBTOTAL
        // ==================================================

        {
          $set: {
            itemSubtotal: {
              $multiply: ["$items.quantity", "$sellingPrice"],
            },
          },
        },

        // ==================================================
        // GROUP
        // ==================================================

        {
          $group: {
            _id: null,

            totalItems: {
              $sum: "$items.quantity",
            },

            subtotal: {
              $sum: "$itemSubtotal",
            },
          },
        },
      ]);

      // ======================================================
      // SUMMARY
      // ======================================================

      const summary = cartResult[0] || {
        totalItems: 0,

        subtotal: 0,
      };

      const totalItems = Number(summary.totalItems || 0);

      const subtotal = Number(Number(summary.subtotal || 0).toFixed(2));

      const shippingCharge = subtotal > 0 ? (subtotal > 999 ? 0 : 100) : 0;

      const tax = subtotal > 0 ? Number((subtotal * 0.18).toFixed(2)) : 0;

      const platformFee = subtotal > 0 ? 49 : 0;

      const discount = 0;

      const totalAmount = Number(
        (subtotal + shippingCharge + tax + platformFee - discount).toFixed(2),
      );

      return res.status(httpStatusCode.OK).json({
        success: true,

        summary: {
          totalItems,

          subtotal,

          shippingCharge,

          tax,

          platformFee,

          discount,

          totalAmount,
        },
      });
    } catch (error) {
      logger.error(`Get cart summary failed: ${error.stack || error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to load cart summary.",
      });
    }
  }
}

module.exports = new CartController();
