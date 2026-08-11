const nodemailer = require("nodemailer");

const logger = require("../config/logger");
const httpStatusCode = require("../utils/httpStatusCode");

class NewsletterController {
  // ==========================================================
  // SUBSCRIBE TO NEWSLETTER
  // ==========================================================

  static async subscribe(req, res, next) {
    try {
      // --------------------------------------------------------
      // GET EMAIL
      // --------------------------------------------------------

      const email =
        typeof req.body.email === "string"
          ? req.body.email.trim().toLowerCase()
          : "";

      // --------------------------------------------------------
      // VALIDATE EMAIL
      // --------------------------------------------------------

      if (!email) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Email is required.",
        });
      }

      if (email.length > 254) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid email address.",
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid email address.",
        });
      }

      // --------------------------------------------------------
      // EMAIL CONFIGURATION
      // --------------------------------------------------------

      if (
        !process.env.EMAIL_USER ||
        !process.env.EMAIL_PASSWORD ||
        !process.env.ADMIN_EMAIL
      ) {
        logger.error("Newsletter email configuration is missing.");

        return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "Newsletter service is currently unavailable.",
        });
      }

      // --------------------------------------------------------
      // CREATE TRANSPORTER
      // --------------------------------------------------------

      const transporter = nodemailer.createTransport({
        service: "gmail",

        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      // --------------------------------------------------------
      // SEND EMAIL TO ADMIN
      // --------------------------------------------------------

      await transporter.sendMail({
        from: `"Plantora Newsletter" <${process.env.EMAIL_USER}>`,

        to: process.env.ADMIN_EMAIL,

        replyTo: email,

        subject: "New Plantora Newsletter Subscriber",

        text: `
A new visitor subscribed to the Plantora newsletter.

Subscriber Email:
${email}

This subscriber has requested to receive Plantora newsletter updates.
        `.trim(),

        html: `
<!DOCTYPE html>

<html>

<head>

    <meta charset="UTF-8">

    <title>New Plantora Subscriber</title>

</head>

<body
    style="
        margin:0;
        padding:40px 20px;
        background:#f5f7f2;
        font-family:Arial,Helvetica,sans-serif;
        color:#173d2b;
    "
>

    <div
        style="
            max-width:620px;
            margin:0 auto;
            background:#ffffff;
            border-radius:18px;
            overflow:hidden;
            border:1px solid #e3ebe5;
            box-shadow:0 12px 40px rgba(15,61,42,.08);
        "
    >

        <!-- Header -->

        <div
            style="
                background:#0d4633;
                padding:32px;
                text-align:center;
            "
        >

            <div
                style="
                    font-size:13px;
                    letter-spacing:3px;
                    font-weight:700;
                    color:#b9d8c5;
                    margin-bottom:10px;
                "
            >
                PLANTORA
            </div>

            <h1
                style="
                    margin:0;
                    color:#ffffff;
                    font-size:28px;
                "
            >
                New Newsletter Subscriber
            </h1>

        </div>


        <!-- Content -->

        <div style="padding:35px;">

            <p
                style="
                    margin:0 0 25px;
                    color:#66776e;
                    font-size:15px;
                    line-height:1.7;
                "
            >
                Someone has just subscribed to the Plantora
                newsletter.
            </p>


            <div
                style="
                    background:#f3f8f4;
                    border:1px solid #dce9df;
                    border-radius:14px;
                    padding:22px;
                "
            >

                <div
                    style="
                        font-size:11px;
                        text-transform:uppercase;
                        letter-spacing:2px;
                        font-weight:700;
                        color:#789182;
                        margin-bottom:8px;
                    "
                >
                    Subscriber Email
                </div>

                <div
                    style="
                        font-size:19px;
                        font-weight:600;
                        color:#123e2d;
                        word-break:break-word;
                    "
                >
                    ${email}
                </div>

            </div>


            <p
                style="
                    margin:25px 0 0;
                    color:#849189;
                    font-size:13px;
                    line-height:1.6;
                "
            >
                You can reply directly to this email to contact
                the subscriber.
            </p>

        </div>


        <!-- Footer -->

        <div
            style="
                padding:20px 35px;
                background:#fafcf9;
                border-top:1px solid #edf1ed;
                color:#8a978f;
                font-size:12px;
                text-align:center;
            "
        >

            Plantora Newsletter System · 2026

        </div>

    </div>

</body>

</html>
        `.trim(),
      });

      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      logger.info(`Newsletter subscription received from ${email}`);

      return res.status(httpStatusCode.OK).json({
        success: true,
        message: "Newsletter subscription successful.",
      });
    } catch (error) {
      logger.error(
        `Newsletter subscription failed: ${error.stack || error.message}`,
      );

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Newsletter subscription failed.",
      });
    }
  }
}

module.exports = NewsletterController;
