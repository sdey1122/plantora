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

// Passport
const passport = require("./app/config/passport");

const globalMiddleware = require("./app/middlewares/globalMiddleware");
const ShopController = require("./app/controllers/ShopController");

// Import routes
const homeRoutes = require("./app/routes/homeRoutes");
const newsletterRoute = require("./app/routes/newsletterRoute");
const shopRoutes = require("./app/routes/shopRoute");

const authRoutes = require("./app/routes/authRoute");
const userRoutes = require("./app/routes/userRoute");
const aboutRoutes = require("./app/routes/aboutRoute");
const contactRoutes = require("./app/routes/contactRoute");
const categoryRoutes = require("./app/routes/categoryRoute");
const brandRoutes = require("./app/routes/brandRoute");
const productRoutes = require("./app/routes/productRoute");
const reviewRoutes = require("./app/routes/reviewRoute");
const wishlistRoutes = require("./app/routes/wishlistRoute");
const cartRoutes = require("./app/routes/cartRoute");
const checkoutRoutes = require("./app/routes/checkoutRoute");
const addressRoutes = require("./app/routes/addressRoute");

const paymentRoutes = require("./app/routes/paymentRoute");
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

app.use(methodOverride("_method"));

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

// Passport
app.use(passport.initialize());

// Home page
app.use("/newsletter", newsletterRoute);

// About
app.use("/about", aboutRoutes);

// Contact

app.use("/contact", contactRoutes);

// Public Website
app.use("/", homeRoutes);

// Shop page
app.use("/shop", shopRoutes);

// Product details
app.get("/products/:slug", ShopController.showProductDetails);

// Authentication
app.use("/auth", authRoutes);

// Admin User Management
app.use("/admin/users", userRoutes);

// Category
app.use("/admin/categories", categoryRoutes);

// Brand
app.use("/admin/brands", brandRoutes);

// Admin Product Management
app.use("/admin/products", productRoutes);

// Review
app.use("/reviews", reviewRoutes);

// Wishlist
app.use("/wishlist", wishlistRoutes);

// Cart
app.use("/cart", cartRoutes);

// Addresses
app.use("/addresses", addressRoutes);

// Checkout
app.use("/checkout", checkoutRoutes);

// Coupon
app.use("/coupons", couponRoutes);

// Payment
// Order
app.use("/payment", paymentRoutes);

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

// // ==========================================================
// // DIAGNOSTIC APP.JS
// // ==========================================================

// console.log("🔥 APP: STARTED");

// // Import core packages
// const express = require("express");
// console.log("✅ APP: express loaded");

// const path = require("path");
// console.log("✅ APP: path loaded");

// const dotenv = require("dotenv");
// console.log("✅ APP: dotenv loaded");

// const morgan = require("morgan");
// console.log("✅ APP: morgan loaded");

// const cors = require("cors");
// console.log("✅ APP: cors loaded");

// const compression = require("compression");
// console.log("✅ APP: compression loaded");

// const cookieParser = require("cookie-parser");
// console.log("✅ APP: cookie-parser loaded");

// const mongoSanitize = require("express-mongo-sanitize");
// console.log("✅ APP: mongo-sanitize loaded");

// const hpp = require("hpp");
// console.log("✅ APP: hpp loaded");

// const methodOverride = require("method-override");
// console.log("✅ APP: method-override loaded");

// console.log("🔥 APP: ALL CORE PACKAGES LOADED");

// // ==========================================================
// // LOAD ENVIRONMENT VARIABLES
// // ==========================================================

// dotenv.config();

// console.log("✅ APP: dotenv.config() completed");

// // ==========================================================
// // LOGGER
// // ==========================================================

// const logger = require("./app/config/logger");

// console.log("✅ APP: logger loaded");

// // // ==========================================================
// // // PASSPORT
// // // ==========================================================

// // const passport = require("./app/config/passport");

// // console.log("✅ APP: passport loaded");

// // ==========================================================
// // GLOBAL MIDDLEWARE
// // ==========================================================

// const globalMiddleware = require("./app/middlewares/globalMiddleware");

// console.log("✅ APP: globalMiddleware loaded");

// // ==========================================================
// // SHOP CONTROLLER
// // ==========================================================

// const ShopController = require("./app/controllers/ShopController");

// console.log("✅ APP: ShopController loaded");

// // ==========================================================
// // ROUTES
// // ==========================================================

// console.log("🔥 APP: Loading routes...");

