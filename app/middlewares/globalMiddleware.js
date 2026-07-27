const jwt = require("jsonwebtoken");
const User = require("../models/User");

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

    res.locals.user = user || null;

    next();
  } catch (error) {
    res.locals.user = null;
    next();
  }
};

module.exports = globalMiddleware;
