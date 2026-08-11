// // Import utility
// const httpStatusCode = require("../utils/httpStatusCode");

// // Authorize user roles
// const authorizeRoles = (...roles) => {
//   return (req, res, next) => {
//     // Check authentication
//     if (!req.user) {
//       return res.status(httpStatusCode.UNAUTHORIZED).json({
//         success: false,
//         message: "Authentication required.",
//       });
//     }

//     // Check user role
//     if (!roles.includes(req.user.role)) {
//       return res.status(httpStatusCode.FORBIDDEN).json({
//         success: false,
//         message: "You do not have permission to perform this action.",
//       });
//     }

//     return next();
//   };
// };

// // Export middleware
// module.exports = authorizeRoles;

// Import utility
// ==========================================================
// IMPORT
// ==========================================================

const httpStatusCode = require("../utils/httpStatusCode");

// ==========================================================
// AUTHORIZE ROLES
// ==========================================================

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // ======================================================
    // AUTHENTICATION CHECK
    // ======================================================

    if (!req.user) {
      return res.status(httpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // ======================================================
    // ADMIN
    // ======================================================

    if (roles.includes("admin") && req.user.role === "admin") {
      return next();
    }

    // ======================================================
    // APPROVED SELLER
    // ======================================================
    /*
      Seller is NOT a separate role.

      Database:

      role: "customer"

      seller: {
        status: "approved"
      }

      Therefore seller access is granted only when:

      role === "customer"
      AND
      seller.status === "approved"
    */

    if (
      roles.includes("seller") &&
      req.user.role === "customer" &&
      req.user.seller?.status === "approved"
    ) {
      return next();
    }

    // ======================================================
    // NORMAL ROLE AUTHORIZATION
    // ======================================================

    if (roles.includes(req.user.role)) {
      return next();
    }

    // ======================================================
    // FORBIDDEN
    // ======================================================

    return res.status(httpStatusCode.FORBIDDEN).json({
      success: false,
      message: "You do not have permission to perform this action.",
    });
  };
};

// ==========================================================
// EXPORT
// ==========================================================

module.exports = authorizeRoles;
