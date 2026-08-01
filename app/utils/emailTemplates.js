// PLANTORA EMAIL TEMPLATES

// Brand Colors
const BRAND = {
  primary: "#2e7d32",
  primaryDark: "#1b5e20",
  primaryLight: "#66bb6a",
  primarySoft: "#e8f5e9",
  white: "#ffffff",
  body: "#f9fafb",
  text: "#212529",
  textLight: "#6c757d",
  border: "#e9ecef",
  danger: "#dc3545",
};

// Create email header
const createEmailHeader = (title) => `
<tr>
<td
    bgcolor="${BRAND.primaryDark}"
    style="
        background-color:${BRAND.primaryDark};
        padding:40px 30px;
        text-align:center;
    "
>

    <h1
        style="
            margin:0;
            color:#ffffff;
            font-size:38px;
            font-weight:800;
            letter-spacing:3px;
            font-family:Arial,Helvetica,sans-serif;
        "
    >
        PLANTORA
    </h1>

    <p
        style="
            margin:12px 0 0;
            color:rgba(255,255,255,.92);
            font-size:15px;
            letter-spacing:.5px;
            font-family:Arial,Helvetica,sans-serif;
        "
    >
        Bringing Nature Closer To Every Home
    </p>

</td>
</tr>

<tr>

<td
    style="
        padding:35px 40px 15px;
        text-align:center;
    "
>

    <h2
        style="
            margin:0;
            color:${BRAND.primaryDark};
            font-size:30px;
            font-family:Arial,Helvetica,sans-serif;
        "
    >
        ${title}
    </h2>

</td>

</tr>
`;

// Create email footer
const createEmailFooter = () => `
<tr>

<td
    style="
        padding:30px 40px;
        background:${BRAND.body};
        border-top:1px solid ${BRAND.border};
        text-align:center;
    "
>

    <p
        style="
            margin:0;
            color:${BRAND.textLight};
            font-size:13px;
            line-height:1.8;
            font-family:Arial,Helvetica,sans-serif;
        "
    >
        © ${new Date().getFullYear()} Plantora.
        All rights reserved.
    </p>

    <p
        style="
            margin:10px 0 0;
            color:${BRAND.textLight};
            font-size:13px;
            font-family:Arial,Helvetica,sans-serif;
        "
    >
        This is an automated email.
        Please do not reply to this message.
    </p>

</td>

</tr>
`;

