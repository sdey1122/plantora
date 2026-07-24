const mongoose = require("mongoose");

const Order = require("../models/Order");
const Payment = require("../models/Payment");
const AuditLog = require("../models/AuditLog");
const createAuditLog = require("../utils/createAuditLog");

const logger = require("../config/logger");

const httpStatusCode = require("../utils/httpStatusCode");

const {
  orderQueryValidation,
  orderIdValidation,
  cancelOrderValidation,
  returnOrderValidation,
  updateOrderStatusValidation,
} = require("../validations/orderValidation");

class OrderController {
  // Show customer order details
  async showOrderDetailsPage(req, res) {
    try {
      // Validate order ID
      const { error, value } = orderIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/orders");
      }

      const order = await Order.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(value.orderId),
            user: new mongoose.Types.ObjectId(req.user._id),
          },
        },

        {
          $lookup: {
            from: "payments",
            localField: "payment",
            foreignField: "_id",
            as: "payment",
          },
        },

        {
          $unwind: {
            path: "$payment",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            orderNumber: 1,

            shippingAddress: 1,

            items: 1,

            subtotal: 1,

            discount: 1,

            shippingCharge: 1,

            tax: 1,

            totalAmount: 1,

            couponCode: 1,

            paymentMethod: 1,

            paymentStatus: 1,

            orderStatus: 1,

            notes: 1,

            cancellationReason: 1,

            cancelledAt: 1,

            deliveredAt: 1,

            returnedAt: 1,

            refundedAt: 1,

            createdAt: 1,

            updatedAt: 1,

            payment: {
              _id: "$payment._id",

              amount: "$payment.amount",

              currency: "$payment.currency",

              paymentStatus: "$payment.paymentStatus",

              paymentGateway: "$payment.paymentGateway",

              gatewayOrderId: "$payment.gatewayOrderId",

              gatewayPaymentId: "$payment.gatewayPaymentId",

              paidAt: "$payment.paidAt",

              failedAt: "$payment.failedAt",

              refundedAt: "$payment.refundedAt",

              refund: "$payment.refund",
            },
          },
        },
      ]);

      if (!order.length) {
        req.flash("error", "Order not found.");

        return res.redirect("/orders");
      }

      logger.info(
        `Customer viewed order ${order[0].orderNumber}. User: ${req.user.email}`,
      );

      return res.status(httpStatusCode.OK).render("orders/details", {
        title: "Order Details",

        order: order[0],
      });
    } catch (error) {
      logger.error(`Show order details failed: ${error.message}`);

      req.flash("error", "Failed to load order details.");

      return res.redirect("/orders");
    }
  }
  // Cancel order
  async cancelOrder(req, res) {
    try {
      // Validate order ID
      const orderIdValidationResult = orderIdValidation.validate(req.params);

      if (orderIdValidationResult.error) {
        req.flash("error", orderIdValidationResult.error.details[0].message);

        return res.redirect("/orders");
      }

      // Validate request
      const { error, value } = cancelOrderValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect(`/orders/${req.params.orderId}`);
      }

      const order = await Order.findOne({
        _id: req.params.orderId,
        user: req.user._id,
      });

      if (!order) {
        req.flash("error", "Order not found.");

        return res.redirect("/orders");
      }

      if (!["pending", "confirmed"].includes(order.orderStatus)) {
        req.flash("error", "This order can no longer be cancelled.");

        return res.redirect(`/orders/${order._id}`);
      }

      order.orderStatus = "cancelled";

      order.cancellationReason = value.cancellationReason;

      order.cancelledAt = new Date();

      await order.save();

      await createAuditLog({
        req,

        actor: req.user,

        module: "Orders",

        action: "ORDER",

        target: {
          model: "Order",

          id: order._id,

          name: order.orderNumber,
        },

        description: `Order ${order.orderNumber} cancelled.`,
      });

      logger.info(`Order cancelled. Order: ${order.orderNumber}`);

      req.flash("success", "Order cancelled successfully.");

      return res.redirect(`/orders/${order._id}`);
    } catch (error) {
      logger.error(`Cancel order failed: ${error.message}`);

      req.flash("error", "Failed to cancel order.");

      return res.redirect("/orders");
    }
  }
  // Return order
  async returnOrder(req, res) {
    try {
      // Validate order ID
      const orderIdValidationResult = orderIdValidation.validate(req.params);

      if (orderIdValidationResult.error) {
        req.flash("error", orderIdValidationResult.error.details[0].message);

        return res.redirect("/orders");
      }

      // Validate request
      const { error } = returnOrderValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect(`/orders/${req.params.orderId}`);
      }

      const order = await Order.findOne({
        _id: req.params.orderId,
        user: req.user._id,
      });

      if (!order) {
        req.flash("error", "Order not found.");

        return res.redirect("/orders");
      }

      if (order.orderStatus !== "delivered") {
        req.flash("error", "Only delivered orders can be returned.");

        return res.redirect(`/orders/${order._id}`);
      }

      order.orderStatus = "returned";

      order.returnedAt = new Date();

      await order.save();

      await createAuditLog({
        req,

        actor: req.user,

        module: "Orders",

        action: "ORDER",

        target: {
          model: "Order",

          id: order._id,

          name: order.orderNumber,
        },

        description: `Return requested for order ${order.orderNumber}.`,
      });

      logger.info(`Return requested. Order: ${order.orderNumber}`);

      req.flash("success", "Return request submitted successfully.");

      return res.redirect(`/orders/${order._id}`);
    } catch (error) {
      logger.error(`Return order failed: ${error.message}`);

      req.flash("error", "Failed to submit return request.");

      return res.redirect("/orders");
    }
  }
  // Show admin orders page
  async showAdminOrdersPage(req, res) {
    try {
      // Validate query
      const { error, value } = orderQueryValidation.validate(req.query);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin/dashboard");
      }

      const {
        page,
        limit,
        search,
        status,
        sortBy,
        sortOrder,
        startDate,
        endDate,
      } = value;

      const matchStage = {};

      // Search by order number
      if (search) {
        matchStage.orderNumber = {
          $regex: search,
          $options: "i",
        };
      }

      // Filter by status
      if (status) {
        matchStage.orderStatus = status;
      }

      // Filter by date
      if (startDate || endDate) {
        matchStage.createdAt = {};

        if (startDate) {
          matchStage.createdAt.$gte = new Date(startDate);
        }

        if (endDate) {
          const lastDate = new Date(endDate);

          lastDate.setHours(23, 59, 59, 999);

          matchStage.createdAt.$lte = lastDate;
        }
      }

      const result = await Order.aggregate([
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
          $project: {
            orderNumber: 1,

            totalAmount: 1,

            orderStatus: 1,

            paymentStatus: 1,

            paymentMethod: 1,

            createdAt: 1,

            deliveredAt: 1,

            itemCount: {
              $size: "$items",
            },

            customer: {
              _id: "$customer._id",

              name: "$customer.name",

              email: "$customer.email",
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
            orders: [
              {
                $skip: (page - 1) * limit,
              },

              {
                $limit: limit,
              },
            ],

            totalOrders: [
              {
                $count: "count",
              },
            ],
          },
        },
      ]);

      const orders = result[0].orders;

      const totalOrders =
        result[0].totalOrders.length > 0 ? result[0].totalOrders[0].count : 0;

      const totalPages = Math.ceil(totalOrders / limit);

      logger.info(`Admin viewed order list. Admin: ${req.user.email}`);

      return res.status(httpStatusCode.OK).render("admin/orders/index", {
        title: "Manage Orders",

        orders,

        filters: value,

        pagination: {
          currentPage: page,

          totalPages,

          totalOrders,

          limit,
        },
      });
    } catch (error) {
      logger.error(`Show admin orders failed: ${error.message}`);

      req.flash("error", "Failed to load orders.");

      return res.redirect("/admin/dashboard");
    }
  }
  // Show admin order details
  async showAdminOrderDetailsPage(req, res) {
    try {
      // Validate order ID
      const { error, value } = orderIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/orders/admin");
      }

      const order = await Order.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(value.orderId),
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
            from: "payments",
            localField: "payment",
            foreignField: "_id",
            as: "payment",
          },
        },

        {
          $unwind: {
            path: "$payment",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            orderNumber: 1,

            shippingAddress: 1,

            items: 1,

            subtotal: 1,

            discount: 1,

            shippingCharge: 1,

            tax: 1,

            totalAmount: 1,

            couponCode: 1,

            paymentMethod: 1,

            paymentStatus: 1,

            orderStatus: 1,

            notes: 1,

            cancellationReason: 1,

            cancelledAt: 1,

            deliveredAt: 1,

            returnedAt: 1,

            refundedAt: 1,

            createdAt: 1,

            updatedAt: 1,

            customer: {
              _id: "$customer._id",

              name: "$customer.name",

              email: "$customer.email",

              phone: "$customer.phone",
            },

            payment: {
              _id: "$payment._id",

              amount: "$payment.amount",

              currency: "$payment.currency",

              paymentMethod: "$payment.paymentMethod",

              paymentGateway: "$payment.paymentGateway",

              gatewayOrderId: "$payment.gatewayOrderId",

              gatewayPaymentId: "$payment.gatewayPaymentId",

              paymentStatus: "$payment.paymentStatus",

              failureReason: "$payment.failureReason",

              refund: "$payment.refund",

              paidAt: "$payment.paidAt",

              failedAt: "$payment.failedAt",

              refundedAt: "$payment.refundedAt",
            },
          },
        },
      ]);

      if (!order.length) {
        req.flash("error", "Order not found.");

        return res.redirect("/orders/admin");
      }

      logger.info(
        `Admin viewed order ${order[0].orderNumber}. Admin: ${req.user.email}`,
      );

      return res.status(httpStatusCode.OK).render("admin/orders/details", {
        title: "Order Details",

        order: order[0],
      });
    } catch (error) {
      logger.error(`Show admin order details failed: ${error.message}`);

      req.flash("error", "Failed to load order details.");

      return res.redirect("/orders/admin");
    }
  }
  // Show admin order details
  async showAdminOrderDetailsPage(req, res) {
    try {
      // Validate order ID
      const { error, value } = orderIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/orders/admin");
      }

      const order = await Order.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(value.orderId),
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
            from: "payments",
            localField: "payment",
            foreignField: "_id",
            as: "payment",
          },
        },

        {
          $unwind: {
            path: "$payment",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            orderNumber: 1,

            shippingAddress: 1,

            items: 1,

            subtotal: 1,

            discount: 1,

            shippingCharge: 1,

            tax: 1,

            totalAmount: 1,

            couponCode: 1,

            paymentMethod: 1,

            paymentStatus: 1,

            orderStatus: 1,

            notes: 1,

            cancellationReason: 1,

            cancelledAt: 1,

            deliveredAt: 1,

            returnedAt: 1,

            refundedAt: 1,

            createdAt: 1,

            updatedAt: 1,

            customer: {
              _id: "$customer._id",

              name: "$customer.name",

              email: "$customer.email",

              phone: "$customer.phone",
            },

            payment: {
              _id: "$payment._id",

              amount: "$payment.amount",

              currency: "$payment.currency",

              paymentMethod: "$payment.paymentMethod",

              paymentGateway: "$payment.paymentGateway",

              gatewayOrderId: "$payment.gatewayOrderId",

              gatewayPaymentId: "$payment.gatewayPaymentId",

              paymentStatus: "$payment.paymentStatus",

              failureReason: "$payment.failureReason",

              refund: "$payment.refund",

              paidAt: "$payment.paidAt",

              failedAt: "$payment.failedAt",

              refundedAt: "$payment.refundedAt",
            },
          },
        },
      ]);

      if (!order.length) {
        req.flash("error", "Order not found.");

        return res.redirect("/orders/admin");
      }

      logger.info(
        `Admin viewed order ${order[0].orderNumber}. Admin: ${req.user.email}`,
      );

      return res.status(httpStatusCode.OK).render("admin/orders/details", {
        title: "Order Details",

        order: order[0],
      });
    } catch (error) {
      logger.error(`Show admin order details failed: ${error.message}`);

      req.flash("error", "Failed to load order details.");

      return res.redirect("/orders/admin");
    }
  }
  // Update order status
  async updateOrderStatus(req, res) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Validate order ID
      const orderIdValidationResult = orderIdValidation.validate(req.params);

      if (orderIdValidationResult.error) {
        await session.abortTransaction();

        session.endSession();

        req.flash("error", orderIdValidationResult.error.details[0].message);

        return res.redirect("/orders/admin");
      }

      // Validate request
      const { error, value } = updateOrderStatusValidation.validate(req.body);

      if (error) {
        await session.abortTransaction();

        session.endSession();

        req.flash("error", error.details[0].message);

        return res.redirect(`/orders/admin/${req.params.orderId}`);
      }

      const order = await Order.findById(req.params.orderId).session(session);

      if (!order) {
        await session.abortTransaction();

        session.endSession();

        req.flash("error", "Order not found.");

        return res.redirect("/orders/admin");
      }

      const currentStatus = order.orderStatus;
      const newStatus = value.orderStatus;

      if (currentStatus === newStatus) {
        await session.abortTransaction();

        session.endSession();

        req.flash("error", "Order already has this status.");

        return res.redirect(`/orders/admin/${order._id}`);
      }

      const allowedTransitions = {
        pending: ["confirmed", "cancelled"],

        confirmed: ["processing", "cancelled"],

        processing: ["shipped"],

        shipped: ["out-for-delivery"],

        "out-for-delivery": ["delivered"],

        delivered: ["returned"],

        returned: [],

        cancelled: [],
      };

      if (
        !allowedTransitions[currentStatus] ||
        !allowedTransitions[currentStatus].includes(newStatus)
      ) {
        await session.abortTransaction();

        session.endSession();

        req.flash(
          "error",
          `Cannot change order status from "${currentStatus}" to "${newStatus}".`,
        );

        return res.redirect(`/orders/admin/${order._id}`);
      }

      order.orderStatus = newStatus;

      switch (newStatus) {
        case "cancelled":
          order.cancelledAt = new Date();
          break;

        case "delivered":
          order.deliveredAt = new Date();
          break;

        case "returned":
          order.returnedAt = new Date();
          break;

        default:
          break;
      }

      await order.save({ session });

      await createAuditLog({
        req,

        actor: req.user,

        module: "Orders",

        action: "UPDATE",

        target: {
          model: "Order",

          id: order._id,

          name: order.orderNumber,
        },

        description: `Order status changed from ${currentStatus} to ${newStatus}.`,
      });

      await session.commitTransaction();

      session.endSession();

      logger.info(
        `Order ${order.orderNumber} status updated from ${currentStatus} to ${newStatus} by ${req.user.email}.`,
      );

      req.flash("success", "Order status updated successfully.");

      return res.redirect(`/orders/admin/${order._id}`);
    } catch (error) {
      await session.abortTransaction();

      session.endSession();

      logger.error(`Update order status failed: ${error.message}`);

      req.flash("error", "Failed to update order status.");

      return res.redirect("/orders/admin");
    }
  }
}

module.exports = new OrderController();
