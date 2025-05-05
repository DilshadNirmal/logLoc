const express = require("express");
const fs = require("fs");
const path = require("path");
const os = require("os");

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

const router = express.Router();

router.post("/export-excel", auth, async (req, res) => {
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
    let data = [];
    let filename = "";

    // Create a temporary file path for the Excel file
    const tempFilePath = path.join(os.tmpdir(), `report_${Date.now()}.xlsx`);

    // fetching data based on report type
    switch (reportType) {
      case "average":
        data = await getAverageData(configuration, dateRange, averageBy);
        filename = `Average_Data_${dateRange.from}_to_${dateRange.to}.xlsx`;
        await generateExcelFile(data, reportType, tempFilePath);
        break;
      case "interval":
        data = await getIntervalData(configuration, dateRange, interval);
        filename = `Interval_Data_${dateRange.from}_to_${dateRange.to}.xlsx`;
        await generateExcelFile(data, reportType, tempFilePath);
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

    // Send the file to the client
    res.download(tempFilePath, filename, (err) => {
      if (err) {
        console.error("Error sending file:", err);
      }

      // Delete the temporary file after sending
      fs.unlink(tempFilePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error("Error deleting temporary file:", unlinkErr);
        }
      });
    });
  } catch (error) {
    console.error("Excel export error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate Excel file",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
