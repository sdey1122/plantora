const mongoose = require("mongoose");

const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");
const ReviewHelpful = require("../models/ReviewHelpful");

const logger = require("../config/logger");

const httpStatusCode = require("../utils/httpStatusCode");

const createAuditLog = require("../utils/createAuditLog");

// ==========================================================
// RECALCULATE PRODUCT RATING
// ==========================================================

const recalculateProductRating = async (productId) => {
  const result = await Review.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),

        status: "approved",

        isDeleted: {
          $ne: true,
        },
      },
    },

    {
      $group: {
        _id: null,

        averageRating: {
          $avg: "$rating",
        },

        totalRatings: {
          $sum: 1,
        },

        fiveStar: {
          $sum: {
            $cond: [{ $eq: ["$rating", 5] }, 1, 0],
          },
        },

        fourStar: {
          $sum: {
            $cond: [{ $eq: ["$rating", 4] }, 1, 0],
          },
        },

        threeStar: {
          $sum: {
            $cond: [{ $eq: ["$rating", 3] }, 1, 0],
          },
        },

        twoStar: {
          $sum: {
            $cond: [{ $eq: ["$rating", 2] }, 1, 0],
          },
        },

        oneStar: {
          $sum: {
            $cond: [{ $eq: ["$rating", 1] }, 1, 0],
          },
        },
      },
    },
  ]);

  let averageRating = 0;

  let totalRatings = 0;

  let ratingBreakdown = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  if (result.length > 0) {
    averageRating = Number(Number(result[0].averageRating || 0).toFixed(1));

    totalRatings = Number(result[0].totalRatings || 0);

    ratingBreakdown = {
      5: Number(result[0].fiveStar || 0),
      4: Number(result[0].fourStar || 0),
      3: Number(result[0].threeStar || 0),
      2: Number(result[0].twoStar || 0),
      1: Number(result[0].oneStar || 0),
    };
  }

  await Product.findByIdAndUpdate(productId, {
    averageRating,
    totalRatings,
  });

  return {
    averageRating,
    totalRatings,
    ratingBreakdown,
  };
};

// ==========================================================
// REVIEW CONTROLLER
// ==========================================================

class ReviewController {
  // ========================================================
  // SHOW PRODUCT REVIEWS PAGE
  // ========================================================

