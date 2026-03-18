const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendResetEmail(to, code) {
  const htmlTemplate = `
    <h2>Password Reset</h2>
    <p>Your 6-digit reset code is: <b>${code}</b></p>
    <p>It expires in 15 minutes.</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: 'Password Reset Code',
    html: htmlTemplate,
  });
}

module.exports = sendResetEmail;
