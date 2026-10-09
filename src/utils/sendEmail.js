const { transporter } = require("../config/email");
const logger = require("../config/logger");

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text,
    });

    logger.info(`Email sent successfully to '${to}'. Subject: '${subject}'.`);
  } catch (error) {
    logger.error(
      `Failed to send email to '${to}'. Subject: '${subject}'. ${error.message}`,
    );

    throw error;
  }
};

module.exports = sendEmail;
