const mongoose = require("mongoose");

const User = require("../models/User");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Brand = require("../models/Brand");
const Order = require("../models/Order");
const Coupon = require("../models/Coupon");
const Banner = require("../models/Banner");

const logger = require("../config/logger");

const httpStatusCode = require("../utils/httpStatusCode");
class AdminDashboardController {
  // Show admin dashboard
  async showDashboard(req, res) {
    try {
      return res.render("admin/dashboard/index", {
        title: "Admin Dashboard",
      });
    } catch (error) {
      logger.error(`Show admin dashboard failed: ${error.message}`);

      req.flash("error", "Failed to load dashboard.");

      return res.redirect("/admin");
    }
  }

  // Get dashboard statistics
  async getDashboardStatistics(req, res) {
    try {
      const today = new Date();

      today.setHours(0, 0, 0, 0);

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const [
        userStats,
        productStats,
        categoryCount,
        brandCount,
        couponCount,
        bannerCount,
        orderStats,
      ] = await Promise.all([
        User.aggregate([
          {
            $match: {
              isDeleted: false,
            },
          },
          {
            $group: {
              _id: null,

              totalUsers: {
                $sum: 1,
              },

              customers: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$role", "customer"],
                    },
                    1,
                    0,
                  ],
                },
              },

              sellers: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$role", "seller"],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ]),

        Product.aggregate([
          {
            $match: {
              isDeleted: false,
            },
          },
          {
            $group: {
              _id: null,

              totalProducts: {
                $sum: 1,
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
            },
          },
        ]),

        Category.countDocuments({
          isDeleted: false,
        }),

        Brand.countDocuments({
          isDeleted: false,
        }),

        Coupon.countDocuments({
          isDeleted: false,
        }),

        Banner.countDocuments({
          isDeleted: false,
        }),

        Order.aggregate([
          {
            $match: {
              isDeleted: false,
            },
          },
          {
            $group: {
              _id: null,

              totalOrders: {
                $sum: 1,
              },

              totalRevenue: {
                $sum: "$totalAmount",
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

              todayRevenue: {
                $sum: {
                  $cond: [
                    {
                      $gte: ["$createdAt", today],
                    },
                    "$totalAmount",
                    0,
                  ],
                },
              },

              monthlyRevenue: {
                $sum: {
                  $cond: [
                    {
                      $gte: ["$createdAt", monthStart],
                    },
                    "$totalAmount",
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
          users: userStats[0] || {},

          products: productStats[0] || {},

          categories: categoryCount,

          brands: brandCount,

          coupons: couponCount,

          banners: bannerCount,

          orders: orderStats[0] || {},
        },
      });
    } catch (error) {
      logger.error(`Get dashboard statistics failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to load dashboard statistics.",
      });
    }
  }

  // Get recent orders
  async getRecentOrders(req, res) {
    try {
      const recentOrders = await Order.aggregate([
        {
          $match: {
            isDeleted: false,
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
          $unwind: {
            path: "$customer",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            orderNumber: 1,

            totalAmount: 1,

            paymentStatus: 1,

            orderStatus: 1,

            createdAt: 1,

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

        orders: recentOrders,
      });
    } catch (error) {
      logger.error(`Get recent orders failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to load recent orders.",
      });
    }
  }
  // Get revenue chart
  async getRevenueChart(req, res) {
    try {
      const revenue = await Order.aggregate([
        {
          $match: {
            isDeleted: false,

            paymentStatus: "paid",
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
              $sum: "$totalAmount",
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
      logger.error(`Get revenue chart failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to load revenue chart.",
      });
    }
  }

  // Get orders chart
  async getOrdersChart(req, res) {
    try {
      const orders = await Order.aggregate([
        {
          $match: {
            isDeleted: false,
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
      logger.error(`Get orders chart failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to load orders chart.",
      });
    }
  }

  // Get users chart
  async getUsersChart(req, res) {
    try {
      const users = await User.aggregate([
        {
          $match: {
            isDeleted: false,
          },
        },

        {
          $group: {
            _id: "$role",

            totalUsers: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            totalUsers: -1,
          },
        },

        {
          $project: {
            _id: 0,

            role: "$_id",

            totalUsers: 1,
          },
        },
      ]);

      return res.status(httpStatusCode.OK).json({
        success: true,

        users,
      });
    } catch (error) {
      logger.error(`Get users chart failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to load users chart.",
      });
    }
  }
  // Get inventory chart
  async getInventoryChart(req, res) {
    try {
      const inventory = await Product.aggregate([
        {
          $match: {
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
      logger.error(`Get inventory chart failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to load inventory chart.",
      });
    }
  }

  // Get top selling products
  async getTopSellingProducts(req, res) {
    try {
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
          $group: {
            _id: "$products.product",

            totalSold: {
              $sum: "$products.quantity",
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

            image: "$product.images",

            totalSold: 1,

            stock: "$product.stock",
          },
        },
      ]);

      return res.status(httpStatusCode.OK).json({
        success: true,

        products,
      });
    } catch (error) {
      logger.error(`Get top selling products failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to load top selling products.",
      });
    }
  }

  // Get top categories
  async getTopCategories(req, res) {
    try {
      const categories = await Order.aggregate([
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
          $lookup: {
            from: "products",
            localField: "products.product",
            foreignField: "_id",
            as: "product",
          },
        },

        {
          $unwind: "$product",
        },

        {
          $lookup: {
            from: "categories",
            localField: "product.category",
            foreignField: "_id",
            as: "category",
          },
        },

        {
          $unwind: "$category",
        },

        {
          $group: {
            _id: "$category._id",

            name: {
              $first: "$category.name",
            },

            totalSold: {
              $sum: "$products.quantity",
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
          $project: {
            _id: 0,

            categoryId: "$_id",

            name: 1,

            totalSold: 1,
          },
        },
      ]);

      return res.status(httpStatusCode.OK).json({
        success: true,

        categories,
      });
    } catch (error) {
      logger.error(`Get top categories failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to load top categories.",
      });
    }
  }
  // Get top brands
  async getTopBrands(req, res) {
    try {
      const brands = await Order.aggregate([
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
          $lookup: {
            from: "products",
            localField: "products.product",
            foreignField: "_id",
            as: "product",
          },
        },

        {
          $unwind: "$product",
        },

        {
          $lookup: {
            from: "brands",
            localField: "product.brand",
            foreignField: "_id",
            as: "brand",
          },
        },

        {
          $unwind: "$brand",
        },

        {
          $group: {
            _id: "$brand._id",

            name: {
              $first: "$brand.name",
            },

            logo: {
              $first: "$brand.logo",
            },

            totalSold: {
              $sum: "$products.quantity",
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
          $project: {
            _id: 0,

            brandId: "$_id",

            name: 1,

            logo: 1,

            totalSold: 1,
          },
        },
      ]);

      return res.status(httpStatusCode.OK).json({
        success: true,

        brands,
      });
    } catch (error) {
      logger.error(`Get top brands failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to load top brands.",
      });
    }
  }

  // Get top sellers
  async getTopSellers(req, res) {
    try {
      const sellers = await Order.aggregate([
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
          $group: {
            _id: "$products.seller",

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
          },
        },

        {
          $sort: {
            totalRevenue: -1,
          },
        },

        {
          $limit: 10,
        },

        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "seller",
          },
        },

        {
          $unwind: "$seller",
        },

        {
          $project: {
            _id: 0,

            sellerId: "$seller._id",

            name: "$seller.name",

            email: "$seller.email",

            avatar: "$seller.avatar",

            totalRevenue: 1,

            totalOrders: 1,

            totalItemsSold: 1,
          },
        },
      ]);

      return res.status(httpStatusCode.OK).json({
        success: true,

        sellers,
      });
    } catch (error) {
      logger.error(`Get top sellers failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to load top sellers.",
      });
    }
  }

  // Get latest customers
  async getLatestCustomers(req, res) {
    try {
      const customers = await User.aggregate([
        {
          $match: {
            isDeleted: false,

            role: "customer",
          },
        },

        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "customer",
            as: "orders",
          },
        },

        {
          $project: {
            name: 1,

            email: 1,

            avatar: 1,

            createdAt: 1,

            totalOrders: {
              $size: "$orders",
            },

            totalSpent: {
              $sum: "$orders.totalAmount",
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

        customers,
      });
    } catch (error) {
      logger.error(`Get latest customers failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to load latest customers.",
      });
    }
  }
}

module.exports = new AdminDashboardController();
