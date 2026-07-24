// GreenNest logo URL
const logoUrl = `${process.env.APP_URL}/images/logo/greennest-logo.png`;

// Generate email verification template
const getVerificationEmail = (name, verificationUrl) => {
  return {
    subject: "Verify Your GreenNest Account",

    text: `
Welcome to GreenNest!

Hello ${name},

Thank you for creating your GreenNest account.

Please verify your email by visiting the link below:

${verificationUrl}

If you did not create this account, you can safely ignore this email.

Regards,
GreenNest Team
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
  alt="GreenNest"
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
Thank you for registering with <strong>GreenNest</strong>.

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
If you didn't create a GreenNest account,
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
© ${new Date().getFullYear()} GreenNest.
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
    subject: "Reset Your GreenNest Password",

    text: `
Password Reset Request

Hello ${name},

We received a request to reset your GreenNest password.

Reset it using the link below:

${resetUrl}

If you didn't request this password reset, simply ignore this email.

Regards,
GreenNest Team
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
  alt="GreenNest"
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
We received a request to reset your GreenNest account password.
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
© ${new Date().getFullYear()} GreenNest.
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

module.exports = {
  getVerificationEmail,
  getResetPasswordEmail,
};
