const mongoose = require("mongoose");

const Order = require("../models/Order");
const AuditLog = require("../models/AuditLog");

const logger = require("../config/logger");
const httpStatusCode = require("../utils/httpStatusCode");

class OrderController {
  // ==========================================================
  // MY ORDERS
  // ==========================================================

  async showMyOrders(req, res) {
    try {
      const userId = new mongoose.Types.ObjectId(req.user._id);

      let match = {};

      // ==========================================================
      // CUSTOMER
      // ==========================================================

      if (req.user.role === "customer") {
        match = {
          user: userId,
          paymentStatus: "paid",
        };
      }

      // ==========================================================
      // SELLER
      //
      // Seller can ALSO purchase products.
      //
      // Therefore seller sees:
      // 1. Orders purchased by them
      // 2. Orders containing products sold by them
      // ==========================================================
      else if (req.user.role === "seller") {
        match = {
          paymentStatus: "paid",

          $or: [
            {
              user: userId,
            },
            {
              "items.seller": userId,
            },
          ],
        };
      }

      // ==========================================================
      // ADMIN
      // ==========================================================
      else if (req.user.role === "admin") {
        match = {
          paymentStatus: "paid",
        };
      }

      // ==========================================================
      // UNKNOWN ROLE
      // ==========================================================
      else {
        req.flash("error", "Unauthorized access.");

        return res.redirect("/");
      }

      // ==========================================================
      // BUILD PIPELINE
      // ==========================================================

      const pipeline = [
        {
          $match: match,
        },
      ];

      // ==========================================================
      // SELLER
      //
      // Important:
      //
      // If seller is viewing an order that they PURCHASED,
      // show ALL items in that order.
      //
      // If seller is viewing an order where they are the SELLER,
      // show only their own products.
      // ==========================================================

      if (req.user.role === "seller") {
        pipeline.push({
          $set: {
            items: {
              $cond: [
                {
                  $eq: ["$user", userId],
                },

                // Seller is the CUSTOMER
                "$items",

                // Seller is the SELLER
                {
                  $filter: {
                    input: "$items",
                    as: "item",
                    cond: {
                      $eq: ["$$item.seller", userId],
                    },
                  },
                },
              ],
            },
          },
        });

        // ========================================================
        // SELLER TOTAL
        //
        // For purchased orders, use normal total.
        // For sales, calculate only seller's products.
        // ========================================================

        pipeline.push({
          $set: {
            sellerTotal: {
              $cond: [
                {
                  $eq: ["$user", userId],
                },

                "$totalAmount",

                {
                  $sum: {
                    $map: {
                      input: "$items",
                      as: "item",
                      in: {
                        $multiply: ["$$item.finalPrice", "$$item.quantity"],
                      },
                    },
                  },
                },
              ],
            },
          },
        });
      }

      // ==========================================================
      // SORT
      // ==========================================================

      pipeline.push({
        $sort: {
          createdAt: -1,
        },
      });

      // ==========================================================
      // PROJECT
      // ==========================================================

      pipeline.push({
        $project: {
          _id: 1,

          orderNumber: 1,

          user: 1,

          items: 1,

          sellerTotal: 1,

          paymentMethod: 1,

          paymentStatus: 1,

          orderStatus: 1,

          shippingAddress: 1,

          subtotal: 1,

          discount: 1,

          shippingCharge: 1,

          tax: 1,

          platformFee: 1,

          totalAmount: 1,

          createdAt: 1,

          paidAt: 1,
        },
      });

      // ==========================================================
      // EXECUTE
      // ==========================================================

      const orders = await Order.aggregate(pipeline);

      // ==========================================================
      // LOG
      // ==========================================================

      logger.info(
        `Orders page loaded successfully. User ID: ${req.user._id}, Role: ${req.user.role}`,
      );

      // ==========================================================
      // RENDER
      // ==========================================================

      return res.status(httpStatusCode.OK).render("order/index", {
        title:
          req.user.role === "admin"
            ? "All Orders"
            : req.user.role === "seller"
              ? "My Orders & Sales"
              : "My Orders",

        orders,

        userRole: req.user.role,
      });
    } catch (error) {
      logger.error(`Show orders page failed: ${error.stack || error.message}`);

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .render("errors/500", {
          title: "Server Error",
        });
    }
  }
  // ==========================================================
  // ORDER DETAILS
  // ==========================================================

  // ==========================================================
  // ORDER DETAILS
  // ==========================================================

