const mongoose = require("mongoose");

const Checkout = require("../models/Checkout");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Address = require("../models/Address");
const Coupon = require("../models/Coupon");
const AuditLog = require("../models/AuditLog");
const Order = require("../models/Order");
const Payment = require("../models/Payment");

const razorpay = require("../config/razorpay");

const logger = require("../config/logger");

const httpStatusCode = require("../utils/httpStatusCode");

const {
  createCheckoutValidation,
  applyCouponValidation,
  removeCouponValidation,
} = require("../validations/checkoutValidation");

class CheckoutController {
  constructor() {
    this.calculateCheckout = this.calculateCheckout.bind(this);
    this.showCheckoutPage = this.showCheckoutPage.bind(this);
    this.applyCoupon = this.applyCoupon.bind(this);
    this.removeCoupon = this.removeCoupon.bind(this);
    this.placeOrder = this.placeOrder.bind(this);
  }
  // ==========================================================
  // CALCULATE CHECKOUT
  // ==========================================================

  async calculateCheckout(req, couponId = null) {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const cartItems = await Cart.aggregate([
      {
        $match: {
          user: userId,
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
          "product.status": "active",
          "product.approvalStatus": "approved",
        },
      },

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

      {
        $set: {
          itemSubtotal: {
            $multiply: ["$sellingPrice", "$items.quantity"],
          },
        },
      },

      {
        $project: {
          _id: 0,

          productId: "$product._id",

          name: "$product.name",

          slug: "$product.slug",

          sku: "$product.sku",

          images: "$product.images",

          quantity: "$items.quantity",

          price: "$product.price",

          discountPrice: "$product.discountPrice",

          sellingPrice: 1,

          itemSubtotal: 1,

          stock: "$product.stock",

          seller: "$product.seller",
        },
      },
    ]);

    // ========================================================
    // EMPTY
    // ========================================================

    if (!cartItems.length) {
      return {
        cartItems: [],

        subtotal: 0,

        discount: 0,

        shippingCharge: 0,

        tax: 0,

        platformFee: 0,

        totalAmount: 0,

        coupon: null,
      };
    }

    // ========================================================
    // VERIFY STOCK
    // ========================================================

    for (const item of cartItems) {
      if (item.stock <= 0) {
        throw new Error(`${item.name} is currently out of stock.`);
      }

      if (item.quantity > item.stock) {
        throw new Error(
          `${item.name} has only ${item.stock} item(s) available.`,
        );
      }
    }

    // ========================================================
    // SUBTOTAL
    // ========================================================

    const subtotal = Number(
      cartItems
        .reduce((total, item) => total + Number(item.itemSubtotal || 0), 0)
        .toFixed(2),
    );

    // ========================================================
    // COUPON
    // ========================================================

    let coupon = null;

    let discount = 0;

    if (couponId) {
      coupon = await Coupon.findOne({
        _id: couponId,

        isDeleted: false,

        $or: [
          {
            status: "active",
          },

          {
            isActive: true,
          },
        ],
      });

      if (!coupon) {
        throw new Error("Invalid coupon.");
      }

      // ======================================================
      // DATE
      // ======================================================

      const now = new Date();

      if (coupon.validFrom && now < coupon.validFrom) {
        throw new Error("Coupon is not active yet.");
      }

      if (coupon.validUntil && now > coupon.validUntil) {
        throw new Error("Coupon has expired.");
      }

      if (coupon.expiryDate && now > coupon.expiryDate) {
        throw new Error("Coupon has expired.");
      }

      // ======================================================
      // MINIMUM ORDER
      // ======================================================

      if (coupon.minimumOrderAmount && subtotal < coupon.minimumOrderAmount) {
        throw new Error(
          `Minimum purchase amount is ₹${coupon.minimumOrderAmount}.`,
        );
      }

      // ======================================================
      // GLOBAL USAGE
      // ======================================================

      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        throw new Error("Coupon usage limit exceeded.");
      }

      // ======================================================
      // PER USER USAGE
      // ======================================================

      if (coupon.maximumUsagePerUser) {
        const previousUsage = await Order.countDocuments({
          user: req.user._id,

          coupon: coupon._id,

          paymentStatus: "paid",
        });

        if (previousUsage >= coupon.maximumUsagePerUser) {
          throw new Error(
            "You have already used this coupon the maximum number of times.",
          );
        }
      }

      // ======================================================
      // DISCOUNT
      // ======================================================

      if (coupon.discountType === "fixed") {
        discount = Number(coupon.discountValue) || 0;
      } else {
        discount = (subtotal * Number(coupon.discountValue || 0)) / 100;

        if (
          coupon.maximumDiscountAmount &&
          discount > coupon.maximumDiscountAmount
        ) {
          discount = coupon.maximumDiscountAmount;
        }
      }

      discount = Math.min(discount, subtotal);

      discount = Number(discount.toFixed(2));
    }

