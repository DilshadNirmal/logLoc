const express = require("express");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { promisify } = require("util");

const auth = require("../middleware/auth.js");
const {
  getAverageData,
  getIntervalData,
  getDateData,
  getCountData,
} = require("../services/reports/dataFetcher.js");
const {
  generateExcelFile,
  createExcelWriter,
} = require("../services/reports/excelGenerator.js");

// Promisify fs functions for cleaner async/await usage
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);

const router = express.Router();

// Cache for temp directory path to avoid repeated checks
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

      // Test write permissions by creating a test file
      const testFile = path.join(tempDir, "test.txt");
      await writeFileAsync(testFile, "test");
      await unlinkAsync(testFile); // Clean up test file

      console.log(
        `Successfully created and verified temp directory: ${tempDir}`
      );
    }

    // Cache the temp directory path
    tempDirCache = tempDir;
    return path.join(tempDir, filename);
  } catch (err) {
    console.error(
      "Could not create or write to temp directory, falling back to os.tmpdir()",
      err
    );

    // Fall back to os.tmpdir() if we can't create our own
    const systemTempDir = os.tmpdir();
    console.log(`Using system temp directory: ${systemTempDir}`);

    // Cache the temp directory path
    tempDirCache = systemTempDir;
    return path.join(systemTempDir, filename);
  }
}

/**
 * Handles Excel export requests
 */
router.post("/export-excel", auth, async (req, res) => {
  let tempFilePath = null;

  try {
    const {
      reportType,
      configuration,
      dateRange,
      averageBy,
      interval,
      selectedCounts,
      customCount,
    } = req.body;

    // Validate required parameters
    if (!reportType) {
      return res.status(400).json({
        success: false,
        message: "Report type is required",
      });
    }

    // For reports that need date range, validate it
    if (
      ["average", "interval", "date"].includes(reportType) &&
      (!dateRange || !dateRange.from || !dateRange.to)
    ) {
      return res.status(400).json({
        success: false,
        message: "Date range is required for this report type",
      });
    }

    let data = [];
    let filename = "";

    // Create a temporary file path for the Excel file
    const tempFileName = `report_${Date.now()}.xlsx`;
    tempFilePath = await getTempFilePath(tempFileName);
    console.log(`Attempting to generate Excel file at: ${tempFilePath}`);

    // Fetch data based on report type
    switch (reportType) {
      case "average":
        if (!averageBy) {
          return res.status(400).json({
            success: false,
            message: "Average by parameter is required",
          });
        }

        data = await getAverageData(configuration, dateRange, averageBy);
        filename = `Average_Data_${dateRange.from}_to_${dateRange.to}.xlsx`;
        await generateExcelFile(data, reportType, tempFilePath, { averageBy });
        break;

      case "interval":
        if (!interval) {
          return res.status(400).json({
            success: false,
            message: "Interval parameter is required",
          });
        }

        data = await getIntervalData(configuration, dateRange, interval);
        filename = `Interval_Data_${dateRange.from}_to_${dateRange.to}.xlsx`;
        await generateExcelFile(data, reportType, tempFilePath, { interval });
        break;

      case "date":
        filename = `Date_Data_${dateRange.from}_to_${dateRange.to}.xlsx`;
        // Create an Excel writer for streaming
        const excelWriter = createExcelWriter(reportType, tempFilePath);
        // Pass the Excel writer to getDateData for streaming
        await getDateData(configuration, dateRange, excelWriter);
        break;

      case "count":
        data = await getCountData({ selectedCounts, customCount });
        filename = `Count_Data_${new Date().toISOString().split("T")[0]}.xlsx`;
        await generateExcelFile(data, reportType, tempFilePath);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid report type",
        });
    }

    // Verify the file exists before sending
    if (!fs.existsSync(tempFilePath)) {
      console.error(`File not found at path: ${tempFilePath}`);
      return res.status(500).json({
        success: false,
        message: "Failed to generate Excel file: File not found",
      });
    }

    // Send the file to the client
    res.download(tempFilePath, filename, (err) => {
      if (err) {
        console.error("Error sending file:", err);
      }

      // Delete the temporary file after sending
      // Use setTimeout to ensure file is fully sent before deletion
      setTimeout(() => {
        fs.unlink(tempFilePath, (unlinkErr) => {
          if (unlinkErr && unlinkErr.code !== "ENOENT") {
            console.error("Error deleting temporary file:", unlinkErr);
          }
        });
      }, 1000);
    });
  } catch (error) {
    console.error("Excel export error:", error);

    // Clean up temp file if it exists and there was an error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        await unlinkAsync(tempFilePath);
      } catch (unlinkErr) {
        console.error("Error cleaning up temporary file:", unlinkErr);
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to generate Excel file",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
