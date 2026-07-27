const httpStatusCode = require("../utils/httpStatusCode");

class HomeController {
  // Home Page
  static async showHomePage(req, res, next) {
    try {
      return res.status(httpStatusCode.OK).render("home/index", {
        title: "Plantora | Home",
      });
    } catch (error) {
      return next(error);
    }
  }

  // About Page
  static async showAboutPage(req, res, next) {
    try {
      return res.status(httpStatusCode.OK).render("home/about", {
        title: "About Us | Plantora",
      });
    } catch (error) {
      return next(error);
    }
  }

  // Contact Page
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
