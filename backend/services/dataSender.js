const mongoose = require("mongoose");
const { formatDataToHTML, sgMail } = require("./emailService");
const generatePDF = require("./generatePDF");
const sendEmail = require("./sendEmail");

const activeJobs = new Map();

const getDurationMs = (duration) => {
  const durations = {
    "1h": 60 * 60 * 1000,
    "1d": 24 * 60 * 60 * 1000,
    "1w": 7 * 24 * 60 * 60 * 1000,
    "1m": 30 * 24 * 60 * 60 * 1000,
  };

  return durations[duration];
};

const sendData = async (userEmail, duration) => {
  const durationMs = getDurationMs(duration);

  const endTime = new Date();
  const startTime = new Date(endTime - durationMs);

  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB not connected");
  }

  const data = await mongoose.connection.db
    .collection("sensorData")
    .find({
      timestamp: {
        $gte: startTime,
        $lte: endTime,
      },
    })
    .sort({ timestamp: -1 })
    .toArray();

  if (data.length > 0) {
    try {
      const pdfBuffer = await generatePDF(data);
      // Determine number of records to show in HTML based on duration
      const recordLimits = {
        "1h": 6,
        "1d": 24,
        "1w": 7,
        "1m": 30,
      };

      // Get evenly distributed samples from the data
      const limit = recordLimits[duration];
      const step = Math.max(1, Math.floor(data.length / limit));
      const sampledData = data
        .filter((_, index) => index % step === 0)
        .slice(0, limit);

      const htmlContent = formatDataToHTML(sampledData); // Send limited data to HTML
      const emailText = `Please find attached the sensor data report for the last ${duration}.\n\nTime period: ${startTime.toLocaleString()} to ${endTime.toLocaleString()}\nTotal records: ${
        data.length
      }`;

      if (process.env.USE_SENDGRID === "true") {
        const msg = {
          to: userEmail,
          from: process.env.SENDGRID_FROM_EMAIL,
          subject: `Sensor Data Report - Last ${duration}`,
          text: `Please find attached the sensor data report for the last ${duration}.\n\nTime period: ${startTime.toLocaleString()} to ${endTime.toLocaleString()}\nTotal records: ${
            data.length
          }`,
          html: formatDataToHTML(data),
          attachments: [
            {
              // content: Buffer.from(JSON.stringify(data, null, 2)).toString(
              //   "base64"
              // ),
              // filename: "sensor_data.json",
              content: pdfBuffer.toString("base64"),
              filename: "sensor_data.pdf",
              type: "application/pdf",
              disposition: "attachment",
            },
          ],
        };
        await sgMail.send(msg);
      } else {
        // Use Nodemailer
        const mailOptions = {
          to: userEmail,
          subject: `Sensor Data Report - Last ${duration}`,
          text: emailText,
          html: htmlContent,
          attachments: [
            {
              filename: "sensor_data.pdf",
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        };
        await sendEmail(mailOptions);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }
};

const startDataSending = async (userId, userEmail, duration) => {
  stopDataSending(userId);

  const interval = setInterval(
    () => sendData(userEmail, duration),
    getDurationMs(duration)
  );

  await sendData(userEmail, duration);

  activeJobs.set(userId, {
    interval,
    duration,
  });
};

const stopDataSending = (userId) => {
  const job = activeJobs.get(userId);

  if (job) {
    clearInterval(job.interval);
    activeJobs.delete(userId);
    return true;
  }

  return false;
};

module.exports = {
  startDataSending,
  stopDataSending,
};
