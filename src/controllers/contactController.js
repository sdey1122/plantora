/*
============================================================
PLANTORA CONTACT CONTROLLER
============================================================
*/

const logger = require("../config/logger");
const httpStatusCode = require("../utils/httpStatusCode");
const EmailUtility = require("../utils/EmailUtility");

class ContactController {
  // ==========================================================
  // CONTACT PAGE
  // ==========================================================

  static async showContactPage(req, res, next) {
    try {
      return res.status(httpStatusCode.OK).render("partials/main/contact", {
        title: "Contact Plantora",
      });
    } catch (error) {
      logger.error(`Show contact page failed: ${error.stack || error.message}`);

      return next(error);
    }
  }

  // ==========================================================
  // SEND CONTACT MESSAGE
  // ==========================================================

  static async sendContactMessage(req, res, next) {
    try {
      const { name, email, message } = req.body;

      // ======================================================
      // NORMALIZE INPUT
      // ======================================================

      const cleanName = typeof name === "string" ? name.trim() : "";

      const cleanEmail =
        typeof email === "string" ? email.trim().toLowerCase() : "";

      const cleanMessage = typeof message === "string" ? message.trim() : "";

      // ======================================================
      // NAME VALIDATION
      // ======================================================

      if (!cleanName) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Please enter your name.",
          field: "name",
        });
      }

      if (cleanName.length < 3 || cleanName.length > 32) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Name must be between 3 and 32 characters.",
          field: "name",
        });
      }

      // ======================================================
      // NAME CHARACTER VALIDATION
      // ======================================================

      const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s.'-]+$/;

      if (!nameRegex.test(cleanName)) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message:
            "Name can contain letters, spaces, apostrophes, dots and hyphens only.",
          field: "name",
        });
      }

      // ======================================================
      // EMAIL VALIDATION
      // ======================================================

      if (!cleanEmail) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Please enter your email address.",
          field: "email",
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

      if (!emailRegex.test(cleanEmail)) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Please enter a valid email address.",
          field: "email",
        });
      }

      // ======================================================
      // MESSAGE VALIDATION
      // ======================================================

      if (!cleanMessage) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Please enter your message.",
          field: "message",
        });
      }

      if (cleanMessage.length > 500) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Message cannot exceed 500 characters.",
          field: "message",
        });
      }

      // ======================================================
      // ADMIN EMAIL CHECK
      // ======================================================

      const adminEmail = process.env.ADMIN_EMAIL;

      if (!adminEmail) {
        logger.error("ADMIN_EMAIL is not configured.");

        return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "Contact service is temporarily unavailable.",
        });
      }

      // ======================================================
      // EMAIL CONFIGURATION
      //
      // Uses the existing Plantora email utility.
      // ======================================================

      const EmailUtility = require("../utils/EmailUtility");

      // ======================================================
      // EMAIL SUBJECT
      // ======================================================

      const subject = `Plantora Contact Message — ${cleanName}`;

      // ======================================================
      // EMAIL HTML
      // ======================================================

      const html = `
<!DOCTYPE html>

<html>

<head>

  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>Plantora Contact Message</title>

</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f4f6f2;
    font-family:Arial,Helvetica,sans-serif;
  "
>

  <div
    style="
      max-width:680px;
      margin:40px auto;
      background:#ffffff;
      border-radius:20px;
      overflow:hidden;
      box-shadow:0 12px 40px rgba(20,50,30,.10);
    "
  >

    <!-- HEADER -->

    <div
      style="
        padding:32px;
        background:#173d2a;
        color:#ffffff;
      "
    >

      <h1
        style="
          margin:0 0 8px;
          font-size:26px;
          letter-spacing:.3px;
        "
      >
        Plantora
      </h1>

      <p
        style="
          margin:0;
          color:#dcecdf;
          font-size:14px;
        "
      >
        New customer enquiry
      </p>

    </div>


    <!-- CONTENT -->

    <div
      style="
        padding:36px;
      "
    >

      <p
        style="
          margin:0 0 24px;
          color:#58635b;
          font-size:15px;
          line-height:1.7;
        "
      >
        A new message has been submitted
        through the Plantora contact page.
      </p>


      <!-- NAME -->

      <div
        style="
          margin-bottom:20px;
          padding:18px;
          background:#f7f9f6;
          border-radius:12px;
        "
      >

        <strong
          style="
            display:block;
            margin-bottom:6px;
            color:#173d2a;
            font-size:13px;
            text-transform:uppercase;
            letter-spacing:.8px;
          "
        >
          Name
        </strong>

        <span
          style="
            color:#303830;
            font-size:15px;
          "
        >
          ${escapeHtml(cleanName)}
        </span>

      </div>


      <!-- EMAIL -->

      <div
        style="
          margin-bottom:20px;
          padding:18px;
          background:#f7f9f6;
          border-radius:12px;
        "
      >

        <strong
          style="
            display:block;
            margin-bottom:6px;
            color:#173d2a;
            font-size:13px;
            text-transform:uppercase;
            letter-spacing:.8px;
          "
        >
          Email
        </strong>

        <span
          style="
            color:#303830;
            font-size:15px;
          "
        >
          ${escapeHtml(cleanEmail)}
        </span>

      </div>


      <!-- MESSAGE -->

      <div
        style="
          padding:18px;
          background:#f7f9f6;
          border-radius:12px;
        "
      >

        <strong
          style="
            display:block;
            margin-bottom:10px;
            color:#173d2a;
            font-size:13px;
            text-transform:uppercase;
            letter-spacing:.8px;
          "
        >
          Message
        </strong>

        <p
          style="
            margin:0;
            color:#303830;
            font-size:15px;
            line-height:1.8;
            white-space:pre-wrap;
          "
        >
          ${escapeHtml(cleanMessage)}
        </p>

      </div>

    </div>


    <!-- FOOTER -->

    <div
      style="
        padding:24px 36px;
        border-top:1px solid #edf0eb;
        color:#7b847c;
        font-size:12px;
      "
    >

      Plantora Contact System · 2026

    </div>

  </div>

</body>

</html>
      `;

      // ======================================================
      // SEND EMAIL
      // ======================================================

      await EmailUtility.sendEmail({
        to: adminEmail,

        subject,

        html,

        replyTo: cleanEmail,
      });

      // ======================================================
      // SUCCESS
      // ======================================================

      logger.info(`Plantora contact message received from ${cleanEmail}`);

      return res.status(httpStatusCode.OK).json({
        success: true,
        message: "Your message has been sent successfully.",
      });
    } catch (error) {
      logger.error(
        `Send contact message failed: ${error.stack || error.message}`,
      );

      return next(error);
    }
  }
}

// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================
// EXPORT
// ============================================================

module.exports = ContactController;
