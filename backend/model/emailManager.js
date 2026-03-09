import nodemailer from "nodemailer";

function toBoolean(value) {
  return String(value || "").toLowerCase() === "true";
}

function createEmailTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    // Dev-safe fallback: logs the message payload instead of sending it.
    return nodemailer.createTransport({ jsonTransport: true });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: toBoolean(process.env.SMTP_SECURE),
    auth: {
      user,
      pass,
    },
  });
}

const transporter = createEmailTransport();

function getFromAddress() {
  return process.env.MAIL_FROM || process.env.SMTP_USER || "no-reply@localhost";
}

export async function sendEmail({ to, subject, text, html }) {
  return transporter.sendMail({
    from: getFromAddress(),
    to,
    subject,
    text,
    html,
  });
}

export async function sendPasswordResetNotification(toEmail) {
  const subject = "Your password was changed";
  const text = "Your account password was changed successfully. If this was not you, contact support immediately.";
  const html = [
    "<p>Your account password was changed successfully.</p>",
    "<p>If this was not you, contact support immediately.</p>",
  ].join("");

  return sendEmail({
    to: toEmail,
    subject,
    text,
    html,
  });
}
