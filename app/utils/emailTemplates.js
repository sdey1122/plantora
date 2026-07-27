// Plantora logo URL
// const logoUrl = `${process.env.APP_URL}/images/logo/logo-green.svg`;
const logoUrl =
  "https://res.cloudinary.com/desmwasfe/image/upload/c_fit,h_300,w_300/plantora_c99t9q.png";

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

If you did not create this account, you can safely ignore this email.

Regards,
Plantora Team
`,

    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Verify Your Email</title>
</head>

<body
  style="
    margin:0;
    padding:40px 0;
    background:#f5f7fa;
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
    background:#ffffff;
    border-radius:12px;
    overflow:hidden;
    box-shadow:0 2px 10px rgba(0,0,0,.08);
  "
>

<tr>
<td
  align="center"
  style="
    padding:35px 20px 20px;
  "
>

<img
  src="${logoUrl}"
  alt="Plantora"
  width="180"
  style="display:block;"
>

</td>
</tr>

<tr>
<td
  style="
    padding:0 40px 20px;
    color:#212529;
  "
>

<h1
  style="
    margin:0;
    color:#198754;
    text-align:center;
    font-size:28px;
  "
>
Verify Your Email
</h1>

<p
  style="
    margin-top:35px;
    font-size:16px;
    line-height:1.8;
  "
>
Hello <strong>${name}</strong>,
</p>

<p
  style="
    font-size:16px;
    line-height:1.8;
  "
>
Thank you for registering with <strong>Plantora</strong>.

Before getting started, please verify your email address by clicking the button below.
</p>

<div
  style="
    text-align:center;
    margin:45px 0;
  "
>

<a
  href="${verificationUrl}"
  style="
    background:#198754;
    color:#ffffff;
    text-decoration:none;
    padding:15px 35px;
    border-radius:8px;
    display:inline-block;
    font-size:16px;
    font-weight:bold;
  "
>
Verify Email
</a>

</div>

<p
  style="
    font-size:15px;
    line-height:1.8;
  "
>
If the button above doesn't work, copy and paste the following link into your browser:
</p>

<p
  style="
    word-break:break-word;
  "
>
<a
  href="${verificationUrl}"
  style="
    color:#198754;
  "
>
${verificationUrl}
</a>
</p>

<hr
  style="
    border:none;
    border-top:1px solid #eeeeee;
    margin:35px 0;
  "
>

<p
  style="
    color:#6c757d;
    font-size:14px;
    line-height:1.8;
  "
>
If you didn't create a Plantora account,
you can safely ignore this email.
No further action is required.
</p>

</td>
</tr>

<tr>
<td
  style="
    background:#f8f9fa;
    padding:25px;
    text-align:center;
    color:#6c757d;
    font-size:13px;
  "
>

<p style="margin:0;">
© ${new Date().getFullYear()} Plantora.
All rights reserved.
</p>

<p style="margin-top:10px;">
This is an automated email.
Please do not reply to this message.
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`,
  };
};

