const nodemailer = require("nodemailer");
const logger = require("./logger");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: Number(process.env.EMAIL_PORT) === 465,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const verifyEmailConnection = async () => {
  try {
    await transporter.verify();

    logger.info("Email server connected successfully.");
  } catch (error) {
    logger.error(`Email server connection failed: ${error.message}`);

    throw error;
  }
};

module.exports = {
  transporter,
  verifyEmailConnection,
};