  async showProductReviewsPage(req, res) {
    try {
      const productId = req.params.productId;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        logger.warn(
          `Invalid product ID while viewing reviews. Product: ${productId}`,
        );

        return res.redirect("/shop");
      }

      const page = Math.max(1, parseInt(req.query.page, 10) || 1);

      const limit = Math.min(
        50,
        Math.max(1, parseInt(req.query.limit, 10) || 10),
      );

      const search =
        typeof req.query.search === "string" ? req.query.search.trim() : "";

      const rating =
        req.query.rating &&
        Number.isInteger(Number(req.query.rating)) &&
        Number(req.query.rating) >= 1 &&
        Number(req.query.rating) <= 5
          ? Number(req.query.rating)
          : null;

      const allowedSortFields = [
        "createdAt",
        "updatedAt",
        "rating",
        "helpfulCount",
      ];

      const sortBy = allowedSortFields.includes(req.query.sortBy)
        ? req.query.sortBy
        : "createdAt";

      const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

      const matchStage = {
        product: new mongoose.Types.ObjectId(productId),

        status: "approved",

        isDeleted: {
          $ne: true,
        },
      };

      if (rating) {
        matchStage.rating = rating;
      }

      if (search) {
        matchStage.$or = [
          {
            reviewTitle: {
              $regex: search,
              $options: "i",
            },
          },

          {
            comment: {
              $regex: search,
              $options: "i",
            },
          },
        ];
      }

      const result = await Review.aggregate([
        {
          $match: matchStage,
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
            [sortBy]: sortOrder === "asc" ? 1 : -1,
          },
        },

        {
          $facet: {
            reviews: [
              {
                $skip: (page - 1) * limit,
              },

              {
                $limit: limit,
              },
            ],

            totalReviews: [
              {
                $count: "count",
              },
            ],

            ratingSummary: [
              {
                $group: {
                  _id: null,

                  averageRating: {
                    $avg: "$rating",
                  },

                  totalRatings: {
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

      const reviews = result[0]?.reviews || [];

      const totalReviews =
        result[0]?.totalReviews?.length > 0
          ? Number(result[0].totalReviews[0].count)
          : 0;

      const summary = result[0]?.ratingSummary?.[0];

      const ratingSummary = {
        averageRating: Number(Number(summary?.averageRating || 0).toFixed(1)),

        totalRatings: Number(summary?.totalRatings || 0),

        fiveStar: Number(summary?.fiveStar || 0),

        fourStar: Number(summary?.fourStar || 0),

        threeStar: Number(summary?.threeStar || 0),

        twoStar: Number(summary?.twoStar || 0),

        oneStar: Number(summary?.oneStar || 0),
      };

      logger.info(`Viewed product reviews. Product: ${productId}`);

      return res.status(httpStatusCode.OK).render("reviews/index", {
        title: "Product Reviews",

        productId,

        reviews,

        ratingSummary,

        filters: {
          page,
          limit,
          search,
          rating,
          sortBy,
          sortOrder,
        },

        pagination: {
          currentPage: page,

          totalPages: totalReviews > 0 ? Math.ceil(totalReviews / limit) : 1,

          totalReviews,

          limit,
        },
      });
    } catch (error) {
      logger.error(`Show product reviews failed: ${error.message}`);

      return res.redirect("/shop");
    }
  }

  // ========================================================
  // CREATE REVIEW
  // CUSTOMER + SELLER
  // ========================================================

  async createReview(req, res) {
    const productId = req.params.productId;

    try {
      if (!req.user || req.user.role === "admin") {
        logger.warn(
          `Unauthorized review creation attempt. User: ${
            req.user?.email || "Unknown"
          }`,
        );

        return res.redirect("/shop");
      }

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        logger.warn(
          `Invalid product ID while creating review. Product: ${productId}`,
        );

        return res.redirect("/shop");
      }

      const rating = Number(req.body.rating);

      const reviewTitle =
        typeof req.body.reviewTitle === "string"
          ? req.body.reviewTitle.trim()
          : "";

      const comment =
        typeof req.body.comment === "string" ? req.body.comment.trim() : "";

      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        logger.warn(
          `Invalid review rating. User: ${req.user.email}, Rating: ${req.body.rating}`,
        );

        return res.redirect(
          `/shop/product/${req.body.slug || ""}#product-reviews`,
        );
      }

      if (!comment) {
        logger.warn(
          `Empty review comment. User: ${req.user.email}, Product: ${productId}`,
        );

        const product = await Product.findById(productId).select("slug").lean();

        if (product?.slug) {
          return res.redirect(`/shop/product/${product.slug}#product-reviews`);
        }

        return res.redirect("/shop");
      }

      if (comment.length > 2000) {
        logger.warn(
          `Review comment too long. User: ${req.user.email}, Product: ${productId}`,
        );

        const product = await Product.findById(productId).select("slug").lean();

        if (product?.slug) {
          return res.redirect(`/shop/product/${product.slug}#product-reviews`);
        }

        return res.redirect("/shop");
      }

      if (reviewTitle.length > 120) {
        logger.warn(
          `Review title too long. User: ${req.user.email}, Product: ${productId}`,
        );

        const product = await Product.findById(productId).select("slug").lean();

        if (product?.slug) {
          return res.redirect(`/shop/product/${product.slug}#product-reviews`);
        }

        return res.redirect("/shop");
      }

      const product = await Product.findById(productId);

      if (!product) {
        logger.warn(
          `Review attempted for unavailable product. Product: ${productId}`,
        );

        return res.redirect("/shop");
      }

      const existingReview = await Review.findOne({
        user: req.user._id,

        product: product._id,
      });

      if (existingReview) {
        logger.warn(
          `Duplicate review attempt. User: ${req.user.email}, Product: ${product.name}`,
        );

        return res.redirect(`/shop/product/${product.slug}#product-reviews`);
      }

      const verifiedPurchase = await Order.exists({
        user: req.user._id,

        "items.product": product._id,

        orderStatus: "delivered",
      });

      const review = await Review.create({
        user: req.user._id,

        product: product._id,

        rating,

        reviewTitle,

        comment,

        images: [],

        isVerifiedPurchase: Boolean(verifiedPurchase),

        status: "approved",

        adminRemark: "",
      });

      await recalculateProductRating(product._id);

      await createAuditLog({
        req,

        actor: req.user,

        module: "Review",

        action: "Create Review",

        target: {
          model: "Review",

          id: review._id,

          name: product.name,
        },

        description: `${req.user.name} submitted a review for product '${product.name}'.`,
      });

      logger.info(
        `Review created successfully. User: ${req.user.email}, Product: ${product.name}, Rating: ${rating}, Verified Purchase: ${Boolean(
          verifiedPurchase,
        )}`,
      );

      return res.redirect(`/shop/product/${product.slug}#product-reviews`);
    } catch (error) {
      if (error.code === 11000) {
        logger.warn(
          `Duplicate review prevented by database index. User: ${req.user?.email}, Product: ${productId}`,
        );

        if (mongoose.Types.ObjectId.isValid(productId)) {
          const product = await Product.findById(productId)
            .select("slug")
            .lean();

          if (product?.slug) {
            return res.redirect(
              `/shop/product/${product.slug}#product-reviews`,
            );
          }
        }

        return res.redirect("/shop");
      }

      logger.error(`Create review failed: ${error.message}`);

      if (mongoose.Types.ObjectId.isValid(productId)) {
        const product = await Product.findById(productId).select("slug").lean();

        if (product?.slug) {
          return res.redirect(`/shop/product/${product.slug}#product-reviews`);
        }
      }

      return res.redirect("/shop");
    }
  }

  // ========================================================
  // SHOW EDIT REVIEW PAGE
  // CUSTOMER + SELLER
  // ========================================================

  async showEditReviewPage(req, res) {
    try {
      const reviewId = req.params.reviewId;

      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        logger.warn(
          `Invalid review ID while opening edit page. Review: ${reviewId}`,
        );

        return res.redirect("/shop");
      }

      const review = await Review.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(reviewId),

            user: new mongoose.Types.ObjectId(req.user._id),
          },
        },

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
          $project: {
            _id: 1,

            rating: 1,

            reviewTitle: 1,

            comment: 1,

            images: 1,

            status: 1,

            adminRemark: 1,

            createdAt: 1,

            updatedAt: 1,

            product: {
              _id: "$product._id",

              name: "$product.name",

              slug: "$product.slug",

              price: "$product.price",

              images: "$product.images",
            },
          },
        },
      ]);