  async showOrderDetails(req, res) {
    try {
      const { orderId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        req.flash("error", "Invalid order.");
        return res.redirect("/orders");
      }

      const userId = new mongoose.Types.ObjectId(req.user._id);
      const orderObjectId = new mongoose.Types.ObjectId(orderId);

      // ==========================================================
      // MATCH ORDER
      // ==========================================================

      const matchStage = {
        _id: orderObjectId,
        paymentStatus: "paid",
      };

      // ==========================================================
      // CUSTOMER
      // ==========================================================

      if (req.user.role === "customer") {
        matchStage.user = userId;
      }

      // ==========================================================
      // SELLER
      //
      // Seller can also be a customer.
      //
      // Therefore:
      //
      // 1. Seller purchased this order
      //    → allow the complete order.
      //
      // 2. Seller did not purchase it but sold products
      //    → allow the order because it contains their products.
      // ==========================================================

      if (req.user.role === "seller") {
        matchStage.$or = [
          {
            user: userId,
          },
          {
            "items.seller": userId,
          },
        ];
      }

      // ==========================================================
      // ADMIN
      //
      // No additional restriction.
      // Admin can see any paid order.
      // ==========================================================

      const orders = await Order.aggregate([
        {
          $match: matchStage,
        },

        // ========================================================
        // REMEMBER WHETHER SELLER IS THE CUSTOMER
        // ========================================================

        ...(req.user.role === "seller"
          ? [
              {
                $set: {
                  sellerIsCustomer: {
                    $eq: ["$user", userId],
                  },
                },
              },
            ]
          : []),

        // ========================================================
        // UNWIND ITEMS
        // ========================================================

        {
          $unwind: {
            path: "$items",
            preserveNullAndEmptyArrays: true,
          },
        },

        // ========================================================
        // SELLER:
        //
        // If seller purchased the order:
        //     keep ALL items.
        //
        // If seller is viewing their sale:
        //     keep ONLY their items.
        //
        // Customer/Admin:
        //     keep ALL items.
        // ========================================================

        ...(req.user.role === "seller"
          ? [
              {
                $match: {
                  $or: [
                    {
                      sellerIsCustomer: true,
                    },
                    {
                      "items.seller": userId,
                    },
                  ],
                },
              },
            ]
          : []),

        // ========================================================
        // PRODUCT LOOKUP
        // ========================================================

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
            preserveNullAndEmptyArrays: true,
          },
        },

        // ========================================================
        // GROUP ORDER BACK
        // ========================================================

        {
          $group: {
            _id: "$_id",

            orderNumber: {
              $first: "$orderNumber",
            },

            user: {
              $first: "$user",
            },

            shippingAddress: {
              $first: "$shippingAddress",
            },

            items: {
              $push: {
                product: "$items.product",

                seller: "$items.seller",

                productName: "$items.productName",

                sku: "$items.sku",

                image: "$items.image",

                quantity: "$items.quantity",

                originalPrice: "$items.originalPrice",

                discountPrice: "$items.discountPrice",

                finalPrice: "$items.finalPrice",

                currentProductStock: "$product.stock",
              },
            },

            subtotal: {
              $first: "$subtotal",
            },

            discount: {
              $first: "$discount",
            },

            shippingCharge: {
              $first: "$shippingCharge",
            },

            tax: {
              $first: "$tax",
            },

            platformFee: {
              $first: "$platformFee",
            },

            totalAmount: {
              $first: "$totalAmount",
            },

            couponCode: {
              $first: "$couponCode",
            },

            paymentMethod: {
              $first: "$paymentMethod",
            },

            paymentStatus: {
              $first: "$paymentStatus",
            },

            orderStatus: {
              $first: "$orderStatus",
            },

            notes: {
              $first: "$notes",
            },

            createdAt: {
              $first: "$createdAt",
            },

            paidAt: {
              $first: "$paidAt",
            },

            razorpayOrderId: {
              $first: "$razorpayOrderId",
            },

            razorpayPaymentId: {
              $first: "$razorpayPaymentId",
            },
          },
        },

        // ========================================================
        // SELLER TOTAL
        //
        // Only relevant for seller view.
        // ========================================================

        ...(req.user.role === "seller"
          ? [
              {
                $set: {
                  sellerTotal: {
                    $sum: {
                      $map: {
                        input: "$items",
                        as: "item",
                        in: {
                          $multiply: ["$$item.finalPrice", "$$item.quantity"],
                        },
                      },
                    },
                  },
                },
              },
            ]
          : []),
      ]);

      // ==========================================================
      // ORDER NOT FOUND / NOT AUTHORIZED
      // ==========================================================

      if (!orders.length) {
        req.flash(
          "error",
          "Order not found or you are not authorized to view it.",
        );

        return res.redirect("/orders");
      }

      const order = orders[0];

      // ==========================================================
      // LOG
      // ==========================================================

      logger.info(
        `Order details loaded. Order ID: ${order._id}, User ID: ${req.user._id}, Role: ${req.user.role}`,
      );

      // ==========================================================
      // RENDER
      // ==========================================================

      return res.status(httpStatusCode.OK).render("order/details", {
        title: `Order ${order.orderNumber}`,

        order,

        userRole: req.user.role,
      });
    } catch (error) {
      logger.error(
        `Show order details failed: ${error.stack || error.message}`,
      );

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .render("errors/500", {
          title: "Server Error",
        });
    }
  }
}

module.exports = new OrderController();
