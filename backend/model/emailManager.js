import nodemailer from "nodemailer";

function generateText(length) {
  const text = "ABCHEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let ticketid = "";
  for (let i = 0; i < length; i += 1) {
    ticketid += text.charAt(Math.floor(Math.random() * text.length));
  }
  return ticketid;
}

export async function sendEmail(toEmail) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  });

  const ticketId = generateText(6);
  const mailOptions = {
    to: toEmail,
    subject: `Ticket created - Ticket ID: ${ticketId}`,
    html: `<h3>Support Ticket Created</h3>
               <p>Your ticket has been successfully created.</p>
               <p>Ticket ID: <b>${ticketId}</b></p>
               <p>Status: <b>Open</b></p>
               <p>Our support team will contact you shortly.</p>
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
