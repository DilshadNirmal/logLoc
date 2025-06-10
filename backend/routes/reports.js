const express = require("express");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { promisify } = require("util");
const { Worker } = require("worker_threads");
const mongoose = require("mongoose");
const compression = require("compression");
const NodeCache = require("node-cache");

const auth = require("../middleware/auth.js");
const {
  getAverageData,
  getIntervalData,
  getDateData,
  getCountData,
  getSampleData,
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

// Initialize cache with 10-minute TTL and max 100MB size
const cache = new NodeCache({
  stdTTL: 600, // 10 minutes
  checkperiod: 120, // Check for expired keys every 2 minutes
  maxKeys: 1000, // Maximum number of keys in cache
  useClones: false, // Don't clone objects (better performance)
});

// Apply compression middleware to all routes
router.use(
  compression({
    level: 6, // Balanced compression level
    threshold: 1024, // Only compress responses larger than 1KB
  })
);

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
    }

    // Cache the temp directory path
    tempDirCache = tempDir;
    return path.join(tempDir, filename);
  } catch (err) {
    // Fall back to os.tmpdir() if we can't create our own
    const systemTempDir = os.tmpdir();

    // Cache the temp directory path
    tempDirCache = systemTempDir;
    return path.join(systemTempDir, filename);
  }
}

/**
 * Generate cache key based on request parameters
 * @param {Object} params - Request parameters
 * @returns {string} Cache key
 */
function generateCacheKey(params) {
  const {
    reportType,
    configuration,
    dateRange,
    averageBy,
    interval,
    selectedSensors,
  } = params;

  // Create a deterministic string from the parameters
  return JSON.stringify({
    reportType,
    configuration,
    dateRange,
    averageBy,
    interval,
    selectedSensors: selectedSensors ? [...selectedSensors].sort() : [],
  });
}

/**
 * Handles data fetching for charts and visualizations
 */