// Create complete email layout
const createEmailLayout = ({ title, content }) => `
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>

<title>${title}</title>

</head>

<body
    style="
        margin:0;
        padding:40px 20px;
        background:${BRAND.body};
        font-family:Arial,Helvetica,sans-serif;
    "
>

<table
    width="100%"
    cellspacing="0"
    cellpadding="0"
>

<tr>

<td align="center">

<table
    width="600"
    cellspacing="0"
    cellpadding="0"
    style="
        background:${BRAND.white};
        border-radius:18px;
        overflow:hidden;
        box-shadow:0 12px 35px rgba(0,0,0,.08);
    "
>

${createEmailHeader(title)}

<tr>

<td
    style="
        padding:10px 40px 40px;
        color:${BRAND.text};
        font-size:16px;
        line-height:1.9;
    "
>

${content}

</td>

</tr>

${createEmailFooter()}

</table>

</td>

</tr>

</table>

</body>

</html>
`;
// Generate email verification template
const getVerificationEmail = (name, verificationUrl) => {
  return {
    subject: "Verify Your Plantora Account",

    text: `
Welcome to Plantora!

Hello ${name},

Thank you for creating your Plantora account.

Please verify your email by visiting the link below:

${verificationUrl}

This verification link will expire automatically.

If you did not create this account, you can safely ignore this email.

Regards,
Plantora Team
`,

    html: createEmailLayout({
      title: "Verify Your Email",

      content: `
<p
    style="
        margin-top:0;
    "
>

Hello <strong>${name}</strong>,

</p>

<p>

Welcome to <strong>Plantora</strong> 🌿

</p>

<p>

Thank you for creating your account.

Before you start exploring premium plants and gardening products,
please verify your email address.

</p>

<div
    style="
        margin:45px 0;
        text-align:center;
    "
>

<a
    href="${verificationUrl}"
    style="
        display:inline-block;
        padding:16px 38px;
        background:${BRAND.primary};
        color:#ffffff;
        text-decoration:none;
        border-radius:10px;
        font-size:16px;
        font-weight:700;
    "
>

Verify Email

</a>

</div>

<p>

Or copy and paste this link into your browser:

</p>

<p
    style="
        word-break:break-word;
    "
>

<a
    href="${verificationUrl}"
    style="
        color:${BRAND.primary};
        text-decoration:none;
    "
>

${verificationUrl}

</a>

</p>

<div
    style="
        margin-top:35px;
        padding:18px 22px;
        background:${BRAND.primarySoft};
        border-left:5px solid ${BRAND.primary};
        border-radius:10px;
    "
>

<strong>Important</strong>

<ul
    style="
        margin:12px 0 0;
        padding-left:20px;
    "
>

<li>

This verification link will expire automatically.

</li>

<li>

If you did not create a Plantora account,
no further action is required.

</li>

<li>

Never share verification links with anyone.

</li>

</ul>

</div>

<p
    style="
        margin-top:35px;
    "
>

Happy Gardening 🌱

<br>

<strong>Team Plantora</strong>

</p>
`,
    }),
  };
};
// Generate password reset template
const getResetPasswordEmail = (name, resetUrl) => {
  return {
    subject: "Reset Your Plantora Password",

    text: `
Password Reset Request

Hello ${name},

We received a request to reset your Plantora account password.

Reset your password using the link below:

${resetUrl}

This link will expire automatically.

If you didn't request this password reset, you can safely ignore this email.

Regards,
Plantora Team
`,

    html: createEmailLayout({
      title: "Reset Your Password",

      content: `
<p style="margin-top:0;">

Hello <strong>${name}</strong>,

</p>

<p>

We received a request to reset the password for your
<strong>Plantora</strong> account.

</p>

<p>

Click the button below to create a new password.

</p>

<div
    style="
        margin:45px 0;
        text-align:center;
    "
>

<a
    href="${resetUrl}"
    style="
        display:inline-block;
        background:${BRAND.danger};
        color:#ffffff;
        text-decoration:none;
        padding:16px 38px;
        border-radius:10px;
        font-size:16px;
        font-weight:700;
    "
>

Reset Password

</a>

</div>

<p>

If the button doesn't work, use the following link:

</p>

<p style="word-break:break-word;">

<a
    href="${resetUrl}"
    style="
        color:${BRAND.primary};
        text-decoration:none;
    "
>

${resetUrl}

</a>

</p>

<div
    style="
        margin-top:35px;
        padding:18px 22px;
        background:#fff5f5;
        border-left:5px solid ${BRAND.danger};
        border-radius:10px;
    "
>

<strong>Security Notice</strong>

<ul
    style="
        margin:12px 0 0;
        padding-left:20px;
    "
>

<li>

This reset link expires automatically.

</li>

<li>

Never share this link with anyone.

</li>

<li>

If you didn't request a password reset,
your account is still secure.

</li>

</ul>

</div>

<p style="margin-top:35px;">

Stay safe 🌿

<br>

<strong>Team Plantora</strong>

</p>
`,
    }),
  };
};

// Generate seller request email
const getSellerRequestEmail = (customerName, customerEmail, reviewUrl) => {
  return {
    subject: "New Seller Request - Plantora",

    text: `
New Seller Request

Hello Admin,

A customer has requested to become a seller.

Customer Name:
${customerName}

Customer Email:
${customerEmail}

Review the seller request below:

${reviewUrl}

If the link opens inside an email service (such as YOPmail),
copy and paste the URL into the browser where you are already
logged in as an Administrator.

Regards,
Plantora
`,

    html: createEmailLayout({
      title: "New Seller Request",

      content: `
<p style="margin-top:0;">

Hello <strong>Admin</strong>,

</p>

<p>

A new customer has submitted a request to become a seller on
<strong>Plantora</strong>.

</p>

<div
    style="
        margin:35px 0;
        padding:22px;
        background:${BRAND.primarySoft};
        border:1px solid ${BRAND.border};
        border-radius:12px;
    "
>

<table
    width="100%"
    cellpadding="8"
    cellspacing="0"
>

<tr>

<td width="140">

<strong>Customer Name</strong>

</td>

<td>

${customerName}

</td>

</tr>

<tr>

<td>

<strong>Email Address</strong>

</td>

<td>

${customerEmail}

</td>

</tr>

</table>

</div>

<p>

Please review this seller application.

</p>

<div
    style="
        margin:30px 0;
        padding:18px;
        background:#f8f9fa;
        border:1px solid ${BRAND.border};
        border-radius:10px;
    "
>

<p
    style="
        margin:0 0 12px;
        font-weight:700;
        color:${BRAND.primaryDark};
    "
>

Seller Review URL

</p>

<p
    style="
        margin:0;
        word-break:break-all;
    "
>

<a
    href="${reviewUrl}"
    style="
        color:${BRAND.primary};
        text-decoration:none;
        font-weight:600;
    "
>

${reviewUrl}

</a>

</p>

</div>

<div
    style="
        margin-top:25px;
        padding:18px;
        background:#fff8e1;
        border-left:5px solid #ffc107;
        border-radius:10px;
    "
>

<strong>Important</strong>

<p style="margin:10px 0 0;">

If the URL opens inside an email service such as <strong>YOPmail</strong>,
copy the complete URL above and paste it into the browser where you are
already logged in as an <strong>Administrator</strong>.

</p>

</div>

<p style="margin-top:35px;">

Regards,

<br>

<strong>Plantora System</strong>

</p>
`,
    }),
  };
};

