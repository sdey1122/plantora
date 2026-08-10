const mongoose = require("mongoose");

const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");
const ReviewHelpful = require("../models/ReviewHelpful");

const logger = require("../config/logger");

const httpStatusCode = require("../utils/httpStatusCode");

const createAuditLog = require("../utils/createAuditLog");

const {
  createReviewValidation,
  updateReviewValidation,
  reviewIdValidation,
  reviewQueryValidation,
  reviewStatusValidation,
} = require("../validations/reviewValidation");

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
    averageRating = Number(result[0].averageRating.toFixed(1));

    totalRatings = result[0].totalRatings;

    ratingBreakdown = {
      5: result[0].fiveStar,
      4: result[0].fourStar,
      3: result[0].threeStar,
      2: result[0].twoStar,
      1: result[0].oneStar,
    };
  }

  await Product.findByIdAndUpdate(
    productId,
    {
      averageRating,
      totalRatings,
    },
    {
      new: false,
    },
  );

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
      const { error, value } = reviewQueryValidation.validate(req.query);

      if (error) {
        logger.warn(`Invalid review query. Error: ${error.details[0].message}`);

        return res.redirect("/shop");
      }

      const { page, limit, search, rating, sortBy, sortOrder } = value;

      const productId = req.params.productId;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        logger.warn(
          `Invalid product ID while viewing reviews. Product: ${productId}`,
        );

        return res.redirect("/shop");
      }

      const matchStage = {
        product: new mongoose.Types.ObjectId(productId),
        status: "approved",
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
          $unwind: "$user",
        },

        {
          $project: {
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
              name: "$user.name",
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
            ],
          },
        },
      ]);

      const reviews = result[0]?.reviews || [];

      const totalReviews =
        result[0]?.totalReviews?.length > 0
          ? result[0].totalReviews[0].count
          : 0;

      const ratingSummary =
        result[0]?.ratingSummary?.length > 0
          ? result[0].ratingSummary[0]
          : {
              averageRating: 0,
              totalRatings: 0,
              fiveStar: 0,
              fourStar: 0,
              threeStar: 0,
              twoStar: 0,
              oneStar: 0,
            };

      logger.info(`Viewed product reviews. Product: ${productId}`);

      return res.status(httpStatusCode.OK).render("reviews/index", {
        title: "Product Reviews",

        productId,

        reviews,

        ratingSummary,

        filters: value,

        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalReviews / limit),
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
    let productId = req.params.productId;

    try {
      // ------------------------------------------------------
      // Admin cannot create review
      // ------------------------------------------------------

      if (req.user.role === "admin") {
        logger.warn(
          `Admin attempted to create review. Admin: ${req.user.email}`,
        );

        return res.redirect("/shop");
      }

      // ------------------------------------------------------
      // Validate product ID
      // ------------------------------------------------------

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        logger.warn(
          `Invalid product ID while creating review. Product: ${productId}`,
        );

        return res.redirect("/shop");
      }

      // ------------------------------------------------------
      // Validate body
      // ------------------------------------------------------

      const { error, value } = createReviewValidation.validate(req.body);

      if (error) {
        logger.warn(
          `Review validation failed. User: ${req.user.email}, Error: ${error.details[0].message}`,
        );

        const product = await Product.findById(productId).select("slug").lean();

        if (product?.slug) {
          return res.redirect(`/shop/product/${product.slug}#product-reviews`);
        }

        return res.redirect("/shop");
      }
      // ------------------------------------------------------
      // Product
      // ------------------------------------------------------

      const product = await Product.findById(productId);

      if (!product) {
        logger.warn(
          `Review attempted for unavailable product. Product: ${productId}`,
        );

        return res.redirect("/shop");
      }

      // ------------------------------------------------------
      // One review per user/product
      // ------------------------------------------------------

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

      // ------------------------------------------------------
      // Verified purchase
      // ------------------------------------------------------

      const verifiedPurchase = await Order.exists({
        user: req.user._id,
        "items.product": product._id,
        orderStatus: "delivered",
      });

      // ------------------------------------------------------
      // Create review
      // ------------------------------------------------------

      const review = await Review.create({
        user: req.user._id,

        product: product._id,

        rating: value.rating,

        reviewTitle: value.reviewTitle || "",

        comment: value.comment,

        images: value.images || [],

        isVerifiedPurchase: Boolean(verifiedPurchase),

        status: "approved",

        isDeleted: false,

        adminRemark: "",
      });

      // ------------------------------------------------------
      // Recalculate rating
      // ------------------------------------------------------

      await recalculateProductRating(product._id);

      // ------------------------------------------------------
      // Audit
      // ------------------------------------------------------

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
        `Review created successfully. User: ${req.user.email}, Product: ${product.name}, Verified Purchase: ${Boolean(
          verifiedPurchase,
        )}`,
      );

      // ------------------------------------------------------
      // IMPORTANT:
      // Go back to actual product page
      // ------------------------------------------------------

      return res.redirect(`/shop/product/${product.slug}#product-reviews`);
    } catch (error) {
      logger.error(`Create review failed: ${error.message}`);

      // If product ID is valid, return to product page
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
      const { error, value } = reviewIdValidation.validate(req.params);

      if (error) {
        logger.warn(
          `Invalid review ID while opening edit page. Error: ${error.details[0].message}`,
        );

        return res.redirect("/shop");
      }

      const review = await Review.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(value.reviewId),

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
          `Review not found while opening edit page. Review: ${value.reviewId}, User: ${req.user.email}`,
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

  async updateReview(req, res) {
    try {
      const { error: idError, value: idValue } = reviewIdValidation.validate(
        req.params,
      );

      if (idError) {
        logger.warn(
          `Invalid review ID while updating review. Error: ${idError.details[0].message}`,
        );

        return res.redirect("/shop");
      }

      const { error, value } = updateReviewValidation.validate(req.body);

      if (error) {
        logger.warn(
          `Review update validation failed. User: ${req.user.email}, Error: ${error.details[0].message}`,
        );

        return res.redirect("/shop");
      }

      const review = await Review.findOne({
        _id: idValue.reviewId,

        user: req.user._id,
      });

      if (!review) {
        logger.warn(
          `Review not found while updating. Review: ${idValue.reviewId}, User: ${req.user.email}`,
        );

        return res.redirect("/shop");
      }

      const productId = review.product;

      review.rating = value.rating;

      review.reviewTitle = value.reviewTitle || "";

      review.comment = value.comment;

      if (value.images !== undefined) {
        review.images = value.images;
      }

      review.status = "approved";

      review.adminRemark = "";

      await review.save();

      await recalculateProductRating(productId);

      // ------------------------------------------------------
      // Audit
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

      logger.info(
        `Review updated successfully. Review: ${review._id}, User: ${req.user.email}`,
      );

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
      const { error, value } = reviewQueryValidation.validate(req.query);

      if (error) {
        logger.warn(
          `Admin review query validation failed. Error: ${error.details[0].message}`,
        );

        return res.redirect("/admin");
      }

      const {
        page,
        limit,
        search,
        rating,
        status,
        verifiedPurchase,
        sortBy,
        sortOrder,
      } = value;

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
          ? result[0].totalReviews[0].count
          : 0;

      logger.info(`Admin viewed review list. Admin: ${req.user.email}`);

      return res.status(httpStatusCode.OK).render("admin/reviews/index", {
        title: "Manage Reviews",

        reviews,

        filters: value,

        pagination: {
          currentPage: page,

          totalPages: Math.ceil(totalReviews / limit),

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
      const { error, value } = reviewIdValidation.validate(req.params);

      if (error) {
        logger.warn(
          `Invalid review ID while viewing details. Error: ${error.details[0].message}`,
        );

        return res.redirect("/reviews/admin");
      }

      const review = await Review.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(value.reviewId),
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
          `Review not found while viewing admin details. Review: ${value.reviewId}`,
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
      const { error: idError, value: idValue } = reviewIdValidation.validate(
        req.params,
      );

      if (idError) {
        logger.warn(
          `Invalid review ID while updating status. Error: ${idError.details[0].message}`,
        );

        return res.redirect("/reviews/admin");
      }

      const { error, value } = reviewStatusValidation.validate(req.body);

      if (error) {
        logger.warn(
          `Review status validation failed. Admin: ${req.user.email}, Error: ${error.details[0].message}`,
        );

        return res.redirect(`/reviews/admin/${idValue.reviewId}`);
      }

      const review = await Review.findById(idValue.reviewId);

      if (!review) {
        logger.warn(
          `Review not found while updating status. Review: ${idValue.reviewId}`,
        );

        return res.redirect("/reviews/admin");
      }

      const oldStatus = review.status;

      review.status = value.status;

      review.adminRemark = value.adminRemark || "";

      await review.save();

      await recalculateProductRating(review.product);

      // ------------------------------------------------------
      // Audit
      // ------------------------------------------------------

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
      const { error, value } = reviewIdValidation.validate(req.params);

      if (error) {
        logger.warn(
          `Invalid review ID while permanently deleting review. Error: ${error.details[0].message}`,
        );

        return res.redirect("/reviews/admin");
      }

      const review = await Review.findById(value.reviewId);

      if (!review) {
        logger.warn(
          `Review not found while permanently deleting. Review: ${value.reviewId}`,
        );

        return res.redirect("/reviews/admin");
      }

      const productId = review.product;

      const reviewId = review._id;

      await Review.deleteOne({
        _id: reviewId,
      });

      await ReviewHelpful.deleteMany({
        review: reviewId,
      });

      await recalculateProductRating(productId);

      // ------------------------------------------------------
      // Audit
      // ------------------------------------------------------

      await createAuditLog({
        req,
        actor: req.user,

        module: "Review",

        action: "Delete Review",

        target: {
          model: "Review",
          id: reviewId,
          name: String(reviewId),
        },

        description: `${req.user.name} permanently deleted a review.`,
      });

      logger.info(
        `Review permanently deleted. Review: ${reviewId}, Admin: ${req.user.email}`,
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
      const { error, value } = reviewIdValidation.validate(req.params);

      if (error) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const review = await Review.findOne({
        _id: value.reviewId,

        status: "approved",
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

      review.helpfulCount += 1;

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
      const { error, value } = reviewIdValidation.validate(req.params);

      if (error) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,

          message: error.details[0].message,
        });
      }

      const review = await Review.findById(value.reviewId);

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

      review.helpfulCount = Math.max(0, review.helpfulCount - 1);

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
