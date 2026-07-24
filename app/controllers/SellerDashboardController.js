const mongoose = require("mongoose");

const Product = require("../models/Product");
const Order = require("../models/Order");
const Review = require("../models/Review");

const logger = require("../config/logger");

const httpStatusCode = require("../utils/httpStatusCode");
class SellerDashboardController {
  // Show seller dashboard
  async showDashboard(req, res) {
    try {
      return res.render("seller/dashboard/index", {
        title: "Seller Dashboard",
      });
    } catch (error) {
      logger.error(`Show seller dashboard failed: ${error.message}`);

      req.flash("error", "Failed to load dashboard.");

      return res.redirect("/");
    }
  }

  // Get dashboard statistics
  async getDashboardStatistics(req, res) {
    try {
      const sellerId = new mongoose.Types.ObjectId(req.user._id);

      const [productStats, orderStats] = await Promise.all([
        Product.aggregate([
          {
            $match: {
              seller: sellerId,

              isDeleted: false,
            },
          },
          {
            $group: {
              _id: null,

              totalProducts: {
                $sum: 1,
              },

              inStock: {
                $sum: {
                  $cond: [
                    {
                      $gt: ["$stock", 10],
                    },
                    1,
                    0,
                  ],
                },
              },

              lowStock: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $gt: ["$stock", 0],
                        },
                        {
                          $lte: ["$stock", 10],
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },

              outOfStock: {
                $sum: {
                  $cond: [
                    {
                      $lte: ["$stock", 0],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ]),

        Order.aggregate([
          {
            $match: {
              isDeleted: false,
            },
          },

          {
            $unwind: "$products",
          },

          {
            $match: {
              "products.seller": sellerId,
            },
          },

          {
            $group: {
              _id: null,

              totalOrders: {
                $sum: 1,
              },

              totalRevenue: {
                $sum: {
                  $multiply: ["$products.price", "$products.quantity"],
                },
              },

              totalItemsSold: {
                $sum: "$products.quantity",
              },

              pendingOrders: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$orderStatus", "pending"],
                    },
                    1,
                    0,
                  ],
                },
              },

              deliveredOrders: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$orderStatus", "delivered"],
                    },
                    1,
                    0,
                  ],
                },
              },

              cancelledOrders: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$orderStatus", "cancelled"],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ]),
      ]);

      return res.status(httpStatusCode.OK).json({
        success: true,

        statistics: {
          products: productStats[0] || {},

          orders: orderStats[0] || {},
        },
      });
    } catch (error) {
      logger.error(`Get seller dashboard statistics failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to load dashboard statistics.",
      });
    }
  }

  // Get recent orders
  async getRecentOrders(req, res) {
    try {
      const sellerId = new mongoose.Types.ObjectId(req.user._id);

      const orders = await Order.aggregate([
        {
          $match: {
            isDeleted: false,
          },
        },

        {
          $unwind: "$products",
        },

        {
          $match: {
            "products.seller": sellerId,
          },
        },

        {
          $lookup: {
            from: "users",
            localField: "customer",
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

            orderStatus: 1,

            paymentStatus: 1,

            createdAt: 1,

            quantity: "$products.quantity",

            total: {
              $multiply: ["$products.price", "$products.quantity"],
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
            createdAt: -1,
          },
        },

        {
          $limit: 10,
        },
      ]);

      return res.status(httpStatusCode.OK).json({
        success: true,

        orders,
      });
    } catch (error) {
      logger.error(`Get seller recent orders failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to load recent orders.",
      });
    }
  }
  // Get revenue chart
  async getRevenueChart(req, res) {
    try {
      const sellerId = new mongoose.Types.ObjectId(req.user._id);

      const revenue = await Order.aggregate([
        {
          $match: {
            isDeleted: false,

            paymentStatus: "paid",
          },
        },

        {
          $unwind: "$products",
        },

        {
          $match: {
            "products.seller": sellerId,
          },
        },

        {
          $group: {
            _id: {
              year: {
                $year: "$createdAt",
              },

              month: {
                $month: "$createdAt",
              },
            },

            revenue: {
              $sum: {
                $multiply: ["$products.price", "$products.quantity"],
              },
            },
          },
        },

        {
          $sort: {
            "_id.year": 1,

            "_id.month": 1,
          },
        },

        {
          $project: {
            _id: 0,

            year: "$_id.year",

            month: "$_id.month",

            revenue: 1,
          },
        },
      ]);

      return res.status(httpStatusCode.OK).json({
        success: true,

        revenue,
      });
    } catch (error) {
      logger.error(`Get seller revenue chart failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to load revenue chart.",
      });
    }
  }

  // Get orders chart
  async getOrdersChart(req, res) {
    try {
      const sellerId = new mongoose.Types.ObjectId(req.user._id);

      const orders = await Order.aggregate([
        {
          $match: {
            isDeleted: false,
          },
        },

        {
          $unwind: "$products",
        },

        {
          $match: {
            "products.seller": sellerId,
          },
        },

        {
          $group: {
            _id: "$orderStatus",

            totalOrders: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            totalOrders: -1,
          },
        },

        {
          $project: {
            _id: 0,

            status: "$_id",

            totalOrders: 1,
          },
        },
      ]);

      return res.status(httpStatusCode.OK).json({
        success: true,

        orders,
      });
    } catch (error) {
      logger.error(`Get seller orders chart failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to load orders chart.",
      });
    }
  }

  // Get inventory chart
  async getInventoryChart(req, res) {
    try {
      const sellerId = new mongoose.Types.ObjectId(req.user._id);

      const inventory = await Product.aggregate([
        {
          $match: {
            seller: sellerId,

            isDeleted: false,
          },
        },

        {
          $group: {
            _id: null,

            inStock: {
              $sum: {
                $cond: [
                  {
                    $gt: ["$stock", 10],
                  },
                  1,
                  0,
                ],
              },
            },

            lowStock: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $gt: ["$stock", 0],
                      },
                      {
                        $lte: ["$stock", 10],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            outOfStock: {
              $sum: {
                $cond: [
                  {
                    $lte: ["$stock", 0],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },

        {
          $project: {
            _id: 0,

            inStock: 1,

            lowStock: 1,

            outOfStock: 1,
          },
        },
      ]);

      return res.status(httpStatusCode.OK).json({
        success: true,

        inventory: inventory[0] || {
          inStock: 0,

          lowStock: 0,

          outOfStock: 0,
        },
      });
    } catch (error) {
      logger.error(`Get seller inventory chart failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to load inventory chart.",
      });
    }
  }
  // Get top selling products
  async getTopSellingProducts(req, res) {
    try {
      const sellerId = new mongoose.Types.ObjectId(req.user._id);

      const products = await Order.aggregate([
        {
          $match: {
            isDeleted: false,

            orderStatus: "delivered",
          },
        },

        {
          $unwind: "$products",
        },

        {
          $match: {
            "products.seller": sellerId,
          },
        },

        {
          $group: {
            _id: "$products.product",

            totalSold: {
              $sum: "$products.quantity",
            },

            revenue: {
              $sum: {
                $multiply: ["$products.price", "$products.quantity"],
              },
            },
          },
        },

        {
          $sort: {
            totalSold: -1,
          },
        },

        {
          $limit: 10,
        },

        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },

        {
          $unwind: "$product",
        },

        {
          $project: {
            _id: 0,

            productId: "$product._id",

            name: "$product.name",

            slug: "$product.slug",

            images: "$product.images",

            stock: "$product.stock",

            totalSold: 1,

            revenue: 1,
          },
        },
      ]);

      return res.status(httpStatusCode.OK).json({
        success: true,

        products,
      });
    } catch (error) {
      logger.error(`Get seller top products failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to load top selling products.",
      });
    }
  }

  // Get latest reviews
  async getLatestReviews(req, res) {
    try {
      const sellerId = new mongoose.Types.ObjectId(req.user._id);

      const reviews = await Review.aggregate([
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
            "product.seller": sellerId,

            isDeleted: false,
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
          $unwind: {
            path: "$customer",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            rating: 1,

            review: 1,

            createdAt: 1,

            product: {
              _id: "$product._id",

              name: "$product.name",
            },

            customer: {
              _id: "$customer._id",

              name: "$customer.name",
            },
          },
        },

        {
          $sort: {
            createdAt: -1,
          },
        },

        {
          $limit: 10,
        },
      ]);

      return res.status(httpStatusCode.OK).json({
        success: true,

        reviews,
      });
    } catch (error) {
      logger.error(`Get latest reviews failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to load latest reviews.",
      });
    }
  }

  // Get revenue analytics
  async getRevenueAnalytics(req, res) {
    try {
      const sellerId = new mongoose.Types.ObjectId(req.user._id);

      const analytics = await Order.aggregate([
        {
          $match: {
            isDeleted: false,

            paymentStatus: "paid",
          },
        },

        {
          $unwind: "$products",
        },

        {
          $match: {
            "products.seller": sellerId,
          },
        },

        {
          $group: {
            _id: null,

            totalRevenue: {
              $sum: {
                $multiply: ["$products.price", "$products.quantity"],
              },
            },

            totalOrders: {
              $sum: 1,
            },

            totalItemsSold: {
              $sum: "$products.quantity",
            },

            averageOrderValue: {
              $avg: {
                $multiply: ["$products.price", "$products.quantity"],
              },
            },
          },
        },

        {
          $project: {
            _id: 0,

            totalRevenue: 1,

            totalOrders: 1,

            totalItemsSold: 1,

            averageOrderValue: {
              $round: ["$averageOrderValue", 2],
            },
          },
        },
      ]);

      return res.status(httpStatusCode.OK).json({
        success: true,

        analytics: analytics[0] || {
          totalRevenue: 0,
          totalOrders: 0,
          totalItemsSold: 0,
          averageOrderValue: 0,
        },
      });
    } catch (error) {
      logger.error(`Get revenue analytics failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to load revenue analytics.",
      });
    }
  }
}

module.exports = new SellerDashboardController();
