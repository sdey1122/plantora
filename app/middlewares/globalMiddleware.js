const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Notification = require("../models/Notification");
const Cart = require("../models/Cart");

const globalMiddleware = async (req, res, next) => {
  try {
    // ==========================================================
    // DEFAULT GLOBAL VARIABLES
    // ==========================================================

    res.locals.user = null;

    res.locals.currentRoute = req.path;

    res.locals.notificationCount = 0;

    res.locals.cartCount = 0;

    // ==========================================================
    // ACCESS TOKEN
    // ==========================================================

    const token = req.cookies?.accessToken;

    if (!token) {
      return next();
    }

    // ==========================================================
    // VERIFY TOKEN
    // ==========================================================

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // ==========================================================
    // FIND USER
    // ==========================================================

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next();
    }

    res.locals.user = user;

    // ==========================================================
    // NOTIFICATION COUNT
    // ==========================================================

    const unreadCount = await Notification.countDocuments({
      recipient: user._id,
      isRead: false,
      isDeleted: false,
    });

    res.locals.notificationCount = unreadCount;

    // ==========================================================
    // CART COUNT
    //
    // Counts total quantity.
    //
    // Example:
    //
    // Product A = 2
    // Product B = 3
    //
    // Cart badge = 5
    // ==========================================================

    const cart = await Cart.findOne({
      user: user._id,
    }).select("items");

    if (cart && cart.items.length > 0) {
      res.locals.cartCount = cart.items.reduce((total, item) => {
        return total + Number(item.quantity || 0);
      }, 0);
    }

    // ==========================================================
    // NEXT
    // ==========================================================

    return next();
  } catch (error) {
    res.locals.user = null;

    res.locals.notificationCount = 0;

    res.locals.cartCount = 0;

    return next();
  }
};

module.exports = globalMiddleware;
