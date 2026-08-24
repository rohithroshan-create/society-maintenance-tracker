const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

/**
 * Sends an email if SMTP is configured; otherwise logs it to the console.
 * Never throws — a failed/missing email setup must not break the app.
 */
async function sendMail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[email:skipped - SMTP not configured] to=${to} subject="${subject}"`);
    return { sent: false, reason: "smtp_not_configured" };
  }
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || "Society Maintenance <no-reply@society.local>",
      to,
      subject,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error("[email:error]", err.message);
    return { sent: false, reason: err.message };
  }
}

function statusChangeEmail({ residentName, ticketNo, category, status, note }) {
  return {
    subject: `Complaint ${ticketNo} is now ${status}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px;">
        <h2 style="margin-bottom: 4px;">Complaint update</h2>
        <p>Hi ${residentName},</p>
        <p>Your complaint <strong>${ticketNo}</strong> (${category}) has been updated to:</p>
        <p style="font-size: 18px; font-weight: bold;">${status}</p>
        ${note ? `<p style="color:#555;">Note from admin: ${note}</p>` : ""}
        <p>You can log in to the Society Maintenance Tracker to see the full history.</p>
      </div>
    `,
  };
}

function noticeEmail({ residentName, title, body }) {
  return {
    subject: `Important notice: ${title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px;">
        <h2 style="margin-bottom: 4px;">📌 Important notice</h2>
        <p>Hi ${residentName},</p>
        <h3>${title}</h3>
        <p>${body}</p>
      </div>
    `,
  };
}

module.exports = { sendMail, statusChangeEmail, noticeEmail };