// Generate seller approved email
const getSellerApprovedEmail = (name, dashboardUrl) => {
  return {
    subject: "Your Seller Account Has Been Approved!",

    text: `
Congratulations ${name},

Great news!

Your Plantora seller account request has been approved.

You can now log in to your seller dashboard and start listing your products.

Seller Dashboard:

${dashboardUrl}

Welcome to the Plantora Seller Community!

You now have full access to your Seller Dashboard.

Regards,
Plantora Team
`,

    html: createEmailLayout({
      title: "Seller Account Approved",

      content: `
<p style="margin-top:0;">

Hello <strong>${name}</strong>,

</p>

<p>

🎉 Congratulations!

</p>

<p>

Your request to become a seller on
<strong>Plantora</strong> has been
approved successfully.

</p>

<p>

You can now manage products, receive orders,
track sales, and grow your business with us.

</p>

</div>

<div
    style="
        margin-top:35px;
        padding:20px 22px;
        background:${BRAND.primarySoft};
        border-left:5px solid ${BRAND.primary};
        border-radius:10px;
    "
>

<strong>You can now:</strong>

<ul
    style="
        margin:12px 0 0;
        padding-left:20px;
    "
>

<li>

Add new products

</li>

<li>

Manage inventory

</li>

<li>

Track sales performance

</li>

<li>

Grow your Plantora business

</li>

</ul>

</div>

<p style="margin-top:35px;">

We wish you great success on Plantora.

<br><br>

<strong>Team Plantora 🌿</strong>

</p>
`,
    }),
  };
};

// Generate seller rejected email
const getSellerRejectedEmail = (name, remark) => {
  return {
    subject: "Seller Request Update",

    text: `
Hello ${name},

Unfortunately, your seller account request could not be approved.

Reason:

${remark || "No remark provided."}

You may submit another seller request after 7 days.

Please review the rejection reason before applying again.

Regards,
Plantora Team
`,

    html: createEmailLayout({
      title: "Seller Request Rejected",

      content: `
<p style="margin-top:0;">

Hello <strong>${name}</strong>,

</p>

<p>

Thank you for your interest in becoming a
Plantora seller.

</p>

<p>

After reviewing your application,
we're unable to approve your seller request
at this time.

</p>

<div
    style="
        margin:35px 0;
        padding:20px;
        background:#fff5f5;
        border-left:5px solid ${BRAND.danger};
        border-radius:10px;
    "
>

<strong>Reason for Rejection</strong>

<p
    style="
        margin:12px 0 0;
    "
>

${remark || "No remark was provided."}

</p>

</div>

<p>

You may submit another seller request after
7 days.

Before applying again, please review the
reason above and make the necessary changes.

</p>

<p>

If you believe this decision was made in error,
please contact Plantora support.

</p>

<p style="margin-top:35px;">

Thank you for choosing Plantora.

<br><br>

<strong>Team Plantora 🌿</strong>

</p>
`,
    }),
  };
};

// Export templates
module.exports = {
  getVerificationEmail,
  getResetPasswordEmail,
  getSellerRequestEmail,
  getSellerApprovedEmail,
  getSellerRejectedEmail,
};
