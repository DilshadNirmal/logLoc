const ReportConfig = require("../models/ReportConfig");
const User = require("../models/User");
const sendEmail = require("./sendEmail");
const { generateExcelFile } = require("./reports/excelGenerator.js");
const { getAverageData } = require("./reports/dataFetcher.js");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);

// Cache for temp directory path
let tempDirCache = null;

/**
 * Creates and returns a path for a temporary file
 * @param {string} filename - The filename to use
 * @returns {Promise<string>} The full path to the temporary file
 */
async function getTempFilePath(filename) {
  // Use cached path if available
  if (tempDirCache) {
    return path.join(tempDirCache, filename);
  }

  try {
    // Try to use the project directory first for better reliability
    const projectDir = path.resolve(__dirname, "..");
    const tempDir = path.join(projectDir, "temp");

    // Create the temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      await mkdirAsync(tempDir, { recursive: true });
    }

    // Cache the temp directory path
    tempDirCache = tempDir;
    return path.join(tempDir, filename);
  } catch (err) {
    console.error("Could not create temp directory", err);
    throw err;
  }
}

// Generate and send reports based on frequency
const generateAndSendReports = async () => {
  try {
    const config = await ReportConfig.findById("global").populate(
      "users",
      "UserName Email Role"
    );

    if (!config || !config.users || config.users.length === 0) {
      console.log("No report configuration or users found");
      return;
    }

    // Check if we should send reports based on frequency
    const now = new Date();
    const lastSent = config.lastSent ? new Date(config.lastSent) : null;

    let shouldSendReport = false;

    if (!lastSent) {
      shouldSendReport = true;
    } else {
      switch (config.frequency) {
        case "daily":
          // Send if it's a new day
          shouldSendReport =
            now.getDate() !== lastSent.getDate() ||
            now.getMonth() !== lastSent.getMonth() ||
            now.getFullYear() !== lastSent.getFullYear();
          break;

        case "weekly":
          // Send if it's been at least 7 days
          const dayDiff = Math.floor((now - lastSent) / (1000 * 60 * 60 * 24));
          shouldSendReport = dayDiff >= 7;
          break;

        case "monthly":
          // Send if it's a new month
          shouldSendReport =
            now.getMonth() !== lastSent.getMonth() ||
            now.getFullYear() !== lastSent.getFullYear();
          break;

        default:
          shouldSendReport = false;
      }
    }

    if (!shouldSendReport) {
      console.log(`Not time to send ${config.frequency} report yet`);
      return;
    }

    console.log(
      `Generating ${config.frequency} report for ${config.users.length} users`
    );

    // Generate report data
    // For this example, we'll use the last 24 hours of data for daily reports
    const endDate = new Date();
    let startDate;

    switch (config.frequency) {
      case "daily":
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 1);
        break;
      case "weekly":
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "monthly":
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const dateRange = {
      from: startDate.toISOString(),
      to: endDate.toISOString(),
    };

    // Configuration for data fetching
    const configuration = {
      sensors: Array.from({ length: 40 }, (_, i) => i + 1), // All sensors 1-40
    };

    // Get average data for the report
    const data = await getAverageData(configuration, dateRange, "day");

    if (!data || data.length === 0) {
      console.log("No data available for report");
      return;
    }

    // Create Excel file
    const tempFileName = `report_${config.frequency}_${Date.now()}.xlsx`;
    const tempFilePath = await getTempFilePath(tempFileName);

    await generateExcelFile(data, "average", tempFilePath, {
      averageBy: "day",
    });

    // Send email to each user
    const emailPromises = config.users.map(async (user) => {
      if (!user.Email) {
        console.log(`User ${user._id} has no email address`);
        return;
      }

      const emailOptions = {
        to: user.Email,
        subject: `${
          config.frequency.charAt(0).toUpperCase() + config.frequency.slice(1)
        } Voltage Report`,
        text: `Please find attached your ${config.frequency} voltage report.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #4167B8;">Voltage Report</h2>
            <p>Hello ${user.UserName},</p>
            <p>Please find attached your ${config.frequency} voltage report.</p>
            <p>Report period: ${new Date(
              startDate
            ).toLocaleDateString()} to ${new Date(
          endDate
        ).toLocaleDateString()}</p>
            <p>Thank you for using LogLoc System.</p>
          </div>
        `,
        attachments: [
          {
            filename: `${config.frequency}_voltage_report.xlsx`,
            path: tempFilePath,
          },
        ],
      };

      try {
        await sendEmail(emailOptions);
        console.log(`Report sent to ${user.Email}`);
      } catch (error) {
        console.error(`Failed to send report to ${user.Email}:`, error);
      }
    });

    await Promise.all(emailPromises);

    // Update last sent time
    config.lastSent = new Date();
    await config.save();

    // Clean up temp file
    try {
      await unlinkAsync(tempFilePath);
    } catch (unlinkErr) {
      console.error("Error cleaning up temporary file:", unlinkErr);
    }

    console.log(`${config.frequency} report sent successfully`);
  } catch (error) {
    console.error("Error generating and sending reports:", error);
  }
};

// Initialize the scheduler
const initReportScheduler = () => {
  // Check every hour if reports need to be sent
  const ONE_HOUR = 12 * 60 * 60 * 1000;

  // Initial check after 1 minute of server start
  setTimeout(() => {
    generateAndSendReports();

    // Then check every hour
    setInterval(generateAndSendReports, ONE_HOUR);
  }, 60 * 1000);

  console.log("Report scheduler initialized");
};

module.exports = {
  initReportScheduler,
  generateAndSendReports,
};
