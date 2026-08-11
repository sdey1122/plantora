// // Import transporter
// const { transporter } = require("../config/email");

// // Import logger
// const logger = require("../config/logger");

// // Send email
// const sendEmail = async ({ to, subject, html, text }) => {
//   try {
//     await transporter.sendMail({
//       from: process.env.EMAIL_FROM,

//       to,

//       subject,

//       html,

//       text,
//     });

//     logger.info(`Email sent successfully to '${to}'. Subject: '${subject}'.`);
//   } catch (error) {
//     logger.error(
//       `Failed to send email to '${to}'. Subject: '${subject}'. ${error.message}`,
//     );

//     throw error;
//   }
// };

// // Export utility
// module.exports = sendEmail;

const { resend } = require("../config/email");

const logger = require("../config/logger");

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: [to],
      subject,
      html,
      text,
    });

    if (error) {
      logger.error(
        `Failed to send email to '${to}'. Subject: '${subject}'. ${error.message}`,
      );

      throw new Error(error.message);
    }

    logger.info(
      `Email sent successfully to '${to}'. Subject: '${subject}'. Email ID: ${data?.id || "N/A"}`,
    );

    return data;
  } catch (error) {
    logger.error(
      `Failed to send email to '${to}'. Subject: '${subject}'. ${error.message}`,
    );

    throw error;
  }
};

module.exports = sendEmail;