router.post("/fetch-data", auth, async (req, res) => {
  try {
    const {
      reportType,
      configuration,
      dateRange,
      averageBy,
      interval,
      sensorIds,
    } = req.body;

    console.log(
      "reportType:",
      reportType,
      configuration,
      dateRange,
      averageBy,
      interval,
      "sensorIds: ",
      sensorIds,
      req.body.customCount
    );

    const selectedSensors = sensorIds.map((sensorId) => sensorId);

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

    // Generate cache key
    const cacheParams = {
      reportType: req.body.reportType,
      configuration: req.body.configuration,
      dateRange: req.body.dateRange,
      averageBy: req.body.averageBy,
      interval: req.body.interval,
      selectedSensors: selectedSensors, // Map sensorIds to selectedSensors
    };
    const cacheKey = `data_${generateCacheKey(cacheParams)}`;

    // Check if data is in cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        message: "Data retrieved from cache",
        data: cachedData,
        cached: true,
      });
    }

    // Fetch data based on report type
    let data;
    switch (reportType) {
      case "average":
        if (!averageBy) {
          return res.status(400).json({
            success: false,
            message: "Average by parameter is required",
          });
        }
        data = await getAverageData(
          configuration,
          dateRange,
          averageBy,
          sensorIds
        );
        break;

      case "interval":
        if (!interval) {
          return res.status(400).json({
            success: false,
            message: "Interval parameter is required",
          });
        }
        data = await getIntervalData(
          configuration,
          dateRange,
          interval,
          sensorIds
        );
        break;

      case "date":
        data = await getDateData(configuration, dateRange, sensorIds);
        break;

      case "count":
        // Parse selectedCounts if it's a string (from query params)
        let selectedCounts = {};
        if (req.body.selectedCounts) {
          if (typeof req.body.selectedCounts === "string") {
            try {
              selectedCounts = JSON.parse(req.body.selectedCounts);
            } catch (e) {
              console.warn("Failed to parse selectedCounts:", e);
              selectedCounts = { last100: true }; // Default to last 100 if parsing fails
            }
          } else {
            selectedCounts = req.body.selectedCounts;
          }
        } else {
          selectedCounts = { last100: true }; // Default value if not provided
        }

        const customCount = req.body.customCount
          ? parseInt(req.body.customCount, 10)
          : 0;

        data = await getCountData({
          selectedCounts,
          customCount,
          selectedSensors,
          configuration,
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid report type",
        });
    }

    // Store in cache if data is not too large (< 5MB)
    if (data && JSON.stringify(data).length < 5 * 1024 * 1024) {
      cache.set(cacheKey, data);
    }

    res.json({
      success: true,
      message: "Data fetched successfully",
      data,
      cached: false,
    });
  } catch (error) {
    console.error("Data fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

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
      selectedSensors,
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

    // Generate cache key for Excel file
    const cacheKey = `excel_${generateCacheKey(req.body)}`;
    const cachedFilePath = cache.get(cacheKey);

    // If we have a cached file path and the file exists, use it
    if (cachedFilePath && fs.existsSync(cachedFilePath)) {
      tempFilePath = cachedFilePath;
    } else {
      // Create a temporary file path for the Excel file
      const tempFileName = `report_${Date.now()}.xlsx`;
      tempFilePath = await getTempFilePath(tempFileName);

      let data = [];
      let filename = "";

      // Fetch data based on report type
      switch (reportType) {
        case "average":
          if (!averageBy) {
            return res.status(400).json({
              success: false,
              message: "Average by parameter is required",
            });
          }

          data = await getAverageData(
            configuration,
            dateRange,
            averageBy,
            selectedSensors
          );
          filename = `Average_Data_${dateRange.from}_to_${dateRange.to}.xlsx`;
          await generateExcelFile(data, reportType, tempFilePath, {
            averageBy,
          });
          break;

        case "interval":
          if (!interval) {
            return res.status(400).json({
              success: false,
              message: "Interval parameter is required",
            });
          }

          data = await getIntervalData(
            configuration,
            dateRange,
            interval,
            selectedSensors
          );
          filename = `Interval_Data_${dateRange.from}_to_${dateRange.to}.xlsx`;
          await generateExcelFile(data, reportType, tempFilePath, { interval });
          break;

        case "date":
          data = await getDateData(configuration, dateRange, selectedSensors); // Fetch date data
          filename = `Date_Data_${dateRange.from}_to_${dateRange.to}.xlsx`;
          await generateExcelFile(data, reportType, tempFilePath);
          break;

        case "count":
          data = await getCountData({
            selectedCounts,
            customCount,
            configuration,
            selectedSensors,
          });
          filename = `Count_Data_${
            new Date().toISOString().split("T")[0]
          }.xlsx`;
          await generateExcelFile(data, reportType, tempFilePath);
          break;

        default:
          return res.status(400).json({
            success: false,
            message: "Invalid report type",
          });
      }

      // Cache the file path for future requests (5 minute TTL)
      cache.set(cacheKey, tempFilePath, 300);
    }

    // Verify the file exists before sending
    if (!fs.existsSync(tempFilePath)) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate Excel file: File not found",
      });
    }

    // Determine filename based on report type
    let filename;
    switch (reportType) {
      case "average":
        filename = `Average_Data_${dateRange.from}_to_${dateRange.to}.xlsx`;
        break;
      case "interval":
        filename = `Interval_Data_${dateRange.from}_to_${dateRange.to}.xlsx`;
        break;
      case "date":
        filename = `Date_Data_${dateRange.from}_to_${dateRange.to}.xlsx`;
        break;
      case "count":
        filename = `Count_Data_${new Date().toISOString().split("T")[0]}.xlsx`;
        break;
      default:
        filename = "report.xlsx";
    }

    // Send the file to the client
    res.download(tempFilePath, filename, (err) => {
      if (err) {
        console.error("Error sending file:", err);
      }

      // For cached files, don't delete them
      if (!cache.has(`excel_${generateCacheKey(req.body)}`)) {
        // Delete the temporary file after sending
        // Use setTimeout to ensure file is fully sent before deletion
        setTimeout(() => {
          fs.unlink(tempFilePath, (unlinkErr) => {
            if (unlinkErr && unlinkErr.code !== "ENOENT") {
              console.error("Error deleting temporary file:", unlinkErr);
            }
          });
        }, 1000);
      }
    });
  } catch (error) {
    console.error("Excel export error:", error);

    // Clean up temp file if it exists and there was an error
    if (
      tempFilePath &&
      fs.existsSync(tempFilePath) &&
      !cache.has(`excel_${generateCacheKey(req.body)}`)
    ) {
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

/**
 * Clear cache endpoint (admin only)
 */
router.post("/clear-cache", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Admin privileges required",
      });
    }

    const stats = cache.getStats();
    cache.flushAll();

    res.json({
      success: true,
      message: "Cache cleared successfully",
      previousStats: stats,
    });
  } catch (error) {
    console.error("Cache clear error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear cache",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
