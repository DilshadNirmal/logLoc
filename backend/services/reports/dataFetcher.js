const mongoose = require("mongoose");
const { Worker } = require("worker_threads");
const path = require("path");
const os = require("os");

const VoltageData = require("../../models/VoltageData.js");

// Cache for time periods to avoid recalculation
const timePeriodCache = new Map();

/**
 * Generates time periods based on date range and aggregation level
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} averageBy - Aggregation level (hour, day, week, month)
 * @returns {Array} Array of time period objects
 */
function generateTimePeriods(startDate, endDate, averageBy) {
  // Create cache key
  const cacheKey = `${startDate.toISOString()}_${endDate.toISOString()}_${averageBy}`;

  // Return from cache if available
  if (timePeriodCache.has(cacheKey)) {
    return timePeriodCache.get(cacheKey);
  }

  const periods = [];
  let currentDate = new Date(startDate);

  while (currentDate < endDate) {
    let periodEndTime;
    const periodKey = getPeriodKey(currentDate, averageBy);

    // Calculate end time based on aggregation level
    switch (averageBy) {
      case "hour":
        periodEndTime = new Date(currentDate);
        periodEndTime.setHours(currentDate.getHours() + 1);
        break;
      case "day":
        periodEndTime = new Date(currentDate);
        periodEndTime.setDate(currentDate.getDate() + 1);
        break;
      case "week":
        periodEndTime = new Date(currentDate);
        periodEndTime.setDate(currentDate.getDate() + 7);
        break;
      case "month":
        periodEndTime = new Date(currentDate);
        periodEndTime.setMonth(currentDate.getMonth() + 1);
        break;
      default:
        periodEndTime = new Date(currentDate);
        periodEndTime.setHours(currentDate.getHours() + 1);
    }

    // Cap end time to the overall end date
    if (periodEndTime > endDate) {
      periodEndTime = new Date(endDate);
    }

    periods.push({
      key: periodKey,
      startTime: new Date(currentDate),
      endTime: periodEndTime,
    });

    // Move to next period
    currentDate = new Date(periodEndTime);
  }

  // Store in cache for future use
  timePeriodCache.set(cacheKey, periods);

  // Limit cache size to prevent memory leaks
  if (timePeriodCache.size > 100) {
    const oldestKey = timePeriodCache.keys().next().value;
    timePeriodCache.delete(oldestKey);
  }

  return periods;
}

/**
 * Gets a unique key for a time period
 * @param {Date} date - The date
 * @param {string} averageBy - Aggregation level
 * @returns {string} Unique key for the period
 */