// const homeRoutes = require("./app/routes/homeRoutes");
// console.log("✅ APP: homeRoutes loaded");

// const newsletterRoute = require("./app/routes/newsletterRoute");
// console.log("✅ APP: newsletterRoute loaded");

// const shopRoutes = require("./app/routes/shopRoute");
// console.log("✅ APP: shopRoutes loaded");

// const authRoutes = require("./app/routes/authRoute");
// console.log("✅ APP: authRoutes loaded");

// const userRoutes = require("./app/routes/userRoute");
// console.log("✅ APP: userRoutes loaded");

// const aboutRoutes = require("./app/routes/aboutRoute");
// console.log("✅ APP: aboutRoutes loaded");

// const contactRoutes = require("./app/routes/contactRoute");
// console.log("✅ APP: contactRoutes loaded");

// const categoryRoutes = require("./app/routes/categoryRoute");
// console.log("✅ APP: categoryRoutes loaded");

// const brandRoutes = require("./app/routes/brandRoute");
// console.log("✅ APP: brandRoutes loaded");

// const productRoutes = require("./app/routes/productRoute");
// console.log("✅ APP: productRoutes loaded");

// const reviewRoutes = require("./app/routes/reviewRoute");
// console.log("✅ APP: reviewRoutes loaded");

// const wishlistRoutes = require("./app/routes/wishlistRoute");
// console.log("✅ APP: wishlistRoutes loaded");

// const cartRoutes = require("./app/routes/cartRoute");
// console.log("✅ APP: cartRoutes loaded");

// const checkoutRoutes = require("./app/routes/checkoutRoute");
// console.log("✅ APP: checkoutRoutes loaded");

// const addressRoutes = require("./app/routes/addressRoute");
// console.log("✅ APP: addressRoutes loaded");

// const paymentRoutes = require("./app/routes/paymentRoute");
// console.log("✅ APP: paymentRoutes loaded");

// const couponRoutes = require("./app/routes/couponRoute");
// console.log("✅ APP: couponRoutes loaded");

// const orderRoutes = require("./app/routes/orderRoute");
// console.log("✅ APP: orderRoutes loaded");

// const adminDashboardRoute = require("./app/routes/adminDashboardRoute");
// console.log("✅ APP: adminDashboardRoute loaded");

// const sellerDashboardRoute = require("./app/routes/sellerDashboardRoute");
// console.log("✅ APP: sellerDashboardRoute loaded");

// const notificationRoute = require("./app/routes/notificationRoute");
// console.log("✅ APP: notificationRoute loaded");

// console.log("🔥 APP: ALL ROUTES LOADED");

// // ==========================================================
// // ERROR MIDDLEWARE
// // ==========================================================

// const notFoundMiddleware = require("./app/middlewares/notFoundMiddleware");

// console.log("✅ APP: notFoundMiddleware loaded");

// const errorMiddleware = require("./app/middlewares/errorMiddleware");

// console.log("✅ APP: errorMiddleware loaded");

// console.log("🔥 APP: ALL IMPORTS COMPLETED");

// // ==========================================================
// // CREATE EXPRESS APPLICATION
// // ==========================================================

// const app = express();

// console.log("✅ APP: Express application created");

// // ==========================================================
// // TRUST PROXY
// // ==========================================================

// app.set("trust proxy", 1);

// console.log("✅ APP: trust proxy configured");

// // ==========================================================
// // EJS
// // ==========================================================

// app.set("view engine", "ejs");

// app.set("views", path.join(__dirname, "views"));

// console.log("✅ APP: EJS configured");

// // ==========================================================
// // HTTP REQUEST LOGGING
// // ==========================================================

// if (process.env.NODE_ENV !== "production") {
//   app.use(
//     morgan("dev", {
//       stream: {
//         write: (message) => logger.info(message.trim()),
//       },
//     }),
//   );

//   console.log("✅ APP: Morgan configured");
// }

// // ==========================================================
// // BODY PARSERS
// // ==========================================================

// app.use(express.json());

// console.log("✅ APP: JSON parser configured");

// app.use(
//   express.urlencoded({
//     extended: true,
//   }),
// );

// console.log("✅ APP: URL encoded parser configured");

// // ==========================================================
// // METHOD OVERRIDE
// // ==========================================================

// app.use(methodOverride("_method"));

// console.log("✅ APP: methodOverride configured");

// // ==========================================================
// // COOKIE PARSER
// // ==========================================================

