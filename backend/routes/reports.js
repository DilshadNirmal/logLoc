const express = require("express");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { promisify } = require("util");
const compression = require("compression");
const NodeCache = require("node-cache");

const auth = require("../middleware/auth.js");
const {
  getAverageData,
  getIntervalData,
  getDateData,
  getCountData,
  fetchReportData,
  fetchExcelReportData,
} = require("../services/reports/dataFetcher.js");
const {
  generateExcelFile,
  generateExcelReport,
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

    // Adjust date range for single-day queries
    let fromDate = new Date(dateRange.from);
    let toDate = new Date(dateRange.to);

    if (fromDate.toDateString() === toDate.toDateString()) {
      toDate.setHours(23, 59, 59, 999); // Set to the end of the day
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
        data = await fetchReportData({
          mode: "average",
          timeUnit: averageBy,
          configuration,
          sensorIds,
          fromDate: fromDate,
          toDate: toDate,
        });
        break;

      case "interval":
        if (!interval) {
          return res.status(400).json({
            success: false,
            message: "Interval parameter is required",
          });
        }
        data = await fetchReportData({
          mode: "interval",
          timeUnit: interval,
          configuration,
          sensorIds,
          fromDate: fromDate,
          toDate: toDate,
        });
        break;

      case "date":
        data = await fetchReportData({
          mode: "raw",
          configuration,
          sensorIds,
          fromDate: fromDate,
          toDate: toDate,
        });
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
  try {
    // Validate request body
    if (
      !req.body.reportType ||
      !req.body.configuration ||
      !req.body.dateRange
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters",
      });
    }

    // Get data in Excel format
    const { data, headers } = await fetchExcelReportData({
      reportType: req.body.reportType,
      configuration: req.body.configuration,
      sensorIds: req.body.selectedSensors || [],
      dateRange: req.body.dateRange,
      averageBy: req.body.averageBy,
      interval: req.body.interval,
    });

    // Generate and send Excel file directly to response
    await generateExcelReport(data, headers, res);
  } catch (error) {
    console.error("Excel export error:", error);
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