function getPeriodKey(date, averageBy) {
  switch (averageBy) {
    case "hour":
      return `${date.getFullYear()}-${
        date.getMonth() + 1
      }-${date.getDate()}-${date.getHours()}`;
    case "day":
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    case "week":
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
      const weekNum = Math.ceil(
        (pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7
      );
      return `${date.getFullYear()}-W${weekNum}`;
    case "month":
      return `${date.getFullYear()}-${date.getMonth() + 1}`;
    default:
      return "";
  }
}

/**
 * Formats a period label for display
 * @param {Date} date - The date
 * @param {string} averageBy - Aggregation level
 * @returns {string} Formatted label
 */
function formatPeriodLabel(date, averageBy) {
  switch (averageBy) {
    case "hour":
      return `${date.toLocaleDateString()} ${date.getHours()}:00`;
    case "day":
      return date.toLocaleDateString();
    case "week":
      const endDate = new Date(date);
      endDate.setDate(date.getDate() + 6);
      return `Week of ${date.toLocaleDateString()}`;
    case "month":
      return `${date.toLocaleString("default", {
        month: "long",
      })} ${date.getFullYear()}`;
    default:
      return date.toLocaleDateString();
  }
}

/**
 * Determines sensor group based on configuration
 * @param {string} configuration - Configuration identifier
 * @returns {string|null} Sensor group or null
 */
function getSensorGroup(configuration) {
  return configuration === "A"
    ? "1-20"
    : configuration === "B"
    ? "21-40"
    : null;
}

/**
 * Gets average data for the specified parameters
 * @param {string} configuration - Configuration identifier
 * @param {Object} dateRange - Date range with from and to properties
 * @param {string} averageBy - Aggregation level
 * @returns {Promise<Array>} Promise resolving to array of data points
 */
async function getAverageData(configuration, dateRange, averageBy) {
  try {
    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);

    // Get sensor group and build query
    const sensorGroup = getSensorGroup(configuration);
    const query = { timestamp: { $gte: startDate, $lte: endDate } };
    if (sensorGroup) query.sensorGroup = sensorGroup;

    // Execute query with lean() for better performance
    const voltageHistory = await VoltageData.find(query)
      .sort({ timestamp: 1 })
      .lean();

    if (voltageHistory.length === 0) {
      return [];
    }

    // Generate time periods and initialize data structure
    const allTimePeriods = generateTimePeriods(startDate, endDate, averageBy);
    const timePeriodsData = {};

    allTimePeriods.forEach((period) => {
      timePeriodsData[period.key] = {
        startTime: period.startTime,
        endTime: period.endTime,
        totalValue: 0,
        count: 0,
      };
    });

    // Process data in batches for better memory efficiency
    const BATCH_SIZE = 1000;
    for (let i = 0; i < voltageHistory.length; i += BATCH_SIZE) {
      const batch = voltageHistory.slice(i, i + BATCH_SIZE);

      batch.forEach((record) => {
        const recordDate = new Date(record.timestamp);
        const periodKey = getPeriodKey(recordDate, averageBy);

        if (!timePeriodsData[periodKey]) return;

        // Process voltage entries
        if (record.voltages) {
          const entries =
            record.voltages instanceof Map
              ? Array.from(record.voltages.entries())
              : Object.entries(record.voltages);

          for (const [, value] of entries) {
            if (value !== null && !isNaN(value)) {
              timePeriodsData[periodKey].totalValue += value;
              timePeriodsData[periodKey].count += 1;
            }
          }
        }
      });

      // Clear batch from memory
      batch.length = 0;
    }

    // Generate result array
    const result = Object.entries(timePeriodsData)
      .filter(([, data]) => data.count > 0)
      .map(([, data]) => ({
        timestamp: data.startTime,
        value: parseFloat((data.totalValue / data.count).toFixed(2)),
        aggregation: averageBy,
        label: formatPeriodLabel(data.startTime, averageBy),
      }));

    return result;
  } catch (error) {
    console.error("Error getting average data:", error);
    throw error;
  }
}

/**
 * Gets interval data for the specified parameters
 * @param {string} configuration - Configuration identifier
 * @param {Object} dateRange - Date range with from and to properties
 * @param {string} interval - Interval type
 * @returns {Promise<Array>} Promise resolving to array of interval data
 */
