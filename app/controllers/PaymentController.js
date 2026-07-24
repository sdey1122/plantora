const crypto = require("crypto");

const Order = require("../models/Order");
const Payment = require("../models/Payment");

const logger = require("../config/logger");

const razorpay = require("../config/razorpay");

const httpStatusCode = require("../utils/httpStatusCode");
const createAuditLog = require("../utils/createAuditLog");

const {
  paymentIdValidation,
  createPaymentValidation,
  verifyPaymentValidation,
  refundPaymentValidation,
  paymentQueryValidation,
} = require("../validations/paymentValidation");

class PaymentController {
  // Show customer payments page
  async showPaymentsPage(req, res) {
    try {
      // Validate query
      const { error, value } = paymentQueryValidation.validate(req.query);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/");
      }

      const {
        page,
        limit,
        search,
        paymentMethod,
        paymentStatus,
        sortBy,
        sortOrder,
      } = value;

      const matchStage = {
        user: new mongoose.Types.ObjectId(req.user._id),
      };

      // Search payment ID
      if (search) {
        matchStage.gatewayPaymentId = {
          $regex: search,
          $options: "i",
        };
      }

      // Filter by payment method
      if (paymentMethod) {
        matchStage.paymentMethod = paymentMethod;
      }

      // Filter by payment status
      if (paymentStatus) {
        matchStage.paymentStatus = paymentStatus;
      }

      const result = await Payment.aggregate([
        {
          $match: matchStage,
        },

        {
          $lookup: {
            from: "orders",
            localField: "order",
            foreignField: "_id",
            as: "order",
          },
        },

        {
          $unwind: "$order",
        },

        {
          $project: {
            amount: 1,

            currency: 1,

            paymentMethod: 1,

            paymentStatus: 1,

            gatewayPaymentId: 1,

            paidAt: 1,

            createdAt: 1,

            order: {
              _id: "$order._id",

              orderNumber: "$order.orderNumber",

              totalAmount: "$order.totalAmount",
            },
          },
        },

        {
          $sort: {
            [sortBy]: sortOrder === "asc" ? 1 : -1,
          },
        },

        {
          $facet: {
            payments: [
              {
                $skip: (page - 1) * limit,
              },

              {
                $limit: limit,
              },
            ],

            totalPayments: [
              {
                $count: "count",
              },
            ],
          },
        },
      ]);

      const payments = result[0].payments;

      const totalPayments =
        result[0].totalPayments.length > 0
          ? result[0].totalPayments[0].count
          : 0;

      const totalPages = Math.ceil(totalPayments / limit);

      logger.info(`Customer viewed payment history. User: ${req.user.email}`);

      return res.status(httpStatusCode.OK).render("payments/index", {
        title: "Payment History",

        payments,

        filters: value,

        pagination: {
          currentPage: page,

          totalPages,

          totalPayments,

          limit,
        },
      });
    } catch (error) {
      logger.error(`Show payments failed: ${error.message}`);

      req.flash("error", "Failed to load payment history.");

      return res.redirect("/");
    }
  }
  // Show customer payment details
  async showPaymentDetailsPage(req, res) {
    try {
      // Validate payment ID
      const { error, value } = paymentIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/payments");
      }

      const payment = await Payment.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(value.paymentId),
            user: new mongoose.Types.ObjectId(req.user._id),
          },
        },

        {
          $lookup: {
            from: "orders",
            localField: "order",
            foreignField: "_id",
            as: "order",
          },
        },

        {
          $unwind: "$order",
        },

        {
          $project: {
            amount: 1,

            currency: 1,

            paymentMethod: 1,

            paymentGateway: 1,

            gatewayOrderId: 1,

            gatewayPaymentId: 1,

            paymentStatus: 1,

            failureReason: 1,

            refund: 1,

            paidAt: 1,

            failedAt: 1,

            cancelledAt: 1,

            refundedAt: 1,

            createdAt: 1,

            order: {
              _id: "$order._id",

              orderNumber: "$order.orderNumber",

              totalAmount: "$order.totalAmount",

              orderStatus: "$order.orderStatus",
            },
          },
        },
      ]);

      if (!payment.length) {
        req.flash("error", "Payment not found.");

        return res.redirect("/payments");
      }

      logger.info(`Customer viewed payment details. User: ${req.user.email}`);

      return res.status(httpStatusCode.OK).render("payments/details", {
        title: "Payment Details",

        payment: payment[0],
      });
    } catch (error) {
      logger.error(`Show payment details failed: ${error.message}`);

      req.flash("error", "Failed to load payment details.");

      return res.redirect("/payments");
    }
  }
  // Create Razorpay payment
  async createPayment(req, res) {
    try {
      // Validate request
      const { error, value } = createPaymentValidation.validate(req.body);

      if (error) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const order = await Order.findOne({
        _id: value.orderId,
        user: req.user._id,
      });

      if (!order) {
        return res.status(httpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Order not found.",
        });
      }

      if (order.paymentStatus === "paid") {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Payment has already been completed.",
        });
      }

      let payment = await Payment.findOne({
        order: order._id,
      });

      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(order.totalAmount * 100),

        currency: "INR",

        receipt: order.orderNumber,

        notes: {
          orderId: order._id.toString(),

          customerId: req.user._id.toString(),
        },
      });

      if (!payment) {
        payment = await Payment.create({
          order: order._id,

          user: req.user._id,

          amount: order.totalAmount,

          paymentMethod: value.paymentMethod,

          paymentGateway: "razorpay",

          gatewayOrderId: razorpayOrder.id,

          paymentStatus: "pending",
        });

        order.payment = payment._id;

        await order.save();
      } else {
        payment.gatewayOrderId = razorpayOrder.id;

        payment.paymentMethod = value.paymentMethod;

        payment.paymentStatus = "pending";

        await payment.save();
      }

      logger.info(`Payment order created. Order: ${order.orderNumber}`);

      return res.status(httpStatusCode.CREATED).json({
        success: true,

        message: "Payment order created successfully.",

        payment: {
          paymentId: payment._id,

          razorpayOrderId: razorpayOrder.id,

          amount: razorpayOrder.amount,

          currency: razorpayOrder.currency,

          key: process.env.RAZORPAY_KEY_ID,
        },
      });
    } catch (error) {
      logger.error(`Create payment failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to create payment.",
      });
    }
  }
  // Verify Razorpay payment
  async verifyPayment(req, res) {
    try {
      // Validate request
      const { error, value } = verifyPaymentValidation.validate(req.body);

      if (error) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const payment = await Payment.findOne({
        gatewayOrderId: value.razorpayOrderId,
      });

      if (!payment) {
        return res.status(httpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Payment not found.",
        });
      }

      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${value.razorpayOrderId}|${value.razorpayPaymentId}`)
        .digest("hex");

      if (generatedSignature !== value.razorpaySignature) {
        payment.paymentStatus = "failed";

        payment.failureReason = "Invalid payment signature.";

        payment.failedAt = new Date();

        payment.gatewayPayload = value;

        await payment.save();

        logger.warn(`Payment verification failed. Payment: ${payment._id}`);

        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,

          message: "Payment verification failed.",
        });
      }

      payment.gatewayPaymentId = value.razorpayPaymentId;

      payment.gatewaySignature = value.razorpaySignature;

      payment.paymentStatus = "paid";

      payment.paidAt = new Date();

      payment.gatewayPayload = value;

      await payment.save();

      await Order.findByIdAndUpdate(payment.order, {
        paymentStatus: "paid",
      });

      await createAuditLog({
        req,

        actor: req.user,

        module: "Payments",

        action: "VERIFY",

        target: {
          model: "Payment",

          id: payment._id,
        },

        description: `Payment verified successfully.`,
      });

      logger.info(`Payment verified. Payment: ${payment._id}`);

      return res.status(httpStatusCode.OK).json({
        success: true,

        message: "Payment verified successfully.",
      });
    } catch (error) {
      logger.error(`Verify payment failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to verify payment.",
      });
    }
  }
  // Show admin payments page
  async showAdminPaymentsPage(req, res) {
    try {
      // Validate query
      const { error, value } = paymentQueryValidation.validate(req.query);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin");
      }

      const {
        page,
        limit,
        search,
        paymentMethod,
        paymentStatus,
        sortBy,
        sortOrder,
      } = value;

      const matchStage = {};

      // Search payment ID
      if (search) {
        matchStage.gatewayPaymentId = {
          $regex: search,
          $options: "i",
        };
      }

      // Filter by payment method
      if (paymentMethod) {
        matchStage.paymentMethod = paymentMethod;
      }

      // Filter by payment status
      if (paymentStatus) {
        matchStage.paymentStatus = paymentStatus;
      }

      const result = await Payment.aggregate([
        {
          $match: matchStage,
        },

        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "customer",
          },
        },

        {
          $unwind: "$customer",
        },

        {
          $lookup: {
            from: "orders",
            localField: "order",
            foreignField: "_id",
            as: "order",
          },
        },

        {
          $unwind: "$order",
        },

        {
          $project: {
            amount: 1,

            currency: 1,

            paymentMethod: 1,

            paymentStatus: 1,

            gatewayPaymentId: 1,

            paidAt: 1,

            createdAt: 1,

            customer: {
              _id: "$customer._id",

              name: "$customer.name",

              email: "$customer.email",
            },

            order: {
              _id: "$order._id",

              orderNumber: "$order.orderNumber",

              orderStatus: "$order.orderStatus",
            },
          },
        },

        {
          $sort: {
            [sortBy]: sortOrder === "asc" ? 1 : -1,
          },
        },

        {
          $facet: {
            payments: [
              {
                $skip: (page - 1) * limit,
              },

              {
                $limit: limit,
              },
            ],

            totalPayments: [
              {
                $count: "count",
              },
            ],
          },
        },
      ]);

      const payments = result[0].payments;

      const totalPayments =
        result[0].totalPayments.length > 0
          ? result[0].totalPayments[0].count
          : 0;

      const totalPages = Math.ceil(totalPayments / limit);

      logger.info(`Admin viewed payment list. Admin: ${req.user.email}`);

      return res.status(httpStatusCode.OK).render("admin/payments/index", {
        title: "Manage Payments",

        payments,

        filters: value,

        pagination: {
          currentPage: page,

          totalPages,

          totalPayments,

          limit,
        },
      });
    } catch (error) {
      logger.error(`Show admin payments failed: ${error.message}`);

      req.flash("error", "Failed to load payments.");

      return res.redirect("/admin");
    }
  }
  // Show admin payment details
  async showAdminPaymentDetailsPage(req, res) {
    try {
      // Validate payment ID
      const { error, value } = paymentIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/payments/admin");
      }

      const payment = await Payment.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(value.paymentId),
          },
        },

        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "customer",
          },
        },

        {
          $unwind: "$customer",
        },

        {
          $lookup: {
            from: "orders",
            localField: "order",
            foreignField: "_id",
            as: "order",
          },
        },

        {
          $unwind: "$order",
        },

        {
          $project: {
            amount: 1,

            currency: 1,

            paymentMethod: 1,

            paymentGateway: 1,

            gatewayOrderId: 1,

            gatewayPaymentId: 1,

            gatewaySignature: 1,

            paymentStatus: 1,

            failureReason: 1,

            gatewayPayload: 1,

            refund: 1,

            paidAt: 1,

            failedAt: 1,

            cancelledAt: 1,

            refundedAt: 1,

            createdAt: 1,

            updatedAt: 1,

            customer: {
              _id: "$customer._id",

              name: "$customer.name",

              email: "$customer.email",

              phone: "$customer.phone",
            },

            order: {
              _id: "$order._id",

              orderNumber: "$order.orderNumber",

              totalAmount: "$order.totalAmount",

              orderStatus: "$order.orderStatus",
            },
          },
        },
      ]);

      if (!payment.length) {
        req.flash("error", "Payment not found.");

        return res.redirect("/payments/admin");
      }

      logger.info(
        `Admin viewed payment ${payment[0]._id}. Admin: ${req.user.email}`,
      );

      return res.status(httpStatusCode.OK).render("admin/payments/details", {
        title: "Payment Details",

        payment: payment[0],
      });
    } catch (error) {
      logger.error(`Show admin payment details failed: ${error.message}`);

      req.flash("error", "Failed to load payment details.");

      return res.redirect("/payments/admin");
    }
  }
  // Refund payment
  async refundPayment(req, res) {
    try {
      // Validate payment ID
      const paymentIdValidationResult = paymentIdValidation.validate(
        req.params,
      );

      if (paymentIdValidationResult.error) {
        req.flash("error", paymentIdValidationResult.error.details[0].message);

        return res.redirect("/payments/admin");
      }

      // Validate request
      const { error, value } = refundPaymentValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect(`/payments/admin/${req.params.paymentId}`);
      }

      const payment = await Payment.findById(req.params.paymentId);

      if (!payment) {
        req.flash("error", "Payment not found.");

        return res.redirect("/payments/admin");
      }

      if (payment.paymentStatus !== "paid") {
        req.flash("error", "Only paid payments can be refunded.");

        return res.redirect(`/payments/admin/${payment._id}`);
      }

      const refund = await razorpay.payments.refund(payment.gatewayPaymentId, {
        amount: Math.round(payment.amount * 100),

        notes: {
          reason: value.reason,
        },
      });

      payment.paymentStatus = "refunded";

      payment.refund = {
        refundId: refund.id,

        amount: refund.amount / 100,

        reason: value.reason,

        refundedAt: new Date(),
      };

      payment.refundedAt = new Date();

      await payment.save();

      await Order.findByIdAndUpdate(payment.order, {
        paymentStatus: "refunded",
      });

      await createAuditLog({
        req,

        actor: req.user,

        module: "Payments",

        action: "REFUND",

        target: {
          model: "Payment",

          id: payment._id,
        },

        description: `Refund processed successfully.`,
      });

      logger.info(`Refund completed. Payment: ${payment._id}`);

      req.flash("success", "Payment refunded successfully.");

      return res.redirect(`/payments/admin/${payment._id}`);
    } catch (error) {
      logger.error(`Refund payment failed: ${error.message}`);

      req.flash("error", "Failed to refund payment.");

      return res.redirect("/payments/admin");
    }
  }
  // Handle Razorpay webhook
  async handleWebhook(req, res) {
    try {
      const signature = req.headers["x-razorpay-signature"];

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (signature !== expectedSignature) {
        logger.warn("Invalid Razorpay webhook signature.");

        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
        });
      }

      const event = req.body.event;

      const payload = req.body.payload.payment.entity;

      const payment = await Payment.findOne({
        gatewayPaymentId: payload.id,
      });

      if (!payment) {
        logger.warn(`Webhook payment not found: ${payload.id}`);

        return res.status(httpStatusCode.OK).json({ success: true });
      }

      switch (event) {
        case "payment.captured":
          payment.paymentStatus = "paid";

          payment.paidAt = new Date();

          payment.gatewayPayload = req.body;

          await payment.save();

          await Order.findByIdAndUpdate(payment.order, {
            paymentStatus: "paid",
          });

          break;

        case "payment.failed":
          payment.paymentStatus = "failed";

          payment.failedAt = new Date();

          payment.failureReason =
            payload.error_description || "Payment failed.";

          payment.gatewayPayload = req.body;

          await payment.save();

          await Order.findByIdAndUpdate(payment.order, {
            paymentStatus: "failed",
          });

          break;

        default:
          logger.info(`Unhandled Razorpay event: ${event}`);
      }

      logger.info(`Webhook processed successfully: ${event}`);

      return res.status(httpStatusCode.OK).json({
        success: true,
      });
    } catch (error) {
      logger.error(`Webhook processing failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
      });
    }
  }
}

module.exports = new PaymentController();
