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
  // ==========================================================
  // CONSTANTS
  // ==========================================================

  static TIMEZONE = "Asia/Kolkata";

  static REVENUE_MATCH = {
    paymentStatus: "paid",
  };

  // ==========================================================
  // HELPER
  // ==========================================================

  getDateRange(period = "year") {
    const now = new Date();

    let startDate;

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;

      case "7days":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        break;

      case "30days":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        break;

      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;

      case "year":
      default:
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    return {
      startDate,
      endDate: now,
    };
  }

  // ==========================================================
  // HOME PAGE
  // ==========================================================

  async showDashboard(req, res) {
    try {
      return res.render("admin/dashboard/index", {
        title: "Admin Dashboard",
      });
    } catch (error) {
      logger.error(`Show admin dashboard failed: ${error.message}`);

      if (req.flash) {
        req.flash("error", "Failed to load dashboard.");
      }

      return res.redirect("/admin/dashboard");
    }
  }

  // ==========================================================
  // MAIN DASHBOARD STATISTICS
  // ==========================================================

  async getDashboardStatistics(req, res) {
    try {
      const now = new Date();

      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const previousMonthStart = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );

      const yearStart = new Date(now.getFullYear(), 0, 1);

      const previousYearStart = new Date(now.getFullYear() - 1, 0, 1);

      // ======================================================
      // USER STATISTICS
      // ======================================================

      const userStatsPromise = User.aggregate([
        {
          $match: {
            isDeleted: false,
          },
        },

        {
          $facet: {
            totals: [
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

                  admins: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$role", "admin"],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
            ],

            currentMonth: [
              {
                $match: {
                  createdAt: {
                    $gte: monthStart,
                  },
                },
              },
              {
                $count: "count",
              },
            ],

            previousMonth: [
              {
                $match: {
                  createdAt: {
                    $gte: previousMonthStart,
                    $lt: monthStart,
                  },
                },
              },
              {
                $count: "count",
              },
            ],
          },
        },
      ]);

      // ======================================================
      // PRODUCT STATISTICS
      // ======================================================

      const productStatsPromise = Product.aggregate([
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

            totalStock: {
              $sum: "$stock",
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

            activeProducts: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", "active"],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

      // ======================================================
      // ORDER STATISTICS
      // ======================================================

      const orderStatsPromise = Order.aggregate([
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,

                  totalOrders: {
                    $sum: 1,
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

                  confirmedOrders: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$orderStatus", "confirmed"],
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

                  returnedOrders: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$orderStatus", "returned"],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
            ],

            revenue: [
              {
                $match: AdminDashboardController.REVENUE_MATCH,
              },

              {
                $group: {
                  _id: null,

                  totalRevenue: {
                    $sum: "$totalAmount",
                  },

                  totalDiscount: {
                    $sum: "$discount",
                  },

                  totalTax: {
                    $sum: "$tax",
                  },

                  totalShipping: {
                    $sum: "$shippingCharge",
                  },

                  totalPlatformFee: {
                    $sum: "$platformFee",
                  },

                  totalOrders: {
                    $sum: 1,
                  },
                },
              },
            ],

            today: [
              {
                $match: {
                  ...AdminDashboardController.REVENUE_MATCH,

                  paidAt: {
                    $gte: todayStart,
                  },
                },
              },

              {
                $group: {
                  _id: null,

                  revenue: {
                    $sum: "$totalAmount",
                  },

                  orders: {
                    $sum: 1,
                  },
                },
              },
            ],

            yesterday: [
              {
                $match: {
                  ...AdminDashboardController.REVENUE_MATCH,

                  paidAt: {
                    $gte: yesterdayStart,
                    $lt: todayStart,
                  },
                },
              },

              {
                $group: {
                  _id: null,

                  revenue: {
                    $sum: "$totalAmount",
                  },

                  orders: {
                    $sum: 1,
                  },
                },
              },
            ],

            currentMonth: [
              {
                $match: {
                  ...AdminDashboardController.REVENUE_MATCH,

                  paidAt: {
                    $gte: monthStart,
                  },
                },
              },

              {
                $group: {
                  _id: null,

                  revenue: {
                    $sum: "$totalAmount",
                  },

                  orders: {
                    $sum: 1,
                  },
                },
              },
            ],

            previousMonth: [
              {
                $match: {
                  ...AdminDashboardController.REVENUE_MATCH,

                  paidAt: {
                    $gte: previousMonthStart,
                    $lt: monthStart,
                  },
                },
              },

              {
                $group: {
                  _id: null,

                  revenue: {
                    $sum: "$totalAmount",
                  },

                  orders: {
                    $sum: 1,
                  },
                },
              },
            ],

            currentYear: [
              {
                $match: {
                  ...AdminDashboardController.REVENUE_MATCH,

                  paidAt: {
                    $gte: yearStart,
                  },
                },
              },

              {
                $group: {
                  _id: null,

                  revenue: {
                    $sum: "$totalAmount",
                  },

                  orders: {
                    $sum: 1,
                  },
                },
              },
            ],

            previousYear: [
              {
                $match: {
                  ...AdminDashboardController.REVENUE_MATCH,

                  paidAt: {
                    $gte: previousYearStart,
                    $lt: yearStart,
                  },
                },
              },

              {
                $group: {
                  _id: null,

                  revenue: {
                    $sum: "$totalAmount",
                  },

                  orders: {
                    $sum: 1,
                  },
                },
              },
            ],

            itemsSold: [
              {
                $match: AdminDashboardController.REVENUE_MATCH,
              },

              {
                $unwind: "$items",
              },

              {
                $group: {
                  _id: null,

                  itemsSold: {
                    $sum: "$items.quantity",
                  },
                },
              },
            ],
          },
        },
      ]);

      // ======================================================
      // CATEGORY / BRAND / COUPON / BANNER COUNTS
      // ======================================================

      const [
        userStats,
        productStats,
        orderStats,
        categoryCount,
        brandCount,
        couponCount,
        bannerCount,
      ] = await Promise.all([
        userStatsPromise,
        productStatsPromise,
        orderStatsPromise,

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
      ]);

      const users = userStats[0] || {};

      const userTotals = users.totals?.[0] || {};

      const products = productStats[0] || {};

      const orders = orderStats[0] || {};

      const orderTotals = orders.totals?.[0] || {};

      const revenue = orders.revenue?.[0] || {};

      const today = orders.today?.[0] || {};

      const yesterday = orders.yesterday?.[0] || {};

      const currentMonth = orders.currentMonth?.[0] || {};

      const previousMonth = orders.previousMonth?.[0] || {};

      const currentYear = orders.currentYear?.[0] || {};

      const previousYear = orders.previousYear?.[0] || {};

      const itemsSold = orders.itemsSold?.[0] || {};

      // ======================================================
      // GROWTH CALCULATIONS
      // ======================================================

      const calculateGrowth = (current, previous) => {
        current = Number(current || 0);
        previous = Number(previous || 0);

        if (previous === 0) {
          return current > 0 ? 100 : 0;
        }

        return Number((((current - previous) / previous) * 100).toFixed(2));
      };

      const revenueGrowth = calculateGrowth(
        currentMonth.revenue,
        previousMonth.revenue,
      );

      const orderGrowth = calculateGrowth(
        currentMonth.orders,
        previousMonth.orders,
      );

      const customerGrowth = calculateGrowth(
        users.currentMonth?.[0]?.count || 0,
        users.previousMonth?.[0]?.count || 0,
      );

      const todayGrowth = calculateGrowth(today.revenue, yesterday.revenue);

      const yearlyGrowth = calculateGrowth(
        currentYear.revenue,
        previousYear.revenue,
      );

      const averageOrderValue =
        revenue.totalOrders > 0
          ? revenue.totalRevenue / revenue.totalOrders
          : 0;

      const deliveryRate =
        orderTotals.totalOrders > 0
          ? (orderTotals.deliveredOrders / orderTotals.totalOrders) * 100
          : 0;

      const cancellationRate =
        orderTotals.totalOrders > 0
          ? (orderTotals.cancelledOrders / orderTotals.totalOrders) * 100
          : 0;

      return res.status(httpStatusCode.OK).json({
        success: true,

        statistics: {
          revenue: {
            total: revenue.totalRevenue || 0,

            today: today.revenue || 0,

            thisMonth: currentMonth.revenue || 0,

            thisYear: currentYear.revenue || 0,

            growth: revenueGrowth,

            todayGrowth,

            yearlyGrowth,

            discount: revenue.totalDiscount || 0,

            tax: revenue.totalTax || 0,

            shipping: revenue.totalShipping || 0,

            platformFee: revenue.totalPlatformFee || 0,
          },

          orders: {
            total: orderTotals.totalOrders || 0,

            today: today.orders || 0,

            thisMonth: currentMonth.orders || 0,

            thisYear: currentYear.orders || 0,

            growth: orderGrowth,

            pending: orderTotals.pendingOrders || 0,

            confirmed: orderTotals.confirmedOrders || 0,

            delivered: orderTotals.deliveredOrders || 0,

            cancelled: orderTotals.cancelledOrders || 0,

            returned: orderTotals.returnedOrders || 0,

            deliveryRate: Number(deliveryRate.toFixed(2)),

            cancellationRate: Number(cancellationRate.toFixed(2)),
          },

          customers: {
            total: userTotals.customers || 0,

            admins: userTotals.admins || 0,

            growth: customerGrowth,
          },

          products: {
            total: products.totalProducts || 0,

            active: products.activeProducts || 0,

            stock: products.totalStock || 0,

            lowStock: products.lowStock || 0,

            outOfStock: products.outOfStock || 0,
          },

          sales: {
            itemsSold: itemsSold.itemsSold || 0,

            averageOrderValue: Number(averageOrderValue.toFixed(2)),
          },

          categories: categoryCount,

          brands: brandCount,

          coupons: couponCount,

          banners: bannerCount,
        },
      });
    } catch (error) {
      logger.error(
        `Get dashboard statistics failed: ${error.stack || error.message}`,
      );

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to load dashboard statistics.",
      });
    }
  }

  // ==========================================================
  // REVENUE CHART
  // ==========================================================

  async getRevenueChart(req, res) {
    try {
      const year = Number(req.query.year) || new Date().getFullYear();

      const month = Number(req.query.month) || null;

      const match = {
        ...AdminDashboardController.REVENUE_MATCH,
      };

      // ======================================================
      // YEARLY REVENUE
      // ======================================================

      if (!month) {
        const revenue = await Order.aggregate([
          {
            $match: match,
          },

          {
            $group: {
              _id: {
                year: {
                  $year: "$paidAt",
                },
              },

              revenue: {
                $sum: "$totalAmount",
              },

              orders: {
                $sum: 1,
              },
            },
          },

          {
            $sort: {
              "_id.year": 1,
            },
          },

          {
            $project: {
              _id: 0,

              year: "$_id.year",

              revenue: 1,

              orders: 1,

              source: {
                $literal: "database",
              },
            },
          },
        ]);

        const currentYear = new Date().getFullYear();

        const historical = AdminDashboardController.generateHistoricalRevenue(
          2016,
          currentYear,
        );

        // Overlay actual DB data
        const actualMap = new Map(revenue.map((item) => [item.year, item]));

        const finalData = historical.map((item) => {
          const actual = actualMap.get(item.year);

          if (actual) {
            return actual;
          }

          return item;
        });

        return res.status(httpStatusCode.OK).json({
          success: true,

          type: "yearly",

          year,

          revenue: finalData,
        });
      }

      // ======================================================
      // MONTHLY / DAILY DATA
      // ======================================================

      const startDate = new Date(year, month - 1, 1);

      const endDate = new Date(year, month, 1);

      const revenue = await Order.aggregate([
        {
          $match: {
            ...match,

            paidAt: {
              $gte: startDate,
              $lt: endDate,
            },
          },
        },

        {
          $group: {
            _id: {
              day: {
                $dayOfMonth: "$paidAt",
              },
            },

            revenue: {
              $sum: "$totalAmount",
            },

            orders: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            "_id.day": 1,
          },
        },

        {
          $project: {
            _id: 0,

            day: "$_id.day",

            revenue: 1,

            orders: 1,
          },
        },
      ]);

      const daysInMonth = new Date(year, month, 0).getDate();

      const finalData = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const actual = revenue.find((item) => item.day === day);

        finalData.push({
          day,

          revenue: actual?.revenue || 0,

          orders: actual?.orders || 0,
        });
      }

      return res.status(httpStatusCode.OK).json({
        success: true,

        type: "daily",

        year,

        month,

        revenue: finalData,
      });
    } catch (error) {
      logger.error(`Get revenue chart failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to load revenue chart.",
      });
    }
  }

  // ==========================================================
  // HISTORICAL DEMO REVENUE
  // ==========================================================

  static generateHistoricalRevenue(startYear, endYear) {
    const values = [
      85000, 112000, 98000, 146000, 188000, 163000, 224000, 281000, 252000,
      336000, 421000,
    ];

    const result = [];

    for (let year = startYear; year <= endYear; year++) {
      if (year === new Date().getFullYear()) {
        // Current year must come from DB.
        result.push({
          year,

          revenue: 0,

          orders: 0,

          source: "database",
        });

        continue;
      }

      const index = year - startYear;

      const base = values[index % values.length];

      // Deterministic ups / downs
      const variation = ((year * 37) % 29) / 100;

      const direction = year % 3 === 0 ? -1 : 1;

      const revenue = Math.round(base * (1 + direction * variation));

      result.push({
        year,

        revenue,

        orders: Math.round(revenue / 1450),

        source: "historical",
      });
    }

    return result;
  }

  // ==========================================================
  // ORDER STATUS PIE / DOUGHNUT
  // ==========================================================

  async getOrdersChart(req, res) {
    try {
      const orders = await Order.aggregate([
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

  // ==========================================================
  // USER / CUSTOMER GROWTH
  // ==========================================================

  async getUsersChart(req, res) {
    try {
      const now = new Date();

      const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);

      const users = await User.aggregate([
        {
          $match: {
            isDeleted: false,

            role: "customer",

            createdAt: {
              $gte: start,
            },
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

            totalUsers: {
              $sum: 1,
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

  // ==========================================================
  // INVENTORY
  // ==========================================================

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

            healthyStock: {
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

            healthyStock: 1,

            lowStock: 1,

            outOfStock: 1,
          },
        },
      ]);

      return res.status(httpStatusCode.OK).json({
        success: true,

        inventory: inventory[0] || {
          healthyStock: 0,
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

  // ==========================================================
  // TOP SELLING PRODUCTS
  // ==========================================================

  async getTopSellingProducts(req, res) {
    try {
      const products = await Order.aggregate([
        {
          $match: AdminDashboardController.REVENUE_MATCH,
        },

        {
          $unwind: "$items",
        },

        {
          $group: {
            _id: "$items.product",

            name: {
              $first: "$items.productName",
            },

            image: {
              $first: "$items.image.url",
            },

            totalSold: {
              $sum: "$items.quantity",
            },

            revenue: {
              $sum: {
                $multiply: ["$items.finalPrice", "$items.quantity"],
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
          $unwind: {
            path: "$product",

            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            _id: 0,

            productId: "$_id",

            name: 1,

            image: 1,

            totalSold: 1,

            revenue: 1,

            stock: "$product.stock",

            slug: "$product.slug",
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

  // ==========================================================
  // CATEGORY SALES
  // ==========================================================

  async getTopCategories(req, res) {
    try {
      const categories = await Order.aggregate([
        {
          $match: AdminDashboardController.REVENUE_MATCH,
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
              $sum: "$items.quantity",
            },

            revenue: {
              $sum: {
                $multiply: ["$items.finalPrice", "$items.quantity"],
              },
            },
          },
        },

        {
          $sort: {
            revenue: -1,
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

            revenue: 1,
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

  // ==========================================================
  // BRAND SALES
  // ==========================================================

  async getTopBrands(req, res) {
    try {
      const brands = await Order.aggregate([
        {
          $match: AdminDashboardController.REVENUE_MATCH,
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

            totalSold: {
              $sum: "$items.quantity",
            },

            revenue: {
              $sum: {
                $multiply: ["$items.finalPrice", "$items.quantity"],
              },
            },
          },
        },

        {
          $sort: {
            revenue: -1,
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

            totalSold: 1,

            revenue: 1,
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

  // ==========================================================
  // SELLER PERFORMANCE
  // ==========================================================

  async getTopSellers(req, res) {
    try {
      const sellers = await Order.aggregate([
        {
          $match: AdminDashboardController.REVENUE_MATCH,
        },

        {
          $unwind: "$items",
        },

        {
          $group: {
            _id: "$items.seller",

            totalRevenue: {
              $sum: {
                $multiply: ["$items.finalPrice", "$items.quantity"],
              },
            },

            totalItemsSold: {
              $sum: "$items.quantity",
            },

            totalOrders: {
              $sum: 1,
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

            totalRevenue: 1,

            totalItemsSold: 1,

            totalOrders: 1,
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

  // ==========================================================
  // PAYMENT METHOD CHART
  // ==========================================================

  async getPaymentMethodsChart(req, res) {
    try {
      const payments = await Order.aggregate([
        {
          $match: AdminDashboardController.REVENUE_MATCH,
        },

        {
          $group: {
            _id: "$paymentMethod",

            orders: {
              $sum: 1,
            },

            revenue: {
              $sum: "$totalAmount",
            },
          },
        },

        {
          $sort: {
            revenue: -1,
          },
        },

        {
          $project: {
            _id: 0,

            method: "$_id",

            orders: 1,

            revenue: 1,
          },
        },
      ]);

      return res.status(httpStatusCode.OK).json({
        success: true,

        payments,
      });
    } catch (error) {
      logger.error(`Get payment methods chart failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to load payment analytics.",
      });
    }
  }

  // ==========================================================
  // REVENUE BREAKDOWN
  // ==========================================================

  async getRevenueBreakdown(req, res) {
    try {
      const breakdown = await Order.aggregate([
        {
          $match: AdminDashboardController.REVENUE_MATCH,
        },

        {
          $group: {
            _id: null,

            revenue: {
              $sum: "$totalAmount",
            },

            subtotal: {
              $sum: "$subtotal",
            },

            discount: {
              $sum: "$discount",
            },

            shipping: {
              $sum: "$shippingCharge",
            },

            tax: {
              $sum: "$tax",
            },

            platformFee: {
              $sum: "$platformFee",
            },
          },
        },

        {
          $project: {
            _id: 0,

            revenue: 1,

            subtotal: 1,

            discount: 1,

            shipping: 1,

            tax: 1,

            platformFee: 1,
          },
        },
      ]);

      return res.status(httpStatusCode.OK).json({
        success: true,

        breakdown: breakdown[0] || {
          revenue: 0,
          subtotal: 0,
          discount: 0,
          shipping: 0,
          tax: 0,
          platformFee: 0,
        },
      });
    } catch (error) {
      logger.error(`Get revenue breakdown failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to load revenue breakdown.",
      });
    }
  }

  // ==========================================================
  // RECENT ORDERS
  // ==========================================================

  async getRecentOrders(req, res) {
    try {
      const recentOrders = await Order.aggregate([
        {
          $sort: {
            createdAt: -1,
          },
        },

        {
          $limit: 10,
        },

        {
          $lookup: {
            from: "users",

            localField: "user",

            foreignField: "_id",

            as: "user",
          },
        },

        {
          $unwind: {
            path: "$user",

            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            _id: 1,

            orderNumber: 1,

            totalAmount: 1,

            paymentStatus: 1,

            paymentMethod: 1,

            orderStatus: 1,

            createdAt: 1,

            paidAt: 1,

            customer: {
              _id: "$user._id",

              name: "$user.name",

              email: "$user.email",
            },

            itemCount: {
              $sum: "$items.quantity",
            },
          },
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

  // ==========================================================
  // LATEST CUSTOMERS
  // ==========================================================

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

            let: {
              userId: "$_id",
            },

            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$user", "$$userId"],
                      },

                      {
                        $eq: ["$paymentStatus", "paid"],
                      },
                    ],
                  },
                },
              },
            ],

            as: "orders",
          },
        },

        {
          $project: {
            name: 1,

            email: 1,

            profileImage: 1,

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
