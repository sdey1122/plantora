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

class ReviewController {
  // Show product reviews page
  async showProductReviewsPage(req, res) {
    try {
      // Validate query
      const { error, value } = reviewQueryValidation.validate(req.query);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("back");
      }

      const { page, limit, search, rating, sortBy, sortOrder } = value;

      const productId = req.params.productId;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        req.flash("error", "Invalid product ID.");

        return res.redirect("back");
      }

      const matchStage = {
        product: new mongoose.Types.ObjectId(productId),

        status: "approved",

        isDeleted: false,
      };

      // Filter by rating
      if (rating) {
        matchStage.rating = rating;
      }

      // Search review title or comment
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

      const reviews = result[0].reviews;

      const totalReviews =
        result[0].totalReviews.length > 0 ? result[0].totalReviews[0].count : 0;

      const ratingSummary =
        result[0].ratingSummary.length > 0 ? result[0].ratingSummary[0] : null;

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

      req.flash("error", "Failed to load reviews.");

      return res.redirect("back");
    }
  }

  // Create review
  async createReview(req, res) {
    try {
      // Validate product ID
      if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
        req.flash("error", "Invalid product ID.");

        return res.redirect("back");
      }

      // Validate request body
      const { error, value } = createReviewValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("back");
      }

      const product = await Product.findById(req.params.productId);

      if (!product || product.isDeleted) {
        req.flash("error", "Product not found.");

        return res.redirect("back");
      }

      const existingReview = await Review.findOne({
        user: req.user._id,

        product: product._id,
      });

      if (existingReview) {
        req.flash("error", "You have already reviewed this product.");

        return res.redirect("back");
      }

      const verifiedPurchase = await Order.exists({
        user: req.user._id,

        "items.product": product._id,

        orderStatus: "delivered",
      });

      const review = await Review.create({
        user: req.user._id,

        product: product._id,

        rating: value.rating,

        reviewTitle: value.reviewTitle,

        comment: value.comment,

        images: value.images,

        isVerifiedPurchase: Boolean(verifiedPurchase),
      });

      await createAuditLog({
        user: req.user._id,

        action: "CREATE_REVIEW",

        resource: "Review",

        resourceId: review._id,

        details: `Review submitted for product "${product.productName}".`,
      });

      logger.info(
        `Review created. User: ${req.user.email}, Product: ${product.productName}`,
      );

      req.flash("success", "Review submitted successfully.");

      return res.redirect("back");
    } catch (error) {
      logger.error(`Create review failed: ${error.message}`);

      req.flash("error", "Failed to submit review.");

      return res.redirect("back");
    }
  }
  // Show edit review page
  async showEditReviewPage(req, res) {
    try {
      // Validate review ID
      const { error, value } = reviewIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("back");
      }

      const review = await Review.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(value.reviewId),

            user: new mongoose.Types.ObjectId(req.user._id),

            isDeleted: false,
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

            product: {
              _id: "$product._id",

              productName: "$product.productName",

              slug: "$product.slug",

              price: "$product.price",

              featuredImage: "$product.featuredImage",
            },
          },
        },
      ]);

      if (!review.length) {
        req.flash("error", "Review not found.");

        return res.redirect("back");
      }

      logger.info(
        `Customer opened review edit page. Review: ${review[0]._id}, User: ${req.user.email}`,
      );

      return res.status(httpStatusCode.OK).render("reviews/edit", {
        title: "Edit Review",

        review: review[0],
      });
    } catch (error) {
      logger.error(`Show edit review page failed: ${error.message}`);

      req.flash("error", "Failed to load review.");

      return res.redirect("back");
    }
  }

  // Update review
  async updateReview(req, res) {
    try {
      // Validate review ID
      const { error: idError, value: idValue } = reviewIdValidation.validate(
        req.params,
      );

      if (idError) {
        req.flash("error", idError.details[0].message);

        return res.redirect("back");
      }

      // Validate request body
      const { error, value } = updateReviewValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("back");
      }

      const review = await Review.findOne({
        _id: idValue.reviewId,

        user: req.user._id,

        isDeleted: false,
      });

      if (!review) {
        req.flash("error", "Review not found.");

        return res.redirect("back");
      }

      Object.assign(review, value);

      // Re-review after customer edits
      review.status = "pending";

      review.adminRemark = "";

      await review.save();

      await createAuditLog({
        user: req.user._id,

        action: "UPDATE_REVIEW",

        resource: "Review",

        resourceId: review._id,

        details: `Review updated by customer.`,
      });

      logger.info(
        `Review updated. Review: ${review._id}, User: ${req.user.email}`,
      );

      req.flash(
        "success",
        "Review updated successfully and sent for approval.",
      );

      return res.redirect(`/products/${review.product}`);
    } catch (error) {
      logger.error(`Update review failed: ${error.message}`);

      req.flash("error", "Failed to update review.");

      return res.redirect("back");
    }
  }
  // Delete review
  async deleteReview(req, res) {
    try {
      // Validate review ID
      const { error, value } = reviewIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("back");
      }

      const review = await Review.findOne({
        _id: value.reviewId,

        user: req.user._id,

        isDeleted: false,
      });

      if (!review) {
        req.flash("error", "Review not found.");

        return res.redirect("back");
      }

      review.isDeleted = true;

      review.deletedAt = new Date();

      await review.save();

      // Create audit log
      await createAuditLog({
        user: req.user._id,

        action: "DELETE_REVIEW",

        resource: "Review",

        resourceId: review._id,

        details: `Review deleted by customer.`,
      });

      logger.info(
        `Review deleted. Review: ${review._id}, User: ${req.user.email}`,
      );

      req.flash("success", "Review deleted successfully.");

      return res.redirect(`/products/${review.product}`);
    } catch (error) {
      logger.error(`Delete review failed: ${error.message}`);

      req.flash("error", "Failed to delete review.");

      return res.redirect("back");
    }
  }

  // Show reviews page
  async showReviewsPage(req, res) {
    try {
      // Validate query
      const { error, value } = reviewQueryValidation.validate(req.query);

      if (error) {
        req.flash("error", error.details[0].message);

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

      const matchStage = {
        isDeleted: false,
      };

      // Search review title or comment
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

      // Filter by rating
      if (rating) {
        matchStage.rating = rating;
      }

      // Filter by review status
      if (status) {
        matchStage.status = status;
      }

      // Filter by verified purchase
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

            user: {
              _id: "$user._id",

              name: "$user.name",

              email: "$user.email",
            },

            product: {
              _id: "$product._id",

              productName: "$product.productName",

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

      const reviews = result[0].reviews;

      const totalReviews =
        result[0].totalReviews.length > 0 ? result[0].totalReviews[0].count : 0;

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

      req.flash("error", "Failed to load reviews.");

      return res.redirect("/admin");
    }
  }
  // Show review details page
  async showReviewDetailsPage(req, res) {
    try {
      // Validate review ID
      const { error, value } = reviewIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin/reviews");
      }

      const review = await Review.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(value.reviewId),

            isDeleted: false,
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

              productName: "$product.productName",

              slug: "$product.slug",

              price: "$product.price",
            },
          },
        },
      ]);

      if (!review.length) {
        req.flash("error", "Review not found.");

        return res.redirect("/admin/reviews");
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

      req.flash("error", "Failed to load review details.");

      return res.redirect("/admin/reviews");
    }
  }

  // Update review status
  async updateReviewStatus(req, res) {
    try {
      // Validate review ID
      const { error: idError, value: idValue } = reviewIdValidation.validate(
        req.params,
      );

      if (idError) {
        req.flash("error", idError.details[0].message);

        return res.redirect("/admin/reviews");
      }

      // Validate request body
      const { error, value } = reviewStatusValidation.validate(req.body);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect(`/admin/reviews/${idValue.reviewId}`);
      }

      const review = await Review.findOne({
        _id: idValue.reviewId,

        isDeleted: false,
      });

      if (!review) {
        req.flash("error", "Review not found.");

        return res.redirect("/admin/reviews");
      }

      review.status = value.status;

      review.adminRemark = value.adminRemark;

      await review.save();

      // Create audit log
      await createAuditLog({
        user: req.user._id,

        action: "UPDATE_REVIEW_STATUS",

        resource: "Review",

        resourceId: review._id,

        details: `Review status updated to "${review.status}".`,
      });

      logger.info(
        `Review status updated. Review: ${review._id}, Status: ${review.status}, Admin: ${req.user.email}`,
      );

      req.flash("success", "Review status updated successfully.");

      return res.redirect(`/admin/reviews/${review._id}`);
    } catch (error) {
      logger.error(`Update review status failed: ${error.message}`);

      req.flash("error", "Failed to update review status.");

      return res.redirect("/admin/reviews");
    }
  }
  // Restore review
  async restoreReview(req, res) {
    try {
      // Validate review ID
      const { error, value } = reviewIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin/reviews");
      }

      const review = await Review.findOne({
        _id: value.reviewId,

        isDeleted: true,
      });

      if (!review) {
        req.flash("error", "Review not found.");

        return res.redirect("/admin/reviews");
      }

      review.isDeleted = false;

      review.deletedAt = null;

      await review.save();

      // Create audit log
      await createAuditLog({
        user: req.user._id,

        action: "RESTORE_REVIEW",

        resource: "Review",

        resourceId: review._id,

        details: "Review restored.",
      });

      logger.info(
        `Review restored. Review: ${review._id}, Admin: ${req.user.email}`,
      );

      req.flash("success", "Review restored successfully.");

      return res.redirect("/admin/reviews");
    } catch (error) {
      logger.error(`Restore review failed: ${error.message}`);

      req.flash("error", "Failed to restore review.");

      return res.redirect("/admin/reviews");
    }
  }

  // Permanently delete review
  async deleteReviewPermanently(req, res) {
    try {
      // Validate review ID
      const { error, value } = reviewIdValidation.validate(req.params);

      if (error) {
        req.flash("error", error.details[0].message);

        return res.redirect("/admin/reviews");
      }

      const review = await Review.findOne({
        _id: value.reviewId,

        isDeleted: true,
      });

      if (!review) {
        req.flash(
          "error",
          "Review not found or must be soft deleted before permanent deletion.",
        );

        return res.redirect("/admin/reviews");
      }

      await Review.deleteOne({
        _id: review._id,
      });

      // Create audit log
      await createAuditLog({
        user: req.user._id,

        action: "DELETE_REVIEW",

        resource: "Review",

        resourceId: review._id,

        details: "Review permanently deleted.",
      });

      logger.info(
        `Review permanently deleted. Review: ${review._id}, Admin: ${req.user.email}`,
      );

      req.flash("success", "Review permanently deleted successfully.");

      return res.redirect("/admin/reviews");
    } catch (error) {
      logger.error(`Delete review permanently failed: ${error.message}`);

      req.flash("error", "Failed to permanently delete review.");

      return res.redirect("/admin/reviews");
    }
  }
  // Mark review as helpful
  async markReviewHelpful(req, res) {
    try {
      // Validate review ID
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
        isDeleted: false,
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
      });
    } catch (error) {
      logger.error(`Mark review helpful failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,

        message: "Failed to mark review as helpful.",
      });
    }
  }

  // Remove helpful vote
  async removeHelpfulVote(req, res) {
    try {
      // Validate review ID
      const { error, value } = reviewIdValidation.validate(req.params);

      if (error) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,

          message: error.details[0].message,
        });
      }

      const review = await Review.findOne({
        _id: value.reviewId,

        isDeleted: false,
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

module.exports = new ReviewController();
