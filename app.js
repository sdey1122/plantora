// Import core packages
const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const methodOverride = require("method-override");

// Load environment variables
dotenv.config();

// Import logger
const logger = require("./app/config/logger");

const globalMiddleware = require("./app/middlewares/globalMiddleware");

// Import routes
const homeRoutes = require("./app/routes/homeRoutes");
const authRoutes = require("./app/routes/authRoute");
const userRoutes = require("./app/routes/userRoute");
const categoryRoutes = require("./app/routes/categoryRoute");
const brandRoutes = require("./app/routes/brandRoute");
const productRoutes = require("./app/routes/productRoute");
const reviewRoutes = require("./app/routes/reviewRoute");
const wishlistRoutes = require("./app/routes/wishlistRoute");
const cartRoutes = require("./app/routes/cartRoute");
const couponRoutes = require("./app/routes/couponRoute");
const orderRoutes = require("./app/routes/orderRoute");
// const adminRoutes = require("./app/routes/adminRoute");
const adminDashboardRoute = require("./app/routes/adminDashboardRoute");
const sellerDashboardRoute = require("./app/routes/sellerDashboardRoute");
const notificationRoute = require("./app/routes/notificationRoute");

// Import middlewares
const notFoundMiddleware = require("./app/middlewares/notFoundMiddleware");
const errorMiddleware = require("./app/middlewares/errorMiddleware");

// Create Express application
const app = express();

app.use(methodOverride("_method"));

// Trust proxy
app.set("trust proxy", 1);

// Configure EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// HTTP request logging
if (process.env.NODE_ENV !== "production") {
  app.use(
    morgan("dev", {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    }),
  );
}

// Parse JSON requests
app.use(express.json());

// Parse form requests
app.use(
  express.urlencoded({
    extended: true,
  }),
);

// Parse cookies
app.use(cookieParser());

// Global EJS variables
app.use((req, res, next) => {
  res.locals.currentRoute = req.path;
  next();
});

// Compress responses
app.use(compression());

// Prevent MongoDB query injection
// app.use(mongoSanitize());

// Prevent HTTP parameter pollution
app.use(hpp());

// Enable CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(globalMiddleware);

// Home page

// Public Website
app.use("/", homeRoutes);

// Authentication
app.use("/auth", authRoutes);

// Admin User Management
app.use("/admin/users", userRoutes);

// Category
app.use("/categories", categoryRoutes);

// Brand
app.use("/brands", brandRoutes);

// Product
app.use("/products", productRoutes);

// Review
app.use("/reviews", reviewRoutes);

// Wishlist
app.use("/wishlist", wishlistRoutes);

// Cart
app.use("/cart", cartRoutes);

// Coupon
app.use("/coupons", couponRoutes);

// Order
app.use("/orders", orderRoutes);

// Admin
// app.use("/admin", adminRoutes);

// Admin Dashboard
app.use("/admin/dashboard", adminDashboardRoute);

// Seller Dashboard
app.use("/seller/dashboard", sellerDashboardRoute);

// Notification
app.use("/", notificationRoute);

// Handle unknown routes
app.use(notFoundMiddleware);

// Handle errors
app.use(errorMiddleware);

// Export application
module.exports = app;