    // ========================================================
    // SHIPPING
    // ========================================================

    const shippingCharge = subtotal > 999 ? 0 : 100;

    // ========================================================
    // GST
    // ========================================================

    const tax = Number((subtotal * 0.18).toFixed(2));

    // ========================================================
    // PLATFORM FEE
    // ========================================================

    const platformFee = subtotal > 0 ? 49 : 0;

    // ========================================================
    // GRAND TOTAL
    // ========================================================

    const totalAmount = Number(
      (subtotal - discount + shippingCharge + tax + platformFee).toFixed(2),
    );

    return {
      cartItems,

      subtotal,

      discount,

      shippingCharge,

      tax,

      platformFee,

      totalAmount,

      coupon,
    };
  }

  // ==========================================================
  // CHECKOUT PAGE
  // ==========================================================

  async showCheckoutPage(req, res) {
    try {
      // ======================================================
      // SELECTED CART
      // ======================================================

      const calculation = await this.calculateCheckout(req);

      if (!calculation.cartItems.length) {
        logger.error(
          `Checkout failed: No selected products. User ID: ${req.user._id}`,
        );

        return res.redirect("/cart");
      }

      // ======================================================
      // ADDRESSES
      // ======================================================

      const addresses = await Address.find({
        user: req.user._id,

        isDeleted: false,
      })
        .sort({
          isDefault: -1,

          createdAt: -1,
        })
        .lean();

      // ======================================================
      // NO ADDRESS
      // ======================================================

      if (!addresses.length) {
        logger.info(
          `No delivery address found. Redirecting user to address creation. User ID: ${req.user._id}`,
        );

        return res.redirect("/addresses/create");
      }

      // ======================================================
      // DEFAULT ADDRESS
      // ======================================================

      const defaultAddress =
        addresses.find((address) => address.isDefault) || addresses[0];

      // ======================================================
      // EXISTING CHECKOUT
      // ======================================================

      let checkout = await Checkout.findOne({
        user: req.user._id,

        status: "pending",
      });

      // ======================================================
      // RECALCULATE WITH EXISTING COUPON
      // ======================================================

      let finalCalculation = calculation;

      if (checkout?.coupon) {
        try {
          finalCalculation = await this.calculateCheckout(req, checkout.coupon);
        } catch (error) {
          logger.error(`Existing checkout coupon invalid: ${error.message}`);

          checkout.coupon = null;

          await checkout.save();

          finalCalculation = await this.calculateCheckout(req);
        }
      }

      // ======================================================
      // CREATE CHECKOUT
      // ======================================================

      if (!checkout) {
        checkout = await Checkout.create({
          user: req.user._id,

          cartItems: finalCalculation.cartItems.map((item) => ({
            product: item.productId,

            quantity: item.quantity,

            price: item.sellingPrice,
          })),

          address: defaultAddress._id,

          coupon: finalCalculation.coupon?._id || null,

          subtotal: finalCalculation.subtotal,

          discount: finalCalculation.discount,

          shippingCharge: finalCalculation.shippingCharge,

          tax: finalCalculation.tax,

          platformFee: finalCalculation.platformFee,

          totalAmount: finalCalculation.totalAmount,

          paymentMethod: "razorpay",

          status: "pending",
        });
      } else {
        // ====================================================
        // REFRESH EXISTING CHECKOUT
        // ====================================================

        checkout.cartItems = finalCalculation.cartItems.map((item) => ({
          product: item.productId,

          quantity: item.quantity,

          price: item.sellingPrice,
        }));

        checkout.subtotal = finalCalculation.subtotal;

        checkout.discount = finalCalculation.discount;

        checkout.shippingCharge = finalCalculation.shippingCharge;

        checkout.tax = finalCalculation.tax;

        checkout.platformFee = finalCalculation.platformFee;

        checkout.totalAmount = finalCalculation.totalAmount;

        // ====================================================
        // KEEP ADDRESS IF VALID
        // ====================================================

        const selectedAddress = addresses.find(
          (address) => address._id.toString() === checkout.address?.toString(),
        );

        if (!selectedAddress) {
          checkout.address = defaultAddress._id;
        }

        await checkout.save();
      }

      // ======================================================
      // RENDER CHECKOUT
      // ======================================================

      return res.status(httpStatusCode.OK).render("checkout/index", {
        title: "Checkout",

        cart: finalCalculation.cartItems,

        addresses,

        selectedAddressId: checkout.address,

        subtotal: finalCalculation.subtotal,

        discount: finalCalculation.discount,

        shippingCharge: finalCalculation.shippingCharge,

        tax: finalCalculation.tax,

        platformFee: finalCalculation.platformFee,

        totalAmount: finalCalculation.totalAmount,

        coupon: finalCalculation.coupon,

        checkout,

        noAddress: false,
      });
    } catch (error) {
      logger.error(
        `Show checkout page failed: ${error.stack || error.message}`,
      );

      return res.redirect("/cart");
    }
  }

  // ==========================================================
  // APPLY COUPON
  // ==========================================================

  async applyCoupon(req, res) {
    try {
      const { error, value } = applyCouponValidation.validate(req.body);

      if (error) {
        logger.error(
          `Apply coupon validation failed: ${error.details[0].message}`,
        );

        return res.redirect("/checkout");
      }

      const coupon = await Coupon.findOne({
        code: value.couponCode.toUpperCase(),

        isDeleted: false,

        $or: [
          {
            status: "active",
          },

          {
            isActive: true,
          },
        ],
      });

      if (!coupon) {
        logger.error("Apply coupon failed: Invalid coupon.");

        return res.redirect("/checkout");
      }

      const checkout = await Checkout.findOne({
        user: req.user._id,

        status: "pending",
      });

      if (!checkout) {
        logger.error(
          `Apply coupon failed: Checkout session not found. User ID: ${req.user._id}`,
        );

        return res.redirect("/checkout");
      }

      // ======================================================
      // CALCULATE
      // ======================================================

      const calculation = await this.calculateCheckout(req, coupon._id);

      // ======================================================
      // SAVE
      // ======================================================

      checkout.coupon = coupon._id;

      checkout.cartItems = calculation.cartItems.map((item) => ({
        product: item.productId,

        quantity: item.quantity,

        price: item.sellingPrice,
      }));

      checkout.subtotal = calculation.subtotal;

      checkout.discount = calculation.discount;

      checkout.shippingCharge = calculation.shippingCharge;

      checkout.tax = calculation.tax;

      checkout.platformFee = calculation.platformFee;

      checkout.totalAmount = calculation.totalAmount;

      await checkout.save();

      // ======================================================
      // AUDIT
      // ======================================================

      await AuditLog.create({
        action: "APPLY_COUPON",

        performedBy: req.user._id,

        targetModel: "Checkout",

        targetId: checkout._id,

        description: `Coupon ${coupon.code} applied.`,
      });

      logger.info(
        `Coupon ${coupon.code} applied successfully. User ID: ${req.user._id}`,
      );

      return res.redirect("/checkout");
    } catch (error) {
      logger.error(`Apply coupon failed: ${error.stack || error.message}`);

      return res.redirect("/checkout");
    }
  }

  // ==========================================================
  // REMOVE COUPON
  // ==========================================================

  async removeCoupon(req, res) {
    try {
      const { error } = removeCouponValidation.validate(req.body);

      if (error) {
        logger.error(
          `Remove coupon validation failed: ${error.details[0].message}`,
        );

        return res.redirect("/checkout");
      }

      const checkout = await Checkout.findOne({
        user: req.user._id,

        status: "pending",
      });

      if (!checkout) {
        logger.error(
          `Remove coupon failed: Checkout session not found. User ID: ${req.user._id}`,
        );

        return res.redirect("/checkout");
      }

      checkout.coupon = null;

      const calculation = await this.calculateCheckout(req, null);

      checkout.cartItems = calculation.cartItems.map((item) => ({
        product: item.productId,

        quantity: item.quantity,

        price: item.sellingPrice,
      }));

      checkout.subtotal = calculation.subtotal;

      checkout.discount = 0;

      checkout.shippingCharge = calculation.shippingCharge;

      checkout.tax = calculation.tax;

      checkout.platformFee = calculation.platformFee;

      checkout.totalAmount = calculation.totalAmount;

      await checkout.save();

      await AuditLog.create({
        action: "REMOVE_COUPON",

        performedBy: req.user._id,

        targetModel: "Checkout",

        targetId: checkout._id,

        description: "Coupon removed from checkout.",
      });

      logger.info(`Coupon removed successfully. User ID: ${req.user._id}`);

      return res.redirect("/checkout");
    } catch (error) {
      logger.error(`Remove coupon failed: ${error.stack || error.message}`);

      return res.redirect("/checkout");
    }
  }

  // ==========================================================
  // PLACE ORDER
  //
  // IMPORTANT:
  // No stock deduction here.
  // No soldCount update here.
  // No cart removal here.
  //
  // These happen AFTER successful payment.
  // ==========================================================

  async placeOrder(req, res) {
    try {
      // ======================================================
      // VALIDATE
      // ======================================================

      const { error, value } = createCheckoutValidation.validate(req.body);

      if (error) {
        logger.error(
          `Place order validation failed: ${error.details[0].message}`,
        );

        return res.redirect("/checkout");
      }

      // ======================================================
      // ADDRESS
      // ======================================================

      const address = await Address.findOne({
        _id: value.addressId,

        user: req.user._id,

        isDeleted: false,
      }).lean();

      if (!address) {
        logger.error(
          `Place order failed: Shipping address not found. User ID: ${req.user._id}`,
        );

        return res.redirect("/checkout");
      }

      // ======================================================
      // CART
      // ======================================================

      const cart = await Cart.findOne({
        user: req.user._id,
      });

      if (!cart || !cart.items.length) {
        logger.error(
          `Place order failed: Cart is empty. User ID: ${req.user._id}`,
        );

        return res.redirect("/cart");
      }

      // ======================================================
      // SELECTED
      // ======================================================

      const selectedItems = cart.items.filter((item) => item.isSelected);

      if (!selectedItems.length) {
        logger.error(
          `Place order failed: No selected products. User ID: ${req.user._id}`,
        );

        return res.redirect("/cart");
      }

      // ======================================================
      // CHECKOUT
      // ======================================================

      const checkout = await Checkout.findOne({
        user: req.user._id,

        status: "pending",
      });

      if (!checkout) {
        logger.error(
          `Place order failed: Checkout session not found. User ID: ${req.user._id}`,
        );

        return res.redirect("/checkout");
      }

      // ======================================================
      // RECALCULATE FROM DATABASE
      // ======================================================

      const calculation = await this.calculateCheckout(
        req,
        checkout.coupon || null,
      );

      // ======================================================
      // CHECK CART COUNT
      // ======================================================

      if (calculation.cartItems.length !== selectedItems.length) {
        logger.error(
          `Place order failed: Cart changed during checkout. User ID: ${req.user._id}`,
        );

        return res.redirect("/cart");
      }

      // ======================================================
      // ORDER ITEMS
      // ======================================================

      const orderItems = [];

      for (const item of calculation.cartItems) {
        const product = await Product.findOne({
          _id: item.productId,

          isDeleted: false,

          status: "active",

          approvalStatus: "approved",
        });

        if (!product) {
          logger.error(
            `Place order failed: Selected product is unavailable. Product ID: ${item.productId}`,
          );

          return res.redirect("/cart");
        }

        // ====================================================
        // FINAL STOCK CHECK
        // ====================================================

        if (product.stock < item.quantity) {
          logger.error(
            `Place order failed: ${product.name} has only ${product.stock} item(s) available.`,
          );

          return res.redirect("/cart");
        }

        const primaryImage =
          product.images?.find((image) => image.isPrimary) ||
          product.images?.[0];

        orderItems.push({
          product: product._id,

          seller: product.seller,

          productName: product.name,

          sku: product.sku,

          image: primaryImage
            ? {
                publicId: primaryImage.publicId,

                url: primaryImage.url,
              }
            : {
                publicId: "",

                url: "",
              },

          quantity: item.quantity,

          originalPrice: product.price,

          discountPrice: product.discountPrice,

          finalPrice: item.sellingPrice,
        });
      }

      // ======================================================
      // ADDRESS SNAPSHOT
      // ======================================================

      const shippingAddress = {
        fullName: address.fullName,

        countryCode: address.countryCode,

        phone: address.phone,

        alternatePhone: address.alternatePhone || "",

        addressLine1: address.addressLine1,

        addressLine2: address.addressLine2 || "",

        area: address.area || "",

        landmark: address.landmark || "",

        city: address.city,

        state: address.state,

        postalCode: address.postalCode,

        country: address.country,
      };

      // ======================================================
      // ORDER NUMBER
      // ======================================================

      const orderNumber = `GN-${Date.now()}-${Math.floor(
        1000 + Math.random() * 9000,
      )}`;

      // ======================================================
      // CREATE PENDING ORDER
      // ======================================================

      const order = await Order.create({
        orderNumber,

        user: req.user._id,

        shippingAddress,

        items: orderItems,

        subtotal: calculation.subtotal,

        discount: calculation.discount,

        shippingCharge: calculation.shippingCharge,

        tax: calculation.tax,

        platformFee: calculation.platformFee,

        totalAmount: calculation.totalAmount,

        coupon: calculation.coupon?._id || null,

        couponCode: calculation.coupon?.code || "",

        paymentMethod: "razorpay",

        orderStatus: "pending",

        paymentStatus: "pending",

        notes: value.notes || "",
      });

      // ======================================================
      // CREATE RAZORPAY ORDER
      // ======================================================

      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(calculation.totalAmount * 100),

        currency: "INR",

        receipt: orderNumber,

        notes: {
          orderId: order._id.toString(),

          customerId: req.user._id.toString(),
        },
      });

      // ======================================================
      // CREATE PAYMENT
      // ======================================================

      const payment = await Payment.create({
        order: order._id,

        user: req.user._id,

        amount: calculation.totalAmount,

        currency: "INR",

        paymentMethod: "razorpay",

        paymentGateway: "razorpay",

        gatewayOrderId: razorpayOrder.id,

        paymentStatus: "pending",
      });

      // ======================================================
      // UPDATE ORDER
      // ======================================================

      order.payment = payment._id;

      order.razorpayOrderId = razorpayOrder.id;

      await order.save();

      // ======================================================
      // UPDATE CHECKOUT
      // ======================================================

      checkout.address = address._id;

      checkout.cartItems = calculation.cartItems.map((item) => ({
        product: item.productId,

        quantity: item.quantity,

        price: item.sellingPrice,
      }));

      checkout.subtotal = calculation.subtotal;

      checkout.discount = calculation.discount;

      checkout.shippingCharge = calculation.shippingCharge;

      checkout.tax = calculation.tax;

      checkout.platformFee = calculation.platformFee;

      checkout.totalAmount = calculation.totalAmount;

      await checkout.save();

      // ======================================================
      // AUDIT
      // ======================================================

      await AuditLog.create({
        module: "Orders",

        action: "Place Order",

        severity: "info",

        success: true,

        actor: {
          user: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },

        target: {
          model: "Order",
          id: order._id,
          name: order.orderNumber,
        },

        description: `Created pending order ${order.orderNumber}.`,

        request: {
          ipAddress: req.ip,
          method: req.method,
          path: req.originalUrl,
          userAgent: req.get("user-agent") || "",
        },
      });

      logger.info(
        `Pending order created. Order ID: ${order._id}, Razorpay Order ID: ${razorpayOrder.id}`,
      );

      // ======================================================
      // PAYMENT PAGE
      // ======================================================

      return res.redirect(`/payment/${payment._id}`);
    } catch (error) {
      logger.error(`Place order failed: ${error.stack || error.message}`);

      return res.redirect("/checkout");
    }
  }
}

module.exports = new CheckoutController();