async function getIntervalData(configuration, dateRange, interval) {
  try {
    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);

    // Get sensor group and build query
    const sensorGroup = getSensorGroup(configuration);
    const query = { timestamp: { $gte: startDate, $lte: endDate } };
    if (sensorGroup) query.sensorGroup = sensorGroup;

    // Execute query with lean() for better performance
    const voltageHistory = await VoltageData.find(query)
      .sort({ timestamp: 1 })
      .lean();

    if (voltageHistory.length === 0) {
      return [];
    }

    // Calculate interval duration in milliseconds
    let intervalMs;
    switch (interval) {
      case "hour":
        intervalMs = 60 * 60 * 1000;
        break;
      case "day":
        intervalMs = 24 * 60 * 60 * 1000;
        break;
      case "week":
        intervalMs = 7 * 24 * 60 * 60 * 1000;
        break;
      case "month":
        intervalMs = 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        intervalMs = 60 * 60 * 1000;
    }

    // Group data into intervals
    const intervals = [];
    let currentIntervalStart = new Date(startDate);

    while (currentIntervalStart < endDate) {
      let currentIntervalEnd;

      if (interval === "month") {
        // Handle month intervals correctly
        currentIntervalEnd = new Date(currentIntervalStart);
        currentIntervalEnd.setMonth(currentIntervalEnd.getMonth() + 1);
      } else {
        currentIntervalEnd = new Date(
          currentIntervalStart.getTime() + intervalMs
        );
      }

      // Cap the end date to the requested end date
      if (currentIntervalEnd > endDate) {
        currentIntervalEnd = new Date(endDate);
      }

      // Process data for this interval in batches
      const sensorData = {};

      // Process in batches for better memory efficiency
      const BATCH_SIZE = 1000;
      for (let i = 0; i < voltageHistory.length; i += BATCH_SIZE) {
        const batch = voltageHistory.slice(i, i + BATCH_SIZE);

        batch.forEach((record) => {
          const recordTimestamp = new Date(record.timestamp);

          // Skip if record is outside current interval
          if (
            recordTimestamp < currentIntervalStart ||
            recordTimestamp >= currentIntervalEnd
          ) {
            return;
          }

          // Process voltage entries
          if (record.voltages) {
            const entries =
              record.voltages instanceof Map
                ? Array.from(record.voltages.entries())
                : Object.entries(record.voltages);

            for (const [sensorKey, value] of entries) {
              if (value !== null && !isNaN(value)) {
                if (!sensorData[sensorKey]) {
                  sensorData[sensorKey] = [];
                }
                sensorData[sensorKey].push(value);
              }
            }
          }
        });
      }

      // Create interval entries for each sensor
      for (const [sensorKey, values] of Object.entries(sensorData)) {
        if (values.length > 0) {
          const sensorId = parseInt(sensorKey.substring(1)); // Remove 'v' prefix
          intervals.push({
            start: new Date(currentIntervalStart),
            end: new Date(currentIntervalEnd),
            sensorId,
            value: parseFloat(
              (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
            ),
            min: Math.min(...values),
            max: Math.max(...values),
            count: values.length,
          });
        }
      }

      // Move to next interval
      currentIntervalStart = currentIntervalEnd;
    }

    return intervals;
  } catch (error) {
    console.error("Error getting interval data:", error);
    throw error;
  }
}

/**
 * Gets date data for the specified parameters
 * @param {string} configuration - Configuration identifier
 * @param {Object} dateRange - Date range with from and to properties
 * @param {Object} excelWriter - Excel writer object for streaming
 * @returns {Promise<Object>} Promise resolving to result object
 */
async function getDateData(configuration, dateRange, excelWriter) {
  try {
    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);

    // Get sensor group and build query
    const sensorGroup = getSensorGroup(configuration);
    const query = { timestamp: { $gte: startDate, $lte: endDate } };
    if (sensorGroup) query.sensorGroup = sensorGroup;

    // If no excelWriter, return sample data for API responses
    if (!excelWriter) {
      const sampleData = await VoltageData.find(query)
        .sort({ timestamp: 1 })
        .limit(100)
        .lean();

      return {
        success: true,
        message: "Sample data processed successfully",
        totalProcessed: sampleData.length,
        totalRows: sampleData.length,
      };
    }

    // For Excel export, use worker thread with optimized memory settings
    return new Promise((resolve, reject) => {
      // Get MongoDB connection string
      const mongoUri = mongoose.connection.client.s.url;

      // Calculate optimal resource limits based on available system memory
      const systemMemory = os.totalmem();
      const memoryLimit = Math.min(
        Math.floor((systemMemory * 0.4) / (1024 * 1024)), // 40% of system memory
        4096 // Max 4GB
      );

      // Create worker with the necessary data
      const worker = new Worker(path.join(__dirname, "dataWorker.js"), {
        workerData: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          sensorGroup: sensorGroup,
          excelFilePath: excelWriter.filePath,
          mongoUri: mongoUri,
        },
        resourceLimits: {
          maxOldGenerationSizeMb: memoryLimit,
        },
      });

      // Track progress
      let totalProcessed = 0;
      let totalRows = 0;

      // Listen for messages from the worker
      worker.on("message", (message) => {
        if (message.type === "progress") {
          totalProcessed = message.totalProcessed;
          totalRows = message.totalRows;
          console.log(
            `Processed ${totalProcessed} documents (${totalRows} rows) so far`
          );
        } else if (message.type === "complete") {
          console.log(
            `Export complete: ${message.totalProcessed} documents, ${message.totalRows} rows`
          );
        } else if (message.type === "error") {
          console.error("Worker error:", message.error);
          console.error(message.stack);
        }
      });

      // Handle worker completion
      worker.on("exit", (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
          return;
        }

        resolve({
          success: true,
          message: "Data processed successfully in worker thread",
          totalProcessed,
          totalRows,
        });
      });

      // Handle worker errors
      worker.on("error", (err) => {
        console.error("Worker error:", err);
        reject(err);
      });
    });
  } catch (error) {
    console.error("Error getting date data:", error);
    throw error;
  }
}

