const httpStatusCode = require("../utils/httpStatusCode");
const Product = require("../models/Product");

class HomeController {
  // ==========================================================
  // HOME PAGE
  // ==========================================================

  static async showHomePage(req, res, next) {
    try {
      const featuredProducts = await Product.aggregate([
        {
          $match: {
            isFeatured: true,
            approvalStatus: "approved",
            status: "active",
            isDeleted: false,
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
            preserveNullAndEmptyArrays: true,
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
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $sort: {
            publishedAt: -1,
          },
        },

        {
          $limit: 8,
        },
      ]);

      return res.status(httpStatusCode.OK).render("home/index", {
        title: "Plantora | Home",
        featuredProducts,
      });
    } catch (error) {
      return next(error);
    }
  }

  // ==========================================================
  // ABOUT PAGE
  // ==========================================================

  // static async showAboutPage(req, res, next) {
  //   try {
  //     return res.status(httpStatusCode.OK).render("/about", {
  //       title: "About Us | Plantora",
  //     });
  //   } catch (error) {
  //     return next(error);
  //   }
  // }

  // ==========================================================
  // CONTACT PAGE
  // ==========================================================

  static async showContactPage(req, res, next) {
    try {
      return res.status(httpStatusCode.OK).render("home/contact", {
        title: "Contact Us | Plantora",
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = HomeController;
