const nodemailer = require("nodemailer");

// Create reusable transporter object using Gmail SMTP
const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Verify connection configuration
  transporter.verify((error, success) => {
    if (error) {
      console.error("SMTP Connection Error:", error);
    } else {
      console.log("SMTP Server is ready to take messages");
    }
  });

  return transporter;
};

const transporter = createTransporter();

module.exports = { transporter };
