const nodemailer = require("nodemailer");

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP configuration is incomplete");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

const sendVerificationEmail = async ({ to, name, verificationUrl }) => {
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  const appName = process.env.APP_NAME || "CivicLens";

  const transporter = getTransporter();

  const text = [
    `Hi ${name},`,
    "",
    `Welcome to ${appName}. Please verify your email address by visiting this link:`,
    verificationUrl,
    "",
    "This link will expire in 24 hours.",
    "If you did not create an account, please ignore this email.",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a202c;">
      <h2 style="margin-bottom: 8px;">Welcome to ${appName}</h2>
      <p>Hi ${name},</p>
      <p>Please verify your email address to activate your account.</p>
      <p>
        <a href="${verificationUrl}" style="display: inline-block; background: #667eea; color: white; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Verify Email
        </a>
      </p>
      <p style="font-size: 14px; color: #4a5568;">This link will expire in 24 hours.</p>
      <p style="font-size: 14px; color: #4a5568;">If you did not create an account, please ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: `${appName} - Verify your email`,
    text,
    html,
  });
};

module.exports = {
  sendVerificationEmail,
};