/**
 * Gets count data for the specified parameters
 * @param {Object} options - Options containing selectedCounts and customCount
 * @returns {Promise<Array>} Promise resolving to array of count data
 */
async function getCountData(options) {
  try {
    const { selectedCounts, customCount } = options;

    // Determine how many voltage values we want to fetch
    let targetValueCount = 500; // Default to 500 values

    if (selectedCounts) {
      if (selectedCounts.last100) {
        targetValueCount = 100;
      } else if (selectedCounts.last500) {
        targetValueCount = 500;
      } else if (selectedCounts.last1000) {
        targetValueCount = 1000;
      } else if (selectedCounts.custom && customCount) {
        targetValueCount = parseInt(customCount, 10);
      }
    }

    // Calculate how many documents we need to fetch
    // Assuming each document has ~40 values (one per sensor)
    const estimatedDocsNeeded = Math.ceil(targetValueCount / 20);

    // Get the most recent voltage data documents with lean() for better performance
    const voltageHistory = await VoltageData.find({})
      .sort({ timestamp: -1 }) // Sort by timestamp descending (newest first)
      .limit(estimatedDocsNeeded)
      .lean();

    // Prepare data for Excel output
    const result = [];
    let totalValuesProcessed = 0;

    // Process each record
    for (const record of voltageHistory) {
      // Skip if we've reached the target
      if (totalValuesProcessed >= targetValueCount) {
        break;
      }

      // For each sensor reading in this record
      if (record.voltages) {
        const entries =
          record.voltages instanceof Map
            ? Array.from(record.voltages.entries())
            : Object.entries(record.voltages);

        for (const [sensorKey, value] of entries) {
          // Skip if we've reached the target
          if (totalValuesProcessed >= targetValueCount) {
            break;
          }

          if (value !== null && !isNaN(value)) {
            totalValuesProcessed++;

            // Extract sensor ID from the key (assuming keys are like 'v1', 'v2', etc.)
            const sensorId = parseInt(sensorKey.substring(1)); // Remove 'v' prefix

            // Add a row for this reading
            result.push({
              timestamp: new Date(record.timestamp).toLocaleString(),
              deviceId: record.deviceId,
              sensorGroup: record.sensorGroup,
              sensorId: `Sensor ${sensorId}`,
              value: parseFloat(value.toFixed(2)),
            });
          }
        }
      }
    }

    console.log(
      `Processed ${totalValuesProcessed} voltage values from ${voltageHistory.length} documents`
    );
    return result;
  } catch (error) {
    console.error("Error getting count data:", error);
    throw error;
  }
}

module.exports = {
  getAverageData,
  getIntervalData,
  getDateData,
  getCountData,
};
