// // Import Nodemailer
// const nodemailer = require("nodemailer");

// // Import custom logger
// const logger = require("./logger");

// // Create email transporter
// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: Number(process.env.EMAIL_PORT),
//   secure: process.env.EMAIL_PORT == 465,

//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// // Verify email connection
// const verifyEmailConnection = async () => {
//   try {
//     await transporter.verify();

//     logger.info("Email server connected successfully.");
//   } catch (error) {
//     logger.error(`Email server connection failed: ${error.message}`);

//     process.exit(1);
//   }
// };

// // Export transporter and verification function
// module.exports = {
//   transporter,
//   verifyEmailConnection,
// };

const { Resend } = require("resend");

const logger = require("./logger");

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not configured.");
}

const resend = new Resend(process.env.RESEND_API_KEY);

const verifyEmailConnection = async () => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is missing.");
    }

    logger.info("Resend email service configured successfully.");
  } catch (error) {
    logger.error(`Resend email configuration failed: ${error.message}`);

    throw error;
  }
};

module.exports = {
  resend,
  verifyEmailConnection,
};
