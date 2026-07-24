const mongoose = require("mongoose");

const Checkout = require("../models/Checkout");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Address = require("../models/Address");
const Coupon = require("../models/Coupon");
const AuditLog = require("../models/AuditLog");
const Order = require("../models/Order");

const logger = require("../config/logger");

const httpStatusCode = require("../utils/httpStatusCode");

const {
  createCheckoutValidation,
  applyCouponValidation,
  removeCouponValidation,
} = require("../validations/checkoutValidation");

class CheckoutController {
  // Checkout Page
  async showCheckoutPage(req, res) {
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
      ]);

      if (!cart.length) {
        req.flash("error", "Please select at least one product.");

        return res.redirect("/cart");
      }

      const addresses = await Address.find({
        user: req.user._id,
        isDeleted: false,
      }).sort({
        isDefault: -1,
        createdAt: -1,
      });

      logger.info(
        `Checkout page loaded successfully. User ID: ${req.user._id}`,
      );

      return res.status(httpStatusCode.OK).render("checkout/index", {
        title: "Checkout",
        cart,
        addresses,
      });
    } catch (error) {
      logger.error(`Show checkout page failed: ${error.message}`);

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .render("errors/500", {
          title: "Server Error",
        });
    }
  }
  // Apply Coupon
  async applyCoupon(req, res) {
    try {
      const { error, value } = applyCouponValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/checkout");
      }

      const coupon = await Coupon.findOne({
        code: value.couponCode.toUpperCase(),
        isActive: true,
        isDeleted: false,
      });

      if (!coupon) {
        req.flash("error", "Invalid coupon.");

        return res.redirect("/checkout");
      }

      if (coupon.expiryDate < new Date()) {
        req.flash("error", "Coupon has expired.");

        return res.redirect("/checkout");
      }

      const checkout = await Checkout.findOne({
        user: req.user._id,
        status: "pending",
      });

      if (!checkout) {
        req.flash("error", "Checkout session not found.");

        return res.redirect("/checkout");
      }

      checkout.coupon = coupon._id;

      await checkout.save();

      await AuditLog.create({
        action: "APPLY_COUPON",
        performedBy: req.user._id,
        targetModel: "Checkout",
        targetId: checkout._id,
        description: `Coupon ${coupon.code} applied.`,
      });

      logger.info(`Coupon applied successfully. User ID: ${req.user._id}`);

      req.flash("success", "Coupon applied successfully.");

      return res.redirect("/checkout");
    } catch (error) {
      logger.error(`Apply coupon failed: ${error.message}`);

      req.flash("error", "Failed to apply coupon.");

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .redirect("/checkout");
    }
  }
  // Remove Coupon
  async removeCoupon(req, res) {
    try {
      removeCouponValidation.validate(req.body);

      const checkout = await Checkout.findOne({
        user: req.user._id,
        status: "pending",
      });

      if (!checkout) {
        req.flash("error", "Checkout session not found.");

        return res.redirect("/checkout");
      }

      checkout.coupon = null;

      await checkout.save();

      await AuditLog.create({
        action: "REMOVE_COUPON",
        performedBy: req.user._id,
        targetModel: "Checkout",
        targetId: checkout._id,
        description: "Coupon removed from checkout.",
      });

      logger.info(`Coupon removed successfully. User ID: ${req.user._id}`);

      req.flash("success", "Coupon removed successfully.");

      return res.redirect("/checkout");
    } catch (error) {
      logger.error(`Remove coupon failed: ${error.message}`);

      req.flash("error", "Failed to remove coupon.");

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .redirect("/checkout");
    }
  }
  // Place Order
  async placeOrder(req, res) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Validate request
      const { error, value } = createCheckoutValidation.validate(req.body);

      if (error) {
        await session.abortTransaction();
        session.endSession();

        req.flash("error", error.details[0].message);

        return res.redirect("/checkout");
      }

      // Check shipping address
      const address = await Address.findOne({
        _id: value.addressId,
        user: req.user._id,
        isDeleted: false,
      }).session(session);

      if (!address) {
        await session.abortTransaction();
        session.endSession();

        req.flash("error", "Shipping address not found.");

        return res.redirect("/checkout");
      }

      // Check cart
      const cart = await Cart.findOne({
        user: req.user._id,
      }).session(session);

      if (!cart || cart.items.length === 0) {
        await session.abortTransaction();
        session.endSession();

        req.flash("error", "Your cart is empty.");

        return res.redirect("/cart");
      }

      // Selected items
      const selectedItems = cart.items.filter((item) => item.isSelected);

      if (!selectedItems.length) {
        await session.abortTransaction();
        session.endSession();

        req.flash("error", "Please select at least one product.");

        return res.redirect("/cart");
      }

      // Pending checkout
      const checkout = await Checkout.findOne({
        user: req.user._id,
        status: "pending",
      }).session(session);

      if (!checkout) {
        await session.abortTransaction();
        session.endSession();

        req.flash("error", "Checkout session not found.");

        return res.redirect("/checkout");
      }

      const orderItems = [];

      let subtotal = 0;

      // Verify every product
      for (const item of selectedItems) {
        const product = await Product.findOne({
          _id: item.product,
          isDeleted: false,
          approvalStatus: "approved",
          status: "active",
        }).session(session);

        if (!product) {
          await session.abortTransaction();
          session.endSession();

          req.flash("error", "One or more selected products are unavailable.");

          return res.redirect("/cart");
        }

        if (product.stock < item.quantity) {
          await session.abortTransaction();
          session.endSession();

          req.flash(
            "error",
            `${product.name} has only ${product.stock} item(s) available.`,
          );

          return res.redirect("/cart");
        }

        const finalPrice = product.discountPrice ?? product.price;

        subtotal += finalPrice * item.quantity;

        const primaryImage =
          product.images.find((image) => image.isPrimary) || product.images[0];

        orderItems.push({
          product: product._id,

          seller: product.seller,

          productName: product.name,

          sku: product.sku,

          image: {
            publicId: primaryImage.publicId,
            url: primaryImage.url,
          },

          quantity: item.quantity,

          originalPrice: product.price,

          discountPrice: product.discountPrice,

          finalPrice,
        });
      }

      // Coupon calculation
      let coupon = null;

      let couponId = null;

      let couponCode = "";

      let discount = 0;

      if (checkout.coupon) {
        coupon = await Coupon.findOne({
          _id: checkout.coupon,
          status: "active",
          isDeleted: false,
        }).session(session);

        if (coupon) {
          const currentDate = new Date();

          if (
            currentDate < coupon.validFrom ||
            currentDate > coupon.validUntil
          ) {
            await session.abortTransaction();
            session.endSession();

            req.flash("error", "Coupon has expired.");

            return res.redirect("/checkout");
          }

          if (subtotal < coupon.minimumOrderAmount) {
            await session.abortTransaction();
            session.endSession();

            req.flash(
              "error",
              `Minimum purchase amount is ₹${coupon.minimumOrderAmount}.`,
            );

            return res.redirect("/checkout");
          }

          if (coupon.usedCount >= coupon.usageLimit) {
            await session.abortTransaction();
            session.endSession();

            req.flash("error", "Coupon usage limit exceeded.");

            return res.redirect("/checkout");
          }

          const previousUsage = await Order.countDocuments({
            user: req.user._id,
            coupon: coupon._id,
            paymentStatus: "paid",
          }).session(session);

          if (previousUsage >= coupon.maximumUsagePerUser) {
            await session.abortTransaction();
            session.endSession();

            req.flash(
              "error",
              "You have already used this coupon the maximum number of times.",
            );

            return res.redirect("/checkout");
          }

          if (coupon.discountType === "fixed") {
            discount = coupon.discountValue;
          } else {
            discount = (subtotal * coupon.discountValue) / 100;

            if (
              coupon.maximumDiscountAmount &&
              discount > coupon.maximumDiscountAmount
            ) {
              discount = coupon.maximumDiscountAmount;
            }
          }

          couponId = coupon._id;

          couponCode = coupon.code;
        }
      }

      const shippingCharge = 0;

      const tax = 0;

      const totalAmount = subtotal - discount + shippingCharge + tax;

      const shippingAddress = {
        fullName: address.fullName,

        countryCode: address.countryCode,

        phone: address.phone,

        addressLine1: address.addressLine1,

        addressLine2: address.addressLine2,

        landmark: address.landmark,

        city: address.city,

        state: address.state,

        postalCode: address.postalCode,

        country: address.country,
      };

      const orderNumber = `GN-${Date.now()}-${Math.floor(
        1000 + Math.random() * 9000,
      )}`;

      // Create order
      const order = await Order.create(
        [
          {
            orderNumber,

            user: req.user._id,

            shippingAddress,

            items: orderItems,

            subtotal,

            discount,

            shippingCharge,

            tax,

            totalAmount,

            coupon: couponId,

            couponCode,

            paymentMethod: "razorpay",

            orderStatus: "pending",

            paymentStatus: "pending",

            notes: value.notes || "",
          },
        ],
        {
          session,
        },
      );

      // Create Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100),

        currency: "INR",

        receipt: orderNumber,

        payment_capture: 1,

        notes: {
          orderId: order[0]._id.toString(),
          customerId: req.user._id.toString(),
        },
      });

      // Create payment
      const payment = await Payment.create(
        [
          {
            order: order[0]._id,

            user: req.user._id,

            amount: totalAmount,

            currency: "INR",

            paymentMethod: "razorpay",

            paymentGateway: "razorpay",

            gatewayOrderId: razorpayOrder.id,

            paymentStatus: "pending",
          },
        ],
        {
          session,
        },
      );

      // Update order
      order[0].payment = payment[0]._id;

      order[0].razorpayOrderId = razorpayOrder.id;

      await order[0].save({
        session,
      });

      // Update product stock
      for (const item of orderItems) {
        await Product.findByIdAndUpdate(
          item.product,
          {
            $inc: {
              stock: -item.quantity,

              soldCount: item.quantity,
            },
          },
          {
            session,
          },
        );
      }

      // Update coupon usage
      if (couponId) {
        await Coupon.findByIdAndUpdate(
          couponId,
          {
            $inc: {
              usedCount: 1,
            },
          },
          {
            session,
          },
        );
      }

      // Remove purchased products from cart
      cart.items = cart.items.filter((item) => !item.isSelected);

      await cart.save({
        session,
      });

      // Delete checkout session
      await Checkout.deleteOne(
        {
          _id: checkout._id,
        },
        {
          session,
        },
      );

      // Audit log
      await AuditLog.create(
        [
          {
            action: "PLACE_ORDER",

            performedBy: req.user._id,

            targetModel: "Order",

            targetId: order[0]._id,

            description: `Order ${orderNumber} placed successfully.`,
          },
        ],
        {
          session,
        },
      );

      await session.commitTransaction();

      session.endSession();

      logger.info(
        `Order placed successfully. Order ID: ${order[0]._id}, User ID: ${req.user._id}`,
      );

      return res.redirect(`/payment/${payment[0]._id}`);
    } catch (error) {
      await session.abortTransaction();

      session.endSession();

      logger.error(`Place order failed: ${error.message}`);

      req.flash("error", "Failed to place order. Please try again.");

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .redirect("/checkout");
    }
  }
}

module.exports = new CheckoutController();
