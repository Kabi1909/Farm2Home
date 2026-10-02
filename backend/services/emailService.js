import nodemailer from "nodemailer";
import ApiError from "../utils/ApiError.js";

const requiredSettings = [
  "SMTP_SERVICE",
  "SMTP_USER",
  "SMTP_PASS",
  "CONTACT_RECEIVER_EMAIL",
];

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const isEmailServiceConfigured = (config) =>
  requiredSettings.every((setting) => config[setting]?.trim());

export function warnIfEmailServiceUnavailable(config) {
  if (!isEmailServiceConfigured(config))
    console.warn(
      "Email service is not configured. Contact form email sending is disabled.",
    );
}

function messageContent({ name, email, phone, subject, message }) {
  const optionalPhone = phone ? `\nPhone: ${phone}` : "";
  return {
    subject: `Farm2Home - New Contact Message: ${subject}`,
    text: [
      "Farm2Home - New Contact Message",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      ...(phone ? [`Phone: ${phone}`] : []),
      `Subject: ${subject}`,
      "",
      "Message:",
      message,
    ].join("\n"),
    html: `
      <h1>Farm2Home - New Contact Message</h1>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      ${optionalPhone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ""}
      <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <hr />
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replaceAll("\n", "<br />")}</p>
    `.trim(),
  };
}

export async function sendContactEmail(contact, config, transport) {
  if (!isEmailServiceConfigured(config))
    throw new ApiError(
      503,
      "Email service is unavailable. Please try again later.",
    );

  const client =
    transport ||
    nodemailer.createTransport({
      service: config.SMTP_SERVICE,
      auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
    });
  const content = messageContent(contact);

  try {
    await client.sendMail({
      from: config.SMTP_USER,
      to: config.CONTACT_RECEIVER_EMAIL,
      replyTo: contact.email,
      ...content,
    });
  } catch (error) {
    console.error("Contact email delivery failed.", {
      code: error?.code,
      command: error?.command,
    });
    throw new ApiError(
      503,
      "Email service is unavailable. Please try again later.",
    );
  }
}
