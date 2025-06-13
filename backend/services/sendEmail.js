const { transporter } = require("../utils/mailUtil.js");

const sendEmail = async (options) => {
  try {
    const { to, subject, text, html, attachments } = options;

    if (!to || !subject) {
      throw new Error("Missing required email fields");
    }

    const mailOptions = {
      from: {
        name: "LogLoc System",
        address: process.env.SMTP_FROM_EMAIL,
      },
      to,
      subject,
      text: text || "",
      html: html || "",
      attachments: attachments || [],
    };

    const info = await transporter.sendMail(mailOptions);

    if (!info || !info.messageId) {
      throw new Error("Failed to send email - no message ID received");
    }

    return info;
  } catch (error) {
    console.error("Error sending email:", {
      message: error.message,
      code: error.code,
      command: error.command,
      stack: error.stack,
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = sendEmail;
