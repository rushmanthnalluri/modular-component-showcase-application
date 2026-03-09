import nodemailer from "nodemailer";

const HARD_CODED_SMTP_USER = "rushmanth21@gmail.com";
const HARD_CODED_SMTP_PASS = "grec rjjo pube keye";

function toBoolean(value) {
  return String(value || "").toLowerCase() === "true";
}

function createEmailTransport() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER || HARD_CODED_SMTP_USER;
  const pass = process.env.SMTP_PASS || HARD_CODED_SMTP_PASS;

  if (!user || !pass) {
    // Dev-safe fallback: logs the message payload instead of sending it.
    return nodemailer.createTransport({ jsonTransport: true });
  }

  const secure =
    typeof process.env.SMTP_SECURE === "string"
      ? toBoolean(process.env.SMTP_SECURE)
      : port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
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

export async function sendEmail({ toEmail, subject, text, html }) {
  const mailoptions = {
    from: getFromAddress(),
    to: toEmail,
    subject: subject,
    text,
    html,
  };

  return transporter.sendMail(mailoptions);
}

export async function sendPasswordResetNotification(toEmail) {
  const ticketId = Math.random().toString(36).slice(2, 10).toUpperCase();
  const subject = `Ticket created ticket id ${ticketId}`;
  const text = `Ticket created successfully. Ticket ID: ${ticketId}`;
  const html = [
    "<p>Ticket created successfully.</p>",
    `<p>Ticket ID: <strong>${ticketId}</strong></p>`,
  ].join("");

  return sendEmail({
    toEmail,
    subject: subject,
    text,
    html,
  });
}