      if (!review.length) {
        logger.warn(
          `Review not found while opening edit page. Review: ${reviewId}, User: ${req.user.email}`,
        );

        return res.redirect("/shop");
      }

      logger.info(
        `Customer/seller opened review edit page. Review: ${review[0]._id}, User: ${req.user.email}`,
      );

      return res.status(httpStatusCode.OK).render("reviews/edit", {
        title: "Edit Review",

        review: review[0],
      });
    } catch (error) {
      logger.error(`Show edit review page failed: ${error.message}`);

      return res.redirect("/shop");
    }
  }

  // ========================================================
  // UPDATE REVIEW
  // CUSTOMER + SELLER
  // ONLY OWN REVIEW
  // ========================================================

  // ========================================================
  // UPDATE REVIEW
  // CUSTOMER + SELLER
  // ONLY OWN REVIEW
  // ========================================================

  async updateReview(req, res) {
    try {
      const reviewId = req.params.reviewId;

      // ------------------------------------------------------
      // VALIDATE REVIEW ID
      // ------------------------------------------------------

      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        logger.warn(
          `Invalid review ID while updating review. Review: ${reviewId}`,
        );

        return res.redirect("/shop");
      }

      // ------------------------------------------------------
      // FORM DATA
      // ------------------------------------------------------

      const rating = Number(req.body.rating);

      const reviewTitle =
        typeof req.body.reviewTitle === "string"
          ? req.body.reviewTitle.trim()
          : "";

      const comment =
        typeof req.body.comment === "string" ? req.body.comment.trim() : "";

      // ------------------------------------------------------
      // BASIC VALIDATION
      // ------------------------------------------------------

      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        logger.warn(
          `Invalid review rating during update. User: ${req.user.email}, Review: ${reviewId}`,
        );

        return res.redirect("/shop");
      }

      // ------------------------------------------------------
      // REVIEW TITLE LENGTH
      // ------------------------------------------------------

      if (reviewTitle.length > 120) {
        logger.warn(
          `Review title too long during update. User: ${req.user.email}, Review: ${reviewId}`,
        );

        return res.redirect("/shop");
      }

      // ------------------------------------------------------
      // COMMENT VALIDATION
      // ------------------------------------------------------

      if (!comment) {
        logger.warn(
          `Empty review comment during update. User: ${req.user.email}, Review: ${reviewId}`,
        );

        return res.redirect("/shop");
      }

      if (comment.length > 2000) {
        logger.warn(
          `Review comment too long during update. User: ${req.user.email}, Review: ${reviewId}`,
        );

        return res.redirect("/shop");
      }

      // ------------------------------------------------------
      // FIND REVIEW
      // ------------------------------------------------------

      const review = await Review.findOne({
        _id: reviewId,
        user: req.user._id,
      });

      if (!review) {
        logger.warn(
          `Review not found while updating. Review: ${reviewId}, User: ${req.user.email}`,
        );

        return res.redirect("/shop");
      }

      // ------------------------------------------------------
      // STORE PRODUCT ID
      // ------------------------------------------------------

      const productId = review.product;

      // ------------------------------------------------------
      // UPDATE REVIEW
      // ------------------------------------------------------

      review.rating = rating;

      review.reviewTitle = reviewTitle;

      review.comment = comment;

      review.status = "approved";

      review.adminRemark = "";

      await review.save();

      // ------------------------------------------------------
      // RECALCULATE PRODUCT RATING
      // ------------------------------------------------------

      await recalculateProductRating(productId);

      // ------------------------------------------------------
      // AUDIT LOG
      // ------------------------------------------------------

      await createAuditLog({
        req,

        actor: req.user,

        module: "Review",

        action: "Update Review",

        target: {
          model: "Review",

          id: review._id,

          name: String(review._id),
        },

        description: `${req.user.name} updated their review.`,
      });

      // ------------------------------------------------------
      // SUCCESS LOG
      // ------------------------------------------------------

      logger.info(
        `Review updated successfully. Review: ${review._id}, User: ${req.user.email}, Rating: ${rating}, Title: ${reviewTitle}`,
      );

      // ------------------------------------------------------
      // GET PRODUCT SLUG
      // ------------------------------------------------------

      const product = await Product.findById(productId).select("slug").lean();

      // ------------------------------------------------------
      // REDIRECT
      // ------------------------------------------------------

      if (product?.slug) {
        return res.redirect(`/shop/product/${product.slug}#product-reviews`);
      }

      return res.redirect("/shop");
    } catch (error) {
      logger.error(`Update review failed: ${error.message}`);

      return res.redirect("/shop");
    }
  }
  // ========================================================
  // SHOW ADMIN REVIEWS PAGE
  // ========================================================

  async showReviewsPage(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);

      const limit = Math.min(
        50,
        Math.max(1, parseInt(req.query.limit, 10) || 10),
      );

      const search =
        typeof req.query.search === "string" ? req.query.search.trim() : "";

      const rating =
        req.query.rating &&
        Number(req.query.rating) >= 1 &&
        Number(req.query.rating) <= 5
          ? Number(req.query.rating)
          : null;

      const allowedStatuses = ["pending", "approved", "rejected"];

      const status = allowedStatuses.includes(req.query.status)
        ? req.query.status
        : null;

      let verifiedPurchase;

      if (req.query.verifiedPurchase === "true") {
        verifiedPurchase = true;
      }

      if (req.query.verifiedPurchase === "false") {
        verifiedPurchase = false;
      }

      const allowedSortFields = [
        "createdAt",
        "updatedAt",
        "rating",
        "helpfulCount",
      ];

      const sortBy = allowedSortFields.includes(req.query.sortBy)
        ? req.query.sortBy
        : "createdAt";

      const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

      const matchStage = {};

      if (search) {
        matchStage.$or = [
          {
            reviewTitle: {
              $regex: search,
              $options: "i",
            },
          },

          {
            comment: {
              $regex: search,
              $options: "i",
            },
          },
        ];
      }

      if (rating) {
        matchStage.rating = rating;
      }

      if (status) {
        matchStage.status = status;
      }

      if (verifiedPurchase !== undefined) {
        matchStage.isVerifiedPurchase = verifiedPurchase;
      }

      const result = await Review.aggregate([
        {
          $match: matchStage,
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
          $unwind: "$user",
        },

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
          $project: {
            _id: 1,

            rating: 1,

            reviewTitle: 1,

            comment: 1,

            status: 1,

            helpfulCount: 1,

            isVerifiedPurchase: 1,

            createdAt: 1,

            updatedAt: 1,

            user: {
              _id: "$user._id",

              name: "$user.name",

              email: "$user.email",
            },

            product: {
              _id: "$product._id",

              name: "$product.name",

              slug: "$product.slug",
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
            reviews: [
              {
                $skip: (page - 1) * limit,
              },

              {
                $limit: limit,
              },
            ],

            totalReviews: [
              {
                $count: "count",
              },
            ],
          },
        },
      ]);

      const reviews = result[0]?.reviews || [];

      const totalReviews =
        result[0]?.totalReviews?.length > 0
          ? Number(result[0].totalReviews[0].count)
          : 0;

      logger.info(`Admin viewed review list. Admin: ${req.user.email}`);

      return res.status(httpStatusCode.OK).render("admin/reviews/index", {
        title: "Manage Reviews",

        reviews,

        filters: {
          page,
          limit,
          search,
          rating,
          status,
          verifiedPurchase,
          sortBy,
          sortOrder,
        },

        pagination: {
          currentPage: page,

          totalPages: totalReviews > 0 ? Math.ceil(totalReviews / limit) : 1,

          totalReviews,

          limit,
        },
      });
    } catch (error) {
      logger.error(`Show reviews failed: ${error.message}`);

      return res.redirect("/admin");
    }
  }

  // ========================================================
  // SHOW ADMIN REVIEW DETAILS
  // ========================================================

  async showReviewDetailsPage(req, res) {
    try {
      const reviewId = req.params.reviewId;

      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        logger.warn(
          `Invalid review ID while viewing details. Review: ${reviewId}`,
        );

        return res.redirect("/reviews/admin");
      }

      const review = await Review.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(reviewId),
          },
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
          $unwind: "$user",
        },

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
          $project: {
            _id: 1,

            rating: 1,

            reviewTitle: 1,

            comment: 1,

            images: 1,

            isVerifiedPurchase: 1,

            status: 1,

            adminRemark: 1,

            helpfulCount: 1,

            createdAt: 1,

            updatedAt: 1,

            user: {
              _id: "$user._id",

              name: "$user.name",

              email: "$user.email",
            },

            product: {
              _id: "$product._id",

              name: "$product.name",

              slug: "$product.slug",

              price: "$product.price",
            },
          },
        },
      ]);

      if (!review.length) {
        logger.warn(
          `Review not found while viewing admin details. Review: ${reviewId}`,
        );

        return res.redirect("/reviews/admin");
      }

      logger.info(
        `Admin viewed review details. Review: ${review[0]._id}, Admin: ${req.user.email}`,
      );

      return res.status(httpStatusCode.OK).render("admin/reviews/details", {
        title: "Review Details",

        review: review[0],
      });
    } catch (error) {
      logger.error(`Show review details failed: ${error.message}`);

      return res.redirect("/reviews/admin");
    }
  }

  // ========================================================
  // UPDATE REVIEW STATUS
  // ADMIN
  // ========================================================

  async updateReviewStatus(req, res) {
    try {
      const reviewId = req.params.reviewId;

      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        logger.warn(
          `Invalid review ID while updating status. Review: ${reviewId}`,
        );

        return res.redirect("/reviews/admin");
      }

      const allowedStatuses = ["pending", "approved", "rejected"];

      const status = req.body.status;

      const adminRemark =
        typeof req.body.adminRemark === "string"
          ? req.body.adminRemark.trim()
          : "";

      if (!allowedStatuses.includes(status)) {
        logger.warn(
          `Invalid review status. Admin: ${req.user.email}, Status: ${status}`,
        );

        return res.redirect(`/reviews/admin/${reviewId}`);
      }

      const review = await Review.findById(reviewId);

      if (!review) {
        logger.warn(
          `Review not found while updating status. Review: ${reviewId}`,
        );

        return res.redirect("/reviews/admin");
      }

      const oldStatus = review.status;

      review.status = status;

      review.adminRemark = adminRemark;

      await review.save();

      await recalculateProductRating(review.product);

      await createAuditLog({
        req,

        actor: req.user,

        module: "Review",

        action: "Update Review Status",

        target: {
          model: "Review",

          id: review._id,

          name: String(review._id),
        },

        description: `${req.user.name} changed review status from '${oldStatus}' to '${review.status}'.`,
      });

      logger.info(
        `Review status updated. Review: ${review._id}, Status: ${review.status}, Admin: ${req.user.email}`,
      );

      return res.redirect(`/reviews/admin/${review._id}`);
    } catch (error) {
      logger.error(`Update review status failed: ${error.message}`);

      return res.redirect("/reviews/admin");
    }
  }

  // ========================================================
  // PERMANENT DELETE REVIEW
  // ADMIN ONLY
  // ========================================================

  async deleteReviewPermanently(req, res) {
    try {
      const reviewId = req.params.reviewId;

      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        logger.warn(
          `Invalid review ID while permanently deleting review. Review: ${reviewId}`,
        );

        return res.redirect("/reviews/admin");
      }

      const review = await Review.findById(reviewId);

      if (!review) {
        logger.warn(
          `Review not found while permanently deleting. Review: ${reviewId}`,
        );

        return res.redirect("/reviews/admin");
      }

      const productId = review.product;

      const deletedReviewId = review._id;

      await Review.deleteOne({
        _id: deletedReviewId,
      });

      await ReviewHelpful.deleteMany({
        review: deletedReviewId,
      });

      await recalculateProductRating(productId);

      await createAuditLog({
        req,

        actor: req.user,

        module: "Review",

        action: "Delete Review",

        target: {
          model: "Review",

          id: deletedReviewId,

          name: String(deletedReviewId),
        },

        description: `${req.user.name} permanently deleted a review.`,
      });

      logger.info(
        `Review permanently deleted. Review: ${deletedReviewId}, Admin: ${req.user.email}`,
      );

      return res.redirect("/reviews/admin");
    } catch (error) {
      logger.error(`Delete review permanently failed: ${error.message}`);

      return res.redirect("/reviews/admin");
    }
  }

  // ========================================================
  // MARK REVIEW AS HELPFUL
  // CUSTOMER + SELLER
  // ========================================================

  async markReviewHelpful(req, res) {
    try {
      const reviewId = req.params.reviewId;

      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        logger.warn(
          `Invalid review ID while marking helpful. Review: ${reviewId}`,
        );

        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,

          message: "Invalid review ID.",
        });
      }

      const review = await Review.findOne({
        _id: reviewId,

        status: "approved",

        isDeleted: {
          $ne: true,
        },
      });

      if (!review) {
        return res.status(httpStatusCode.NOT_FOUND).json({
          success: false,

          message: "Review not found.",
        });
      }

      const existingVote = await ReviewHelpful.findOne({
        user: req.user._id,

        review: review._id,
      });

      if (existingVote) {
        return res.status(httpStatusCode.CONFLICT).json({
          success: false,

          message: "You have already marked this review as helpful.",
        });
      }

      await ReviewHelpful.create({
        user: req.user._id,

        review: review._id,
      });

      review.helpfulCount = Number(review.helpfulCount || 0) + 1;

      await review.save();

      logger.info(
        `Review marked helpful. Review: ${review._id}, User: ${req.user.email}`,
      );

      return res.status(httpStatusCode.OK).json({
        success: true,

        message: "Review marked as helpful.",

        helpfulCount: review.helpfulCount,
      });
    } catch (error) {
      logger.error(`Mark review helpful failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to mark review as helpful.",
      });
    }
  }

  // ========================================================
  // REMOVE HELPFUL VOTE
  // CUSTOMER + SELLER
  // ========================================================

  async removeHelpfulVote(req, res) {
    try {
      const reviewId = req.params.reviewId;

      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        logger.warn(
          `Invalid review ID while removing helpful vote. Review: ${reviewId}`,
        );

        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,

          message: "Invalid review ID.",
        });
      }

      const review = await Review.findById(reviewId);

      if (!review) {
        return res.status(httpStatusCode.NOT_FOUND).json({
          success: false,

          message: "Review not found.",
        });
      }

      const existingVote = await ReviewHelpful.findOne({
        user: req.user._id,

        review: review._id,
      });

      if (!existingVote) {
        return res.status(httpStatusCode.NOT_FOUND).json({
          success: false,

          message: "Helpful vote not found.",
        });
      }

      await ReviewHelpful.deleteOne({
        _id: existingVote._id,
      });

      review.helpfulCount = Math.max(0, Number(review.helpfulCount || 0) - 1);

      await review.save();

      logger.info(
        `Helpful vote removed. Review: ${review._id}, User: ${req.user.email}`,
      );

      return res.status(httpStatusCode.OK).json({
        success: true,

        message: "Helpful vote removed successfully.",

        helpfulCount: review.helpfulCount,
      });
    } catch (error) {
      logger.error(`Remove helpful vote failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to remove helpful vote.",
      });
    }
  }
}

// ==========================================================
// EXPORT
// ==========================================================

module.exports = new ReviewController();
