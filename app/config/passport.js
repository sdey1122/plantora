// const passport = require("passport");

// const GoogleStrategy = require("passport-google-oauth20").Strategy;

// const User = require("../models/User");

// const logger = require("./logger");

// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,

//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,

//       callbackURL: process.env.GOOGLE_CALLBACK_URL,
//     },

//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         const email = profile.emails?.[0]?.value?.toLowerCase();

//         if (!email) {
//           return done(
//             new Error("Google account email could not be retrieved."),
//             null,
//           );
//         }

//         // ======================================================
//         // FIND USER BY GOOGLE ID
//         // ======================================================

//         let user = await User.findOne({
//           googleId: profile.id,
//         });

//         if (user) {
//           if (user.isDeleted) {
//             return done(
//               new Error("This Plantora account has been deleted."),
//               null,
//             );
//           }

//           if (user.status === "blocked") {
//             return done(
//               new Error("This Plantora account has been blocked."),
//               null,
//             );
//           }

//           user.lastLogin = new Date();
//           user.lastActive = new Date();

//           await user.save();

//           return done(null, user);
//         }

//         // ======================================================
//         // CHECK EXISTING EMAIL
//         // ======================================================

//         user = await User.findOne({
//           email,
//         });

//         if (user) {
//           /*
//            * IMPORTANT:
//            *
//            * Do NOT automatically connect Google to an existing
//            * local account only because the email matches.
//            *
//            * That could create an account-linking/security issue.
//            */

//           if (user.authProvider === "local") {
//             return done(
//               new Error(
//                 "An account with this email already exists. Please login using your email and password.",
//               ),
//               null,
//             );
//           }

//           return done(new Error("Unable to authenticate with Google."), null);
//         }

//         // ======================================================
//         // CREATE GOOGLE USER
//         // ======================================================

//         user = await User.create({
//           name:
//             profile.displayName || profile.name?.givenName || "Plantora User",

//           email,

//           authProvider: "google",

//           googleId: profile.id,

//           profileImage: {
//             publicId: "google-profile",
//             url:
//               profile.photos?.[0]?.value ||
//               process.env.DEFAULT_PROFILE_IMAGE_URL,
//           },

//           role: "customer",

//           status: "active",

//           isEmailVerified: true,

//           seller: {
//             status: "none",
//           },

//           termsAccepted: true,

//           termsAcceptedAt: new Date(),

//           failedLoginAttempts: 0,

//           accountLockedUntil: null,

//           lockReason: "",

//           lockedBy: null,

//           lastLogin: null,

//           lastActive: null,

//           passwordChangedAt: null,

//           emailChangedAt: null,

//           isDeleted: false,

//           deletedAt: null,
//         });

//         logger.info(`Google account created : ${user.email}`);

//         return done(null, user);
//       } catch (error) {
//         logger.error(`Google authentication error : ${error.message}`);

//         return done(error, null);
//       }
//     },
//   ),
// );

// module.exports = passport;
