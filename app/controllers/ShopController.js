const mongoose = require("mongoose");

const Product = require("../models/Product");
const Category = require("../models/Category");
const Brand = require("../models/Brand");
const Cart = require("../models/Cart");
const Review = require("../models/Review");
const Wishlist = require("../models/Wishlist");

const logger = require("../config/logger");
const httpStatusCode = require("../utils/httpStatusCode");

class ShopController {
  // ==========================================================
  // SHOP PAGE
  // ==========================================================

  async showShopPage(req, res) {
    try {
      const {
        page = 1,
        search = "",
        category = "",
        brand = "",
        priceRange = "",
        rating = "",
        availability = "",
        sort = "latest",
      } = req.query;

      // ------------------------------------------------------
      // Current logged-in user
      //
      // Public Shop does not use authMiddleware.
      // globalMiddleware exposes the user through res.locals.
      // ------------------------------------------------------

      const currentUser = req.user || res.locals.user || null;

      // ------------------------------------------------------
      // Pagination
      // ------------------------------------------------------

      const currentPage = Math.max(Number.parseInt(page, 10) || 1, 1);

      // 12 products per page
      const limit = 9;

      const skip = (currentPage - 1) * limit;

      // ------------------------------------------------------
      // Search value
      // ------------------------------------------------------

      const trimmedSearch = search.trim();

      const escapedSearch = trimmedSearch
        ? trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        : "";

      // ------------------------------------------------------
      // Base product filter
      //
      // IMPORTANT:
      //
      // "out-of-stock" products are also included because
      // the Shop should show them with:
      //
      // OUT OF STOCK
      //
      // and a disabled Add to Cart button.
      // ------------------------------------------------------

      const matchStage = {
        isDeleted: false,

        approvalStatus: "approved",

        status: {
          $in: ["active", "out-of-stock"],
        },
      };

      // ------------------------------------------------------
      // Product aggregation
      // ------------------------------------------------------

      const pipeline = [
        {
          $match: matchStage,
        },

        // ----------------------------------------------------
        // Category
        // ----------------------------------------------------

        {
          $lookup: {
            from: "categories",

            localField: "category",

            foreignField: "_id",

            as: "category",
          },
        },

        {
          $unwind: {
            path: "$category",

            preserveNullAndEmptyArrays: false,
          },
        },

        // ----------------------------------------------------
        // Brand
        // ----------------------------------------------------

        {
          $lookup: {
            from: "brands",

            localField: "brand",

            foreignField: "_id",

            as: "brand",
          },
        },

        {
          $unwind: {
            path: "$brand",

            preserveNullAndEmptyArrays: false,
          },
        },

        // ----------------------------------------------------
        // Category / Brand must be active
        // ----------------------------------------------------

        {
          $match: {
            "category.status": "active",

            "category.isDeleted": false,

            "brand.status": "active",

            "brand.isDeleted": false,
          },
        },

        // ----------------------------------------------------
        // Effective selling price
        //
        // Valid discountPrice -> discountPrice
        // Otherwise -> original price
        // ----------------------------------------------------

        {
          $set: {
            sellingPrice: {
              $cond: [
                {
                  $and: [
                    {
                      $ne: ["$discountPrice", null],
                    },

                    {
                      $lt: ["$discountPrice", "$price"],
                    },
                  ],
                },

                "$discountPrice",

                "$price",
              ],
            },
          },
        },

        // ----------------------------------------------------
        // SEARCH
        // ----------------------------------------------------

        ...(escapedSearch
          ? [
              {
                $match: {
                  $or: [
                    {
                      name: {
                        $regex: escapedSearch,
                        $options: "i",
                      },
                    },

                    {
                      shortDescription: {
                        $regex: escapedSearch,
                        $options: "i",
                      },
                    },

                    {
                      sku: {
                        $regex: escapedSearch,
                        $options: "i",
                      },
                    },

                    {
                      "category.name": {
                        $regex: escapedSearch,
                        $options: "i",
                      },
                    },

                    {
                      "brand.name": {
                        $regex: escapedSearch,
                        $options: "i",
                      },
                    },
                  ],
                },
              },
            ]
          : []),

        // ----------------------------------------------------
        // CATEGORY FILTER
        //
        // Accepts either:
        //
        // /shop?category=<ObjectId>
        //
        // or
        //
        // /shop?category=<slug>
        // ----------------------------------------------------

        ...(category
          ? [
              {
                $match: {
                  $or: [
                    ...(mongoose.Types.ObjectId.isValid(category)
                      ? [
                          {
                            "category._id": new mongoose.Types.ObjectId(
                              category,
                            ),
                          },
                        ]
                      : []),

                    {
                      "category.slug": category,
                    },
                  ],
                },
              },
            ]
          : []),

        // ----------------------------------------------------
        // BRAND FILTER
        // ----------------------------------------------------

        ...(brand
          ? [
              {
                $match: {
                  $or: [
                    ...(mongoose.Types.ObjectId.isValid(brand)
                      ? [
                          {
                            "brand._id": new mongoose.Types.ObjectId(brand),
                          },
                        ]
                      : []),

                    {
                      "brand.slug": brand,
                    },
                  ],
                },
              },
            ]
          : []),

        // ----------------------------------------------------
        // PRICE FILTER
        // ----------------------------------------------------

        ...(priceRange === "100-999"
          ? [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $gte: ["$sellingPrice", 100],
                      },

                      {
                        $lte: ["$sellingPrice", 999],
                      },
                    ],
                  },
                },
              },
            ]
          : []),

        ...(priceRange === "1000-4999"
          ? [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $gte: ["$sellingPrice", 1000],
                      },

                      {
                        $lte: ["$sellingPrice", 4999],
                      },
                    ],
                  },
                },
              },
            ]
          : []),

        ...(priceRange === "5000-9999"
          ? [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $gte: ["$sellingPrice", 5000],
                      },

                      {
                        $lte: ["$sellingPrice", 9999],
                      },
                    ],
                  },
                },
              },
            ]
          : []),

        ...(priceRange === "10000-plus"
          ? [
              {
                $match: {
                  $expr: {
                    $gte: ["$sellingPrice", 10000],
                  },
                },
              },
            ]
          : []),

        // ----------------------------------------------------
        // RATING FILTER
        // ----------------------------------------------------

        ...(Number.isFinite(Number(rating)) &&
        Number(rating) >= 1 &&
        Number(rating) <= 5
          ? [
              {
                $match: {
                  averageRating: {
                    $gte: Number(rating),
                  },
                },
              },
            ]
          : []),

        // ----------------------------------------------------
        // AVAILABILITY FILTER
        //
        // In Stock:
        // more than 5 units
        //
        // Low Stock:
        // 1-5 units
        // ----------------------------------------------------

        ...(availability === "in-stock"
          ? [
              {
                $match: {
                  stock: {
                    $gt: 5,
                  },
                },
              },
            ]
          : []),

        ...(availability === "low-stock"
          ? [
              {
                $match: {
                  stock: {
                    $gt: 0,
                    $lte: 5,
                  },
                },
              },
            ]
          : []),

        // ----------------------------------------------------
        // SORT
        // ----------------------------------------------------

        {
          $sort:
            sort === "price-low"
              ? {
                  sellingPrice: 1,
                  _id: 1,
                }
              : sort === "price-high"
                ? {
                    sellingPrice: -1,
                    _id: 1,
                  }
                : sort === "rating"
                  ? {
                      averageRating: -1,
                      totalRatings: -1,
                      _id: 1,
                    }
                  : sort === "popular"
                    ? {
                        soldCount: -1,
                        views: -1,
                        _id: 1,
                      }
                    : {
                        publishedAt: -1,
                        createdAt: -1,
                        _id: 1,
                      },
        },

        // ----------------------------------------------------
        // PAGINATION
        // ----------------------------------------------------

        {
          $facet: {
            products: [
              {
                $skip: skip,
              },

              {
                $limit: limit,
              },
            ],

            totalProducts: [
              {
                $count: "count",
              },
            ],
          },
        },
      ];

      // ======================================================
      // CATEGORY PIPELINE
      // ======================================================

      const categoryPipeline = [
        {
          $match: {
            status: "active",

            isDeleted: false,
          },
        },

        {
          $project: {
            _id: 1,

            name: 1,

            slug: 1,
          },
        },

        {
          $sort: {
            name: 1,
          },
        },
      ];

      // ======================================================
      // BRAND PIPELINE
      // ======================================================

      const brandPipeline = [
        {
          $match: {
            status: "active",

            isDeleted: false,
          },
        },

        {
          $project: {
            _id: 1,

            name: 1,

            slug: 1,
          },
        },

        {
          $sort: {
            name: 1,
          },
        },
      ];

      // ======================================================
      // FEATURED PRODUCTS
      //
      // Exactly the same public eligibility rules.
      //
      // Only:
      // isFeatured = true
      //
      // is added on top.
      // ======================================================

      const featuredPipeline = [
        {
          $match: {
            isFeatured: true,

            isDeleted: false,

            approvalStatus: "approved",

            status: {
              $in: ["active", "out-of-stock"],
            },
          },
        },

        {
          $lookup: {
            from: "categories",

            localField: "category",

            foreignField: "_id",

            as: "category",
          },
        },

        {
          $unwind: {
            path: "$category",

            preserveNullAndEmptyArrays: false,
          },
        },

        {
          $lookup: {
            from: "brands",

            localField: "brand",

            foreignField: "_id",

            as: "brand",
          },
        },

        {
          $unwind: {
            path: "$brand",

            preserveNullAndEmptyArrays: false,
          },
        },

        {
          $match: {
            "category.status": "active",

            "category.isDeleted": false,

            "brand.status": "active",

            "brand.isDeleted": false,
          },
        },

        {
          $set: {
            sellingPrice: {
              $cond: [
                {
                  $and: [
                    {
                      $ne: ["$discountPrice", null],
                    },

                    {
                      $lt: ["$discountPrice", "$price"],
                    },
                  ],
                },

                "$discountPrice",

                "$price",
              ],
            },
          },
        },

        // Random featured products
        {
          $sample: {
            size: 10,
          },
        },
      ];

      // ======================================================
      // WISHLIST
      //
      // One query for the entire Shop page.
      //
      // No N+1 wishlist queries.
      // ======================================================

      const wishlistPromise =
        currentUser?.role === "customer"
          ? Wishlist.find({
              user: currentUser._id,
            })
              .select("product")
              .lean()
          : Promise.resolve([]);

      // ======================================================
      // RUN QUERIES
      // ======================================================

      const [
        productResult,
        categories,
        brands,
        featuredProducts,
        wishlistItems,
      ] = await Promise.all([
        Product.aggregate(pipeline),

        Category.aggregate(categoryPipeline),

        Brand.aggregate(brandPipeline),

        Product.aggregate(featuredPipeline),

        wishlistPromise,
      ]);

      // ======================================================
      // PRODUCT RESULT
      // ======================================================

      const result = productResult[0] || {};

      const products = result.products || [];

      const totalProducts = result.totalProducts?.[0]?.count || 0;

      const totalPages =
        totalProducts > 0 ? Math.ceil(totalProducts / limit) : 0;

      // ======================================================
      // WISHLIST STATE
      // ======================================================

      const wishlistProductIds = new Set(
        wishlistItems.map((item) => item.product.toString()),
      );

      products.forEach((product) => {
        product.isWishlisted = wishlistProductIds.has(product._id.toString());
      });

      featuredProducts.forEach((product) => {
        product.isWishlisted = wishlistProductIds.has(product._id.toString());
      });

      // ======================================================
      // INVALID PAGE
      // ======================================================

      if (totalPages > 0 && currentPage > totalPages) {
        const params = new URLSearchParams(req.query);

        params.set("page", String(totalPages));

        return res.redirect(`/shop?${params.toString()}`);
      }

      // ======================================================
      // RENDER SHOP
      // ======================================================

      return res.status(httpStatusCode.OK).render("shop/index", {
        title: "Shop | Plantora",

        products,

        categories,

        brands,

        featuredProducts,

        filters: {
          page: currentPage,

          search,

          category,

          brand,

          priceRange,

          rating,

          availability,

          sort,
        },

        pagination: {
          page: currentPage,

          limit,

          totalProducts,

          totalPages,

          hasPreviousPage: currentPage > 1,

          hasNextPage: currentPage < totalPages,
        },
      });
    } catch (error) {
      logger.error(`Show shop page failed: ${error.stack || error.message}`);

      return res
        .status(httpStatusCode.INTERNAL_SERVER_ERROR)
        .render("errors/error", {
          title: "Shop",

          message: "Unable to load the shop.",
        });
    }
  }

  // ==========================================================
  // PUBLIC PRODUCT DETAILS
  //
  // We are keeping this method here for the next step.
  // The EJS page does NOT need to exist yet.
  // ==========================================================

  // ==========================================================
  // PUBLIC PRODUCT DETAILS
  // ==========================================================

  async showProductDetails(req, res) {
    try {
      const { slug } = req.params;

      // ------------------------------------------------------
      // Validate slug
      // ------------------------------------------------------

      if (!slug) {
        return res.redirect("/shop");
      }

      // ------------------------------------------------------
      // CURRENT USER
      //
      // Product details are PUBLIC.
      //
      // Guests:
      // req.user = undefined
      //
      // Logged-in users:
      // req.user = authenticated user
      // ------------------------------------------------------

      const currentUser = req.user || res.locals.user || null;

      // ======================================================
      // FIND PUBLIC PRODUCT + INCREMENT VIEWS
      // ======================================================

      const updatedProduct = await Product.findOneAndUpdate(
        {
          slug,

          isDeleted: false,

          approvalStatus: "approved",

          status: {
            $in: ["active", "out-of-stock"],
          },
        },

        {
          $inc: {
            views: 1,
          },
        },

        {
          new: true,
        },
      ).lean();

      // ------------------------------------------------------
      // Product not found
      // ------------------------------------------------------

      if (!updatedProduct) {
        return res.redirect("/shop");
      }

      // ======================================================
      // PRODUCT DETAILS
      // ======================================================

      const productResult = await Product.aggregate([
        {
          $match: {
            _id: updatedProduct._id,

            isDeleted: false,

            approvalStatus: "approved",

            status: {
              $in: ["active", "out-of-stock"],
            },
          },
        },

        // ====================================================
        // CATEGORY
        // ====================================================

        {
          $lookup: {
            from: "categories",

            localField: "category",

            foreignField: "_id",

            as: "category",
          },
        },

        {
          $unwind: {
            path: "$category",

            preserveNullAndEmptyArrays: true,
          },
        },

        // ====================================================
        // BRAND
        // ====================================================

        {
          $lookup: {
            from: "brands",

            localField: "brand",

            foreignField: "_id",

            as: "brand",
          },
        },

        {
          $unwind: {
            path: "$brand",

            preserveNullAndEmptyArrays: true,
          },
        },

        // ====================================================
        // SELLER
        // ====================================================

        {
          $lookup: {
            from: "users",

            localField: "seller",

            foreignField: "_id",

            as: "seller",
          },
        },

        {
          $unwind: {
            path: "$seller",

            preserveNullAndEmptyArrays: true,
          },
        },

        // ====================================================
        // PUBLIC PRODUCT DATA
        // ====================================================

        {
          $project: {
            _id: 1,

            name: 1,

            slug: 1,

            shortDescription: 1,

            description: 1,

            metaTitle: 1,

            metaDescription: 1,

            images: 1,

            price: 1,

            discountPrice: 1,

            stock: 1,

            lowStockThreshold: 1,

            sku: 1,

            averageRating: 1,

            totalRatings: 1,

            soldCount: 1,

            views: 1,

            likesCount: 1,

            status: 1,

            approvalStatus: 1,

            isFeatured: 1,

            publishedAt: 1,

            createdAt: 1,

            updatedAt: 1,

            // ==================================================
            // CATEGORY
            // ==================================================

            category: {
              _id: "$category._id",

              name: "$category.name",

              slug: "$category.slug",
            },

            // ==================================================
            // BRAND
            // ==================================================

            brand: {
              _id: "$brand._id",

              name: "$brand.name",

              slug: "$brand.slug",
            },

            // ==================================================
            // SELLER
            // ==================================================

            seller: {
              _id: "$seller._id",

              name: "$seller.name",

              profileImage: "$seller.profileImage",

              role: "$seller.role",
            },
          },
        },
      ]);

      // ======================================================
      // PRODUCT
      // ======================================================

      const product = productResult[0];

      if (!product) {
        return res.redirect("/shop");
      }

      // ======================================================
      // EFFECTIVE SELLING PRICE
      // ======================================================

      const hasDiscount =
        product.discountPrice !== null &&
        product.discountPrice !== undefined &&
        Number(product.discountPrice) < Number(product.price);

      product.sellingPrice = hasDiscount
        ? Number(product.discountPrice)
        : Number(product.price);

      // ======================================================
      // DISCOUNT PERCENTAGE
      // ======================================================

      product.discountPercentage = hasDiscount
        ? Math.round(
            ((Number(product.price) - Number(product.discountPrice)) /
              Number(product.price)) *
              100,
          )
        : 0;

      // ======================================================
      // STOCK INFORMATION
      // ======================================================

      product.isOutOfStock = Number(product.stock) <= 0;

      product.isLowStock =
        Number(product.stock) > 0 &&
        Number(product.stock) <= Number(product.lowStockThreshold || 5);

      // ======================================================
      // MAXIMUM CART QUANTITY
      // ======================================================

      const maxCartQuantity = Number(product.stock || 0);

      // ======================================================
      // WISHLIST
      // ======================================================

      let isWishlisted = false;

      if (currentUser) {
        isWishlisted = Boolean(
          await Wishlist.exists({
            user: currentUser._id,

            product: product._id,
          }),
        );
      }

      // ======================================================
      // CURRENT CART STATE
      // ======================================================

      let cartQuantity = 0;

      if (currentUser) {
        const cart = await Cart.findOne({
          user: currentUser._id,
        })
          .select("items")
          .lean();

        if (cart && Array.isArray(cart.items)) {
          const cartItem = cart.items.find(
            (item) =>
              item.product &&
              item.product.toString() === product._id.toString(),
          );

          if (cartItem) {
            cartQuantity = Number(cartItem.quantity || 0);
          }
        }
      }

      product.cartQuantity = cartQuantity;

      product.isInCart = cartQuantity > 0;

      // ======================================================
      // REVIEWS + RATING SUMMARY
      // ======================================================

      const reviewResult = await Review.aggregate([
        {
          $match: {
            product: product._id,

            status: "approved",

            isDeleted: false,
          },
        },

        {
          $facet: {
            reviews: [
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

                  rating: 1,

                  reviewTitle: 1,

                  comment: 1,

                  images: 1,

                  helpfulCount: 1,

                  isVerifiedPurchase: 1,

                  createdAt: 1,

                  updatedAt: 1,

                  user: {
                    _id: "$user._id",

                    name: {
                      $ifNull: ["$user.name", "Deleted Customer"],
                    },

                    profilePicture: "$user.profilePicture",
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
            ],

            summary: [
              {
                $group: {
                  _id: null,

                  averageRating: {
                    $avg: "$rating",
                  },

                  totalReviews: {
                    $sum: 1,
                  },

                  fiveStar: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$rating", 5],
                        },

                        1,

                        0,
                      ],
                    },
                  },

                  fourStar: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$rating", 4],
                        },

                        1,

                        0,
                      ],
                    },
                  },

                  threeStar: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$rating", 3],
                        },

                        1,

                        0,
                      ],
                    },
                  },

                  twoStar: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$rating", 2],
                        },

                        1,

                        0,
                      ],
                    },
                  },

                  oneStar: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$rating", 1],
                        },

                        1,

                        0,
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      ]);

      const reviewData = reviewResult[0] || {
        reviews: [],
        summary: [],
      };

      const reviews = reviewData.reviews || [];

      const reviewSummary = reviewData.summary?.[0] || {
        averageRating: 0,

        totalReviews: 0,

        fiveStar: 0,

        fourStar: 0,

        threeStar: 0,

        twoStar: 0,

        oneStar: 0,
      };

      // ======================================================
      // RATING
      // ======================================================

      reviewSummary.averageRating = Number(
        Number(reviewSummary.averageRating || 0).toFixed(1),
      );

      product.averageRating = reviewSummary.averageRating;

      product.totalRatings = reviewSummary.totalReviews;

      // ======================================================
      // RATING BREAKDOWN
      // ======================================================

      const totalReviews = Number(reviewSummary.totalReviews || 0);

      reviewSummary.ratingBreakdown = [
        {
          star: 5,
          count: Number(reviewSummary.fiveStar || 0),
        },

        {
          star: 4,
          count: Number(reviewSummary.fourStar || 0),
        },

        {
          star: 3,
          count: Number(reviewSummary.threeStar || 0),
        },

        {
          star: 2,
          count: Number(reviewSummary.twoStar || 0),
        },

        {
          star: 1,
          count: Number(reviewSummary.oneStar || 0),
        },
      ].map((item) => ({
        ...item,

        percentage:
          totalReviews > 0 ? Math.round((item.count / totalReviews) * 100) : 0,
      }));

      // ======================================================
      // EXISTING CUSTOMER REVIEW
      // ======================================================

      let existingReview = null;

      if (currentUser) {
        existingReview = await Review.findOne({
          user: currentUser._id,

          product: product._id,

          isDeleted: false,
        })
          .select(
            "rating reviewTitle comment images status adminRemark createdAt updatedAt",
          )
          .lean();
      }

      // ======================================================
      // FEATURED PRODUCTS
      // ======================================================

      const featuredProducts = await Product.aggregate([
        {
          $match: {
            _id: {
              $ne: product._id,
            },

            isFeatured: true,

            isDeleted: false,

            approvalStatus: "approved",

            status: {
              $in: ["active", "out-of-stock"],
            },
          },
        },

        {
          $lookup: {
            from: "categories",

            localField: "category",

            foreignField: "_id",

            as: "category",
          },
        },

        {
          $unwind: {
            path: "$category",

            preserveNullAndEmptyArrays: false,
          },
        },

        {
          $lookup: {
            from: "brands",

            localField: "brand",

            foreignField: "_id",

            as: "brand",
          },
        },

        {
          $unwind: {
            path: "$brand",

            preserveNullAndEmptyArrays: false,
          },
        },

        {
          $match: {
            "category.status": "active",

            "category.isDeleted": false,

            "brand.status": "active",

            "brand.isDeleted": false,
          },
        },

        {
          $set: {
            sellingPrice: {
              $cond: [
                {
                  $and: [
                    {
                      $ne: ["$discountPrice", null],
                    },

                    {
                      $lt: ["$discountPrice", "$price"],
                    },
                  ],
                },

                "$discountPrice",

                "$price",
              ],
            },
          },
        },

        {
          $sample: {
            size: 10,
          },
        },
      ]);

      // ======================================================
      // FEATURED WISHLIST STATE
      // ======================================================

      if (currentUser) {
        const featuredIds = featuredProducts.map((item) => item._id);

        if (featuredIds.length > 0) {
          const featuredWishlist = await Wishlist.find({
            user: currentUser._id,

            product: {
              $in: featuredIds,
            },
          })
            .select("product")
            .lean();

          const featuredWishlistIds = new Set(
            featuredWishlist.map((item) => item.product.toString()),
          );

          featuredProducts.forEach((item) => {
            item.isWishlisted = featuredWishlistIds.has(item._id.toString());
          });
        }
      }

      // ======================================================
      // RENDER
      // ======================================================

      logger.info(
        `Product details loaded successfully. Product ID: ${product._id}`,
      );

      return res.status(httpStatusCode.OK).render("shop/product-details", {
        title: `${product.name} | Plantora`,

        product,

        hasDiscount,

        isWishlisted,

        cartQuantity,

        maxCartQuantity,

        reviews,

        reviewSummary,

        existingReview,

        featuredProducts,
      });
    } catch (error) {
      logger.error(
        `Show public product details failed: ${error.stack || error.message}`,
      );

      return res.redirect("/shop");
    }
  }
}

module.exports = new ShopController();