// Generate password reset template
const getResetPasswordEmail = (name, resetUrl) => {
  return {
    subject: "Reset Your Plantora Password",

    text: `
Password Reset Request

Hello ${name},

We received a request to reset your Plantora password.

Reset it using the link below:

${resetUrl}

If you didn't request this password reset, simply ignore this email.

Regards,
Plantora Team
`,

    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Reset Password</title>
</head>

<body
  style="
    margin:0;
    padding:40px 0;
    background:#f5f7fa;
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
    background:#ffffff;
    border-radius:12px;
    overflow:hidden;
    box-shadow:0 2px 10px rgba(0,0,0,.08);
  "
>

<tr>
<td
  align="center"
  style="
    padding:35px 20px 20px;
  "
>

<img
  src="${logoUrl}"
  width="180"
  alt="Plantora"
>

</td>
</tr>

<tr>
<td
  style="
    padding:0 40px 20px;
  "
>

<h1
  style="
    color:#dc3545;
    text-align:center;
    margin:0;
  "
>
Reset Your Password
</h1>

<p
  style="
    margin-top:35px;
    font-size:16px;
    line-height:1.8;
  "
>
Hello <strong>${name}</strong>,
</p>

<p
  style="
    font-size:16px;
    line-height:1.8;
  "
>
We received a request to reset your Plantora account password.
</p>

<div
  style="
    text-align:center;
    margin:45px 0;
  "
>

<a
  href="${resetUrl}"
  style="
    background:#dc3545;
    color:#ffffff;
    padding:15px 35px;
    text-decoration:none;
    border-radius:8px;
    display:inline-block;
    font-weight:bold;
  "
>
Reset Password
</a>

</div>

<p
  style="
    font-size:15px;
    line-height:1.8;
  "
>
If the button doesn't work, copy this link into your browser:
</p>

<p style="word-break:break-word;">
<a
  href="${resetUrl}"
  style="
    color:#198754;
  "
>
${resetUrl}
</a>
</p>

<hr
  style="
    border:none;
    border-top:1px solid #eeeeee;
    margin:35px 0;
  "
>

<p
  style="
    color:#dc3545;
    font-size:14px;
    line-height:1.8;
    font-weight:bold;
  "
>
If you did not request a password reset,
please ignore this email immediately.
</p>

</td>
</tr>

<tr>
<td
  style="
    background:#f8f9fa;
    padding:25px;
    text-align:center;
    color:#6c757d;
    font-size:13px;
  "
>

<p style="margin:0;">
© ${new Date().getFullYear()} Plantora.
All rights reserved.
</p>

<p style="margin-top:10px;">
This is an automated email.
Please do not reply to this message.
</p>

</td>
</tr>

</table>

</td>
</tr>

</table>

</body>
</html>
`,
  };
};

// Generate seller request email for admin
const getSellerRequestEmail = (customerName, customerEmail, dashboardUrl) => {
  return {
    subject: "New Seller Request - Plantora",

    text: `
New Seller Request

Hello Admin,

${customerName} has requested to become a seller.

Customer Name:
${customerName}

Customer Email:
${customerEmail}

Review the request from the admin dashboard:

${dashboardUrl}

Regards,
Plantora
`,

    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>New Seller Request</title>
</head>

<body
style="
margin:0;
padding:40px 0;
background:#f5f7fa;
font-family:Arial,Helvetica,sans-serif;
">

<table
width="100%"
cellspacing="0"
cellpadding="0">

<tr>
<td align="center">

<table
width="600"
cellspacing="0"
cellpadding="0"
style="
background:#ffffff;
border-radius:12px;
overflow:hidden;
box-shadow:0 2px 10px rgba(0,0,0,.08);
">

<tr>
<td
align="center"
style="padding:35px 20px 20px;">

<img
src="${logoUrl}"
width="180"
alt="Plantora">

</td>
</tr>

<tr>
<td
style="
padding:0 40px 20px;">

<h1
style="
margin:0;
text-align:center;
color:#198754;">
New Seller Request
</h1>

<p
style="
margin-top:35px;
font-size:16px;
line-height:1.8;">
A customer has requested to become a seller.
</p>

<table
width="100%"
cellpadding="8"
style="
border-collapse:collapse;
margin-top:25px;">

<tr>
<td><strong>Name</strong></td>
<td>${customerName}</td>
</tr>

<tr>
<td><strong>Email</strong></td>
<td>${customerEmail}</td>
</tr>

</table>

<div
style="
text-align:center;
margin:40px 0;">

<a
href="${dashboardUrl}"
style="
background:#198754;
color:#ffffff;
padding:15px 35px;
text-decoration:none;
border-radius:8px;
display:inline-block;
font-weight:bold;">
Review Request
</a>

</div>

</td>
</tr>

<tr>
<td
style="
background:#f8f9fa;
padding:25px;
text-align:center;
font-size:13px;
color:#6c757d;">

<p style="margin:0;">
© ${new Date().getFullYear()} Plantora. All rights reserved.
</p>

</td>
</tr>

</table>

</td>
</tr>

</table>

</body>
</html>
`,
  };
};

// Generate seller approved email
const getSellerApprovedEmail = (name, dashboardUrl) => {
  return {
    subject: "Seller Account Approved - Plantora",

    text: `
Congratulations ${name},

Your seller account request has been approved.

You can now start selling products on Plantora.

Seller Dashboard:
${dashboardUrl}

Regards,
Plantora Team
`,

    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Seller Approved</title>
</head>

<body style="margin:0;padding:40px 0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellspacing="0" cellpadding="0">
<tr>
<td align="center">

<table width="600" cellspacing="0" cellpadding="0"
style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.08);">

<tr>
<td align="center" style="padding:35px;">
<img src="${logoUrl}" width="180">
</td>
</tr>

<tr>
<td style="padding:0 40px 20px;">

<h1 style="color:#198754;text-align:center;">
Seller Account Approved
</h1>

<p>Hello <strong>${name}</strong>,</p>

<p>
Congratulations!
Your seller request has been approved.
You can now start selling products on Plantora.
</p>

<div style="text-align:center;margin:40px 0;">
<a
href="${dashboardUrl}"
style="
background:#198754;
color:#fff;
padding:15px 35px;
text-decoration:none;
border-radius:8px;
display:inline-block;">
Open Seller Dashboard
</a>
</div>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`,
  };
};

// Generate seller rejected email
const getSellerRejectedEmail = (name, remark) => {
  return {
    subject: "Seller Request Update - Plantora",

    text: `
Hello ${name},

Unfortunately your seller request has been rejected.

Admin Remark:

${remark || "No remark provided."}

You may submit a new request after making the necessary changes.

Regards,
Plantora Team
`,

    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Seller Request Rejected</title>
</head>

<body style="margin:0;padding:40px 0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellspacing="0" cellpadding="0">
<tr>
<td align="center">

<table width="600" cellspacing="0" cellpadding="0"
style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.08);">

<tr>
<td align="center" style="padding:35px;">
<img src="${logoUrl}" width="180">
</td>
</tr>

<tr>
<td style="padding:0 40px 20px;">

<h1 style="color:#dc3545;text-align:center;">
Seller Request Rejected
</h1>

<p>Hello <strong>${name}</strong>,</p>

<p>
Unfortunately, your seller request could not be approved.
</p>

<p>
<strong>Admin Remark</strong>
</p>

<div
style="
background:#f8f9fa;
padding:15px;
border-radius:8px;">
${remark || "No remark provided."}
</div>

<p style="margin-top:25px;">
You may update your information and submit another seller request later.
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`,
  };
};

module.exports = {
  getVerificationEmail,
  getResetPasswordEmail,
  getSellerRequestEmail,
  getSellerApprovedEmail,
  getSellerRejectedEmail,
};
