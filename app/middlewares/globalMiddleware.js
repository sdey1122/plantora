const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Notification = require("../models/Notification");

const globalMiddleware = async (req, res, next) => {
  try {
    res.locals.user = null;
    res.locals.currentRoute = req.path;
    res.locals.notificationCount = 0;

    const token = req.cookies?.accessToken;

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next();
    }

    res.locals.user = user;

    const unreadCount = await Notification.countDocuments({
      recipient: user._id,
      isRead: false,
      isDeleted: false,
    });

    res.locals.notificationCount = unreadCount;

    next();
  } catch (error) {
    res.locals.user = null;
    res.locals.notificationCount = 0;

    next();
  }
};

module.exports = globalMiddleware;
