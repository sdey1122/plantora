const mongoose = require("mongoose");
const crypto = require("crypto");

const Payment = require("../models/Payment");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const Coupon = require("../models/Coupon");
const Checkout = require("../models/Checkout");
const AuditLog = require("../models/AuditLog");

const razorpay = require("../config/razorpay");

const logger = require("../config/logger");
const httpStatusCode = require("../utils/httpStatusCode");

class PaymentController {
  // ==========================================================
  // PAYMENT PAGE
  // ==========================================================

  async showPaymentPage(req, res) {
    try {
      const { paymentId } = req.params;

      // ------------------------------------------------------
      // Validate payment ID
      // ------------------------------------------------------

      if (!mongoose.Types.ObjectId.isValid(paymentId)) {
        req.flash("error", "Invalid payment.");

        return res.redirect("/cart");
      }

      // ------------------------------------------------------
      // Find pending payment
      // ------------------------------------------------------

      const payment = await Payment.findOne({
        _id: paymentId,

        user: req.user._id,

        paymentStatus: "pending",
      }).lean();

      if (!payment) {
        req.flash("error", "Payment session not found or already processed.");

        return res.redirect("/cart");
      }

      // ------------------------------------------------------
      // Find order
      // ------------------------------------------------------

      const order = await Order.findOne({
        _id: payment.order,

        user: req.user._id,
      }).lean();

      if (!order) {
        req.flash("error", "Order not found.");

        return res.redirect("/cart");
      }

      // ------------------------------------------------------
      // Verify Razorpay order exists on our payment
      // ------------------------------------------------------

      if (!payment.gatewayOrderId) {
        req.flash("error", "Razorpay payment session is invalid.");

        return res.redirect("/checkout");
      }

      // ------------------------------------------------------
      // Render payment page
      // ------------------------------------------------------

      return res.status(httpStatusCode.OK).render("payment/index", {
        title: "Complete Payment",

        payment,

        order,

        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      logger.error(`Show payment page failed: ${error.stack || error.message}`);

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .render("errors/500", {
          title: "Server Error",
        });
    }
  }

  // ==========================================================
  // VERIFY RAZORPAY PAYMENT
  // ==========================================================

  async verifyPayment(req, res) {
    const session = await mongoose.startSession();

    try {
      await session.startTransaction();

      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        paymentId,
      } = req.body;

      // ======================================================
      // BASIC VALIDATION
      // ======================================================

      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature ||
        !paymentId
      ) {
        throw new Error("Incomplete Razorpay payment information.");
      }

      // ------------------------------------------------------
      // Validate MongoDB payment ID
      // ------------------------------------------------------

      if (!mongoose.Types.ObjectId.isValid(paymentId)) {
        throw new Error("Invalid payment ID.");
      }

      // ======================================================
      // FIND PAYMENT
      // ======================================================

      const payment = await Payment.findOne({
        _id: paymentId,

        user: req.user._id,

        paymentStatus: "pending",
      }).session(session);

      if (!payment) {
        throw new Error("Payment not found or already processed.");
      }

      // ======================================================
      // VERIFY RAZORPAY ORDER ID
      // ======================================================

      if (payment.gatewayOrderId !== razorpay_order_id) {
        throw new Error("Invalid Razorpay order.");
      }

      // ======================================================
      // FIND ORDER
      // ======================================================

      const order = await Order.findOne({
        _id: payment.order,

        user: req.user._id,

        paymentStatus: "pending",
      }).session(session);

      if (!order) {
        throw new Error("Order not found or already processed.");
      }

      // ======================================================
      // VERIFY RAZORPAY SIGNATURE
      // ======================================================

      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      // ------------------------------------------------------
      // Constant-time comparison
      // ------------------------------------------------------

      const generatedBuffer = Buffer.from(generatedSignature, "utf8");

      const receivedBuffer = Buffer.from(razorpay_signature, "utf8");

      if (
        generatedBuffer.length !== receivedBuffer.length ||
        !crypto.timingSafeEqual(generatedBuffer, receivedBuffer)
      ) {
        throw new Error("Invalid payment signature.");
      }

      // ======================================================
      // VERIFY PAYMENT WITH RAZORPAY
      // ======================================================

      const razorpayPayment =
        await razorpay.payments.fetch(razorpay_payment_id);

      if (!razorpayPayment) {
        throw new Error("Unable to verify Razorpay payment.");
      }

      // ------------------------------------------------------
      // Verify payment belongs to this Razorpay order
      // ------------------------------------------------------

      if (razorpayPayment.order_id !== razorpay_order_id) {
        throw new Error("Razorpay payment does not belong to this order.");
      }

      // ------------------------------------------------------
      // Verify amount
      // ------------------------------------------------------

      const expectedAmount = Math.round(Number(order.totalAmount) * 100);

      if (Number(razorpayPayment.amount) !== expectedAmount) {
        throw new Error("Payment amount does not match order amount.");
      }

      // ------------------------------------------------------
      // Verify currency
      // ------------------------------------------------------

      if (razorpayPayment.currency !== "INR") {
        throw new Error("Invalid payment currency.");
      }

      // ------------------------------------------------------
      // Verify payment status
      // ------------------------------------------------------

      if (razorpayPayment.status !== "captured") {
        throw new Error(
          `Payment was not captured. Current status: ${razorpayPayment.status}`,
        );
      }

      // ======================================================
      // VERIFY PRODUCTS AND STOCK
      // ======================================================

      for (const item of order.items) {
        const product = await Product.findOne({
          _id: item.product,

          isDeleted: false,

          approvalStatus: "approved",

          status: {
            $in: ["active", "out-of-stock"],
          },
        }).session(session);

        if (!product) {
          throw new Error(`${item.productName} is no longer available.`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`${item.productName} does not have enough stock.`);
        }
      }

      // ======================================================
      // REDUCE STOCK + INCREASE SOLD COUNT
      // ======================================================

      for (const item of order.items) {
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: item.product,

            isDeleted: false,

            approvalStatus: "approved",

            stock: {
              $gte: item.quantity,
            },
          },

          {
            $inc: {
              stock: -item.quantity,

              soldCount: item.quantity,
            },
          },

          {
            new: true,

            session,
          },
        );

        if (!updatedProduct) {
          throw new Error(`Unable to reserve stock for ${item.productName}.`);
        }
      }

