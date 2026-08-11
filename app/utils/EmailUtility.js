const nodemailer = require("nodemailer");

class EmailUtility {
  static transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  static async sendEmail({ to, subject, html }) {
    return await this.transporter.sendMail({
      from: `"Plantora" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  }

  static async sendNewsletterSubscriptionEmail({ name, email }) {
    return await this.transporter.sendMail({
      from: `"Plantora Newsletter" <${process.env.EMAIL_USER}>`,

      to: process.env.ADMIN_EMAIL,

      replyTo: email,

      subject: `🌿 New Plantora Newsletter Subscriber — ${name}`,

      html: `
            <!DOCTYPE html>

            <html>

            <body
                style="
                    margin:0;
                    padding:30px;
                    background:#f3f7f2;
                    font-family:Arial,sans-serif;
                "
            >

                <div
                    style="
                        max-width:650px;
                        margin:auto;
                        background:#ffffff;
                        border-radius:18px;
                        overflow:hidden;
                        border:1px solid #e2ebe2;
                    "
                >

                    <div
                        style="
                            padding:30px;
                            background:#173c29;
                            color:#ffffff;
                        "
                    >

                        <div
                            style="
                                font-size:10px;
                                letter-spacing:2px;
                                opacity:.7;
                                margin-bottom:8px;
                            "
                        >
                            PLANTORA NEWSLETTER
                        </div>

                        <h1
                            style="
                                margin:0;
                                font-size:25px;
                            "
                        >
                            New Subscriber
                        </h1>

                    </div>

                    <div
                        style="
                            padding:32px;
                            color:#35443a;
                        "
                    >

                        <p
                            style="
                                font-size:16px;
                                line-height:1.7;
                            "
                        >
                            Someone has just subscribed
                            to the Plantora newsletter.
                        </p>

                        <div
                            style="
                                margin-top:25px;
                                padding:20px;
                                background:#f6f9f5;
                                border-radius:12px;
                            "
                        >

                            <p>
                                <strong>Name:</strong>
                                ${escapeHtml(name)}
                            </p>

                            <p>
                                <strong>Email:</strong>
                                ${escapeHtml(email)}
                            </p>

                        </div>

                        <p
                            style="
                                margin-top:25px;
                                color:#7a847c;
                                font-size:13px;
                                line-height:1.6;
                            "
                        >
                            This subscriber submitted
                            their information through
                            the Plantora website newsletter
                            form.
                        </p>

                    </div>

                    <div
                        style="
                            padding:18px 30px;
                            background:#fafcf9;
                            color:#7a847c;
                            font-size:12px;
                        "
                    >

                        Plantora · Growing a greener
                        world, one home at a time.

                    </div>

                </div>

            </body>

            </html>
        `,
    });
  }
}

module.exports = EmailUtility;
