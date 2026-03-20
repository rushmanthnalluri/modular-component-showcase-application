import nodemailer from "nodemailer";

function generateText(length) {
  const text = "ABCHEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let ticketid = "";
  for (let i = 0; i < length; i += 1) {
    ticketid += text.charAt(Math.floor(Math.random() * text.length));
  }
  return ticketid;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendEmail(toEmail, ticket = null) {
  const smtpUser = String(process.env.SMTP_USER || "").trim();
  const smtpPass = String(process.env.SMTP_PASS || "").trim();

  // Keep support ticket flow working even when SMTP is not configured.
  if (!smtpUser || !smtpPass) {
    console.warn("SMTP credentials are missing. Ticket created without sending email notification.");
    return {
      code: 200,
      msg: "Support ticket created. Email notification is temporarily unavailable.",
    };
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const ticketId = generateText(6);
  const ticketTitle = String(ticket?.title || "General Support");
  const ticketCategory = String(ticket?.category || "General");
  const ticketDescription = String(ticket?.description || "No description provided.");
  const ticketName = String(ticket?.name || "Anonymous");
  const safeTitle = escapeHtml(ticketTitle);
  const safeCategory = escapeHtml(ticketCategory);
  const safeDescription = escapeHtml(ticketDescription).replace(/\n/g, "<br/>");
  const safeName = escapeHtml(ticketName);
  const fromAddress = String(process.env.SMTP_FROM || smtpUser).trim() || "no-reply@modularshowcase.local";

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: `Ticket created - ${ticketTitle} - Ticket ID: ${ticketId}`,
    html: `<h3>Support Ticket Created</h3>
               <p>A new support ticket has been raised.</p>
               <p>Ticket ID: <b>${ticketId}</b></p>
               <p>From: <b>${safeName}</b></p>
               <p>Title: <b>${safeTitle}</b></p>
               <p>Category: <b>${safeCategory}</b></p>
               <p>Description:</p>
               <p>${safeDescription}</p>
               <p>Status: <b>Open</b></p>
               <br/>
               <p>Regards,<br/>Support Team</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { code: 200, msg: "Support ticket created" };
  } catch (err) {
    return { code: 401, msg: err.message };
  }
}