      // ======================================================
      // UPDATE PRODUCT STATUS
      // ======================================================

      for (const item of order.items) {
        await Product.updateOne(
          {
            _id: item.product,

            stock: {
              $lte: 0,
            },
          },

          {
            $set: {
              status: "out-of-stock",
            },
          },

          {
            session,
          },
        );
      }

      // ======================================================
      // REMOVE PURCHASED ITEMS FROM CART
      // ======================================================

      const cart = await Cart.findOne({
        user: req.user._id,
      }).session(session);

      if (cart) {
        const purchasedProductIds = order.items.map((item) =>
          item.product.toString(),
        );

        cart.items = cart.items.filter(
          (item) => !purchasedProductIds.includes(item.product.toString()),
        );

        await cart.save({
          session,
        });
      }

      // ======================================================
      // COUPON USAGE
      // ======================================================

      if (order.coupon) {
        await Coupon.findByIdAndUpdate(
          order.coupon,

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

      // ======================================================
      // UPDATE PAYMENT
      // ======================================================

      payment.paymentStatus = "paid";

      payment.gatewayPaymentId = razorpay_payment_id;

      payment.gatewaySignature = razorpay_signature;

      payment.paidAt = new Date();

      await payment.save({
        session,
      });

      // ======================================================
      // UPDATE ORDER
      // ======================================================

      order.paymentStatus = "paid";

      order.orderStatus = "confirmed";

      order.razorpayPaymentId = razorpay_payment_id;

      order.paidAt = new Date();

      await order.save({
        session,
      });

      // ======================================================
      // DELETE ONLY THIS CHECKOUT
      // ======================================================

      await Checkout.deleteOne(
        {
          _id: order.checkout || undefined,

          user: req.user._id,

          status: "pending",
        },
        {
          session,
        },
      );

      // ------------------------------------------------------
      // Fallback:
      // If Order does not contain checkout reference,
      // remove user's pending checkout.
      // ------------------------------------------------------

      await Checkout.deleteMany(
        {
          user: req.user._id,

          status: "pending",

          ...(order.checkout
            ? {
                _id: {
                  $ne: order.checkout,
                },
              }
            : {}),
        },
        {
          session,
        },
      );

      // ======================================================
      // AUDIT LOG
      // ======================================================

      try {
        await AuditLog.create(
          [
            {
              actor: {
                user: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
              },

              module: "Payments",

              action: "Payment",

              severity: "info",

              success: true,

              target: {
                model: "Order",
                id: order._id,
                name: order.orderNumber,
              },

              description: `Payment successful for order ${order.orderNumber}.`,

              metadata: {
                paymentId: payment._id,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                amount: order.totalAmount,
                currency: "INR",
              },

              request: {
                ipAddress:
                  req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
                  req.socket.remoteAddress ||
                  "",

                method: req.method,
                path: req.originalUrl,
                userAgent: req.get("user-agent") || "",
              },
            },
          ],
          {
            session,
          },
        );
      } catch (auditError) {
        logger.error(
          `Payment audit log failed: ${auditError.stack || auditError.message}`,
        );
      }

      // ======================================================
      // COMMIT
      // ======================================================

      await session.commitTransaction();

      session.endSession();

      logger.info(
        `Payment successful. Order ID: ${order._id}, Payment ID: ${payment._id}, Razorpay Payment ID: ${razorpay_payment_id}`,
      );

      return res.status(httpStatusCode.OK).json({
        success: true,

        message: "Payment successful.",

        redirectUrl: `/payment/success/${order._id}`,
      });
    } catch (error) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        logger.error(`Transaction abort failed: ${abortError.message}`);
      }

      session.endSession();

      logger.error(
        `Payment verification failed: ${error.stack || error.message}`,
      );

      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,

        message: error.message || "Payment verification failed.",
      });
    }
  }

  // ==========================================================
  // PAYMENT SUCCESS PAGE
  // ==========================================================

  async showPaymentSuccess(req, res) {
    try {
      const { orderId } = req.params;

      // ------------------------------------------------------
      // Validate ID
      // ------------------------------------------------------

      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.redirect("/orders");
      }

      // ------------------------------------------------------
      // Find paid order
      // ------------------------------------------------------

      const order = await Order.findOne({
        _id: orderId,

        user: req.user._id,

        paymentStatus: "paid",
      }).lean();

      if (!order) {
        req.flash("error", "Order not found.");

        return res.redirect("/orders");
      }

      // ------------------------------------------------------
      // Render success page
      // ------------------------------------------------------

      return res.status(httpStatusCode.OK).render("payment/success", {
        title: "Payment Successful",

        order,
      });
    } catch (error) {
      logger.error(
        `Payment success page failed: ${error.stack || error.message}`,
      );

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .render("errors/500", {
          title: "Server Error",
        });
    }
  }
}

module.exports = new PaymentController();