// app.use(cookieParser());

// console.log("✅ APP: cookieParser configured");

// // ==========================================================
// // GLOBAL EJS VARIABLES
// // ==========================================================

// app.use((req, res, next) => {
//   res.locals.currentRoute = req.path;

//   next();
// });

// console.log("✅ APP: Global EJS variables configured");

// // ==========================================================
// // COMPRESSION
// // ==========================================================

// app.use(compression());

// console.log("✅ APP: Compression configured");

// // ==========================================================
// // MONGO SANITIZATION
// // ==========================================================

// // Temporarily disabled
// // app.use(mongoSanitize());

// console.log("✅ APP: Mongo sanitize skipped");

// // ==========================================================
// // HPP
// // ==========================================================

// app.use(hpp());

// console.log("✅ APP: HPP configured");

// // ==========================================================
// // CORS
// // ==========================================================

// app.use(
//   cors({
//     origin: process.env.CLIENT_URL,
//     credentials: true,
//   }),
// );

// console.log("✅ APP: CORS configured");

// // ==========================================================
// // STATIC FILES
// // ==========================================================

// app.use(express.static(path.join(__dirname, "public")));

// console.log("✅ APP: Public static files configured");

// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// console.log("✅ APP: Uploads static files configured");

// // ==========================================================
// // GLOBAL MIDDLEWARE
// // ==========================================================

// app.use(globalMiddleware);

// console.log("✅ APP: globalMiddleware registered");

// // // ==========================================================
// // // PASSPORT
// // // ==========================================================

// // app.use(passport.initialize());

// // console.log("✅ APP: Passport initialized");

// // ==========================================================
// // ROUTES
// // ==========================================================

// console.log("🔥 APP: Registering routes...");

// app.use("/newsletter", newsletterRoute);
// console.log("✅ APP: newsletter route registered");

// app.use("/about", aboutRoutes);
// console.log("✅ APP: about route registered");

// app.use("/contact", contactRoutes);
// console.log("✅ APP: contact route registered");

// app.use("/", homeRoutes);
// console.log("✅ APP: home route registered");

// app.use("/shop", shopRoutes);
// console.log("✅ APP: shop route registered");

// app.get("/products/:slug", ShopController.showProductDetails);

// console.log("✅ APP: product details route registered");

// app.use("/auth", authRoutes);
// console.log("✅ APP: auth route registered");

// app.use("/admin/users", userRoutes);
// console.log("✅ APP: user management route registered");

// app.use("/admin/categories", categoryRoutes);
// console.log("✅ APP: category route registered");

// app.use("/admin/brands", brandRoutes);
// console.log("✅ APP: brand route registered");

// app.use("/admin/products", productRoutes);
// console.log("✅ APP: product management route registered");

// app.use("/reviews", reviewRoutes);
// console.log("✅ APP: review route registered");

// app.use("/wishlist", wishlistRoutes);
// console.log("✅ APP: wishlist route registered");

// app.use("/cart", cartRoutes);
// console.log("✅ APP: cart route registered");

// app.use("/addresses", addressRoutes);
// console.log("✅ APP: address route registered");

// app.use("/checkout", checkoutRoutes);
// console.log("✅ APP: checkout route registered");

// app.use("/coupons", couponRoutes);
// console.log("✅ APP: coupon route registered");

// app.use("/payment", paymentRoutes);
// console.log("✅ APP: payment route registered");

// app.use("/orders", orderRoutes);
// console.log("✅ APP: order route registered");

// app.use("/admin/dashboard", adminDashboardRoute);

// console.log("✅ APP: admin dashboard route registered");

// app.use("/seller/dashboard", sellerDashboardRoute);

// console.log("✅ APP: seller dashboard route registered");

// app.use("/", notificationRoute);

// console.log("✅ APP: notification route registered");

// // ==========================================================
// // 404 MIDDLEWARE
// // ==========================================================

// app.use(notFoundMiddleware);

// console.log("✅ APP: notFoundMiddleware registered");

// // ==========================================================
// // ERROR MIDDLEWARE
// // ==========================================================

// app.use(errorMiddleware);

// console.log("✅ APP: errorMiddleware registered");

// // ==========================================================
// // EXPORT
// // ==========================================================

// console.log("🔥 APP: ABOUT TO EXPORT");

// module.exports = app;

// console.log("🎉 APP: SUCCESSFULLY EXPORTED");
