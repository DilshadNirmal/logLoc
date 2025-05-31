const mongoose = require("mongoose");
const { Worker } = require("worker_threads");
const path = require("path");
const os = require("os");
const NodeCache = require("node-cache");
const zlib = require("zlib");

const VoltageData = require("../../models/VoltageData.js");

// Initialize data cache with 5-minute TTL
const dataCache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 60, // Check for expired keys every minute
  useClones: false, // Don't clone objects for better performance
  maxKeys: 500, // Limit cache size
});

// Cache for time periods to avoid recalculation
const timePeriodCache = new Map();

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
      case "minute":
        periodEndTime = new Date(currentDate);
        periodEndTime.setMinutes(currentDate.getMinutes() + 1);
        break;
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
 * @param {string} configuration - Configuration string (e.g., "A" or "B")
 * @returns {string} Sensor group (e.g., "1-20" or "21-40")
 */
function getSensorGroup(configuration) {
  if (!configuration) return null;

  // Map configuration to sensor group
  const configMap = {
    A: "1-20",
    B: "21-40",
  };

  return configMap[configuration] || null;
}

/**
 * Creates a match stage for MongoDB aggregation
 * @param {Object} params - Query parameters
 * @returns {Object} MongoDB match stage
 */
function createMatchStage(params) {
  const { dateRange, configuration, selectedSensors } = params;

  const matchStage = {};

  // Add date range if provided
  if (dateRange && dateRange.from && dateRange.to) {
    matchStage.timestamp = {
      $gte: new Date(dateRange.from),
      $lte: new Date(dateRange.to),
    };
  }

  // Add sensor group if configuration is provided
  const sensorGroup = getSensorGroup(configuration);
  if (sensorGroup) {
    matchStage.sensorGroup = sensorGroup;
  }

  return matchStage;
}

/**
 * Creates a pipeline for unwinding voltage data
 * @param {boolean} hasSelectedSensors - Whether specific sensors are selected
 * @param {Array} selectedSensors - Array of selected sensor IDs
 * @returns {Array} MongoDB aggregation pipeline stages
 */
function createUnwindPipeline(
  hasSelectedSensors = false,
  selectedSensors = []
) {
  const pipeline = [
    // Unwind the voltages map to get individual readings
    {
      $addFields: {
        voltageEntries: { $objectToArray: "$voltages" },
      },
    },
    { $unwind: "$voltageEntries" },
    // Extract sensor ID from the key (e.g., "v1" -> 1)
    {
      $addFields: {
        sensorId: {
          $toInt: {
            $substr: [
              "$voltageEntries.k",
              1,
              { $strLenCP: "$voltageEntries.k" },
            ],
          },
        },
        value: "$voltageEntries.v",
      },
    },
  ];

  // Add filter for selected sensors if needed
  if (hasSelectedSensors && selectedSensors.length > 0) {
    const isNumericSensors = selectedSensors.every(
      (s) => typeof s === "number"
    );

    if (isNumericSensors) {
      // For numeric sensor IDs (like [22, 23])
      pipeline.push({
        $match: {
          $expr: {
            $in: ["$sensorId", selectedSensors],
          },
        },
      });
    } else {
      // For string sensor IDs (like ["s22", "s23"])
      pipeline.push({
        $match: {
          $expr: {
            $in: [
              { $concat: ["s", { $toString: "$sensorId" }] },
              selectedSensors,
            ],
          },
        },
      });
    }
  }

  return pipeline;
}

/**
 * Gets average data based on parameters
 * @param {string} configuration - Configuration (A or B)
 * @param {Object} dateRange - Date range object
 * @param {string} averageBy - Aggregation level
 * @param {Array} selectedSensors - Array of selected sensor IDs
 * @returns {Promise<Array>} Processed data
 */
async function getAverageData(
  configuration,
  dateRange,
  averageBy,
  selectedSensors = []
) {
  console.log(
    "get averageData fn: ",
    configuration,
    dateRange,
    averageBy,
    selectedSensors
  );

  // Generate cache key
  const cacheKey = generateCacheKey({
    reportType: "average",
    configuration,
    dateRange,
    averageBy,
    selectedSensors,
  });

  // Check cache first
  const cachedData = dataCache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // Create match stage
  const matchStage = {
    timestamp: {
      $gte: new Date(dateRange.from),
      $lte: new Date(dateRange.to),
    },
    sensorGroup: configuration === "A" ? "1-20" : "21-40",
  };

  // Create aggregation pipeline
  const pipeline = [
    { $match: matchStage },
    { $addFields: { 
      timestamp: { $toDate: "$timestamp" } 
    }},
    { $sort: { timestamp: 1 } },

    // Convert voltages map to array of objects
    {
      $project: {
        timestamp: 1,
        voltageEntries: {
          $map: {
            input: {
              $filter: {
                input: { $objectToArray: "$voltages" },
                as: "entry",
                cond:
                  selectedSensors.length === 0
                    ? true
                    : {
                        $in: ["$$entry.k", selectedSensors.map((s) => `v${s}`)],
                      },
              },
            },
            as: "entry",
            in: {
              k: { $substr: ["$$entry.k", 1, -1] }, // Remove 'v' prefix
              v: "$$entry.v",
            },
          },
        },
      },
    },
    { $unwind: "$voltageEntries" },
    {
      $addFields: {
        sensorId: "$voltageEntries.k",
        value: "$voltageEntries.v",
      },
    },

    // Group by time period and sensor ID to calculate averages
    {
      $group: {
        _id: {
          sensorId: "$sensorId",
          period: {
            $dateTrunc: {
              date: "$timestamp",
              unit: averageBy === "hour" ? "hour" : "day",
              timezone: "Asia/Kolkata",
            },
          },
        },
        averageValue: { $avg: "$value" },
        timestamp: { $first: "$timestamp" },
      },
    },

    // Format the result
    {
      $project: {
        _id: 0,
        sensorId: "$_id.sensorId",
        timestamp: {
          $dateToString: {
            date: "$timestamp",
            format: "%Y-%m-%d %H:%M:%S",
            timezone: "Asia/Kolkata",
          },
        },
        value: { $round: ["$averageValue", 2] },
        label: {
          $dateToString: {
            date: "$timestamp",
            format: "%H:%M",
            timezone: "Asia/Kolkata",
          },
        },
      },
    },
    { $sort: { timestamp: 1, sensorId: 1 } },
  ];

  try {
    // Execute the aggregation
    const results = await VoltageData.aggregate(pipeline)
      .allowDiskUse(true)
      .exec();
    console.log("Raw results:", JSON.stringify(results, null, 2));

    // Process results and convert sensorId to number
    const processedResults = results.map((result) => ({
      ...result,
      sensorId: parseInt(result.sensorId, 10),
    }));

    // Group results by sensor ID
    const groupedResults = {};
    processedResults.forEach((result) => {
      if (!groupedResults[result.sensorId]) {
        groupedResults[result.sensorId] = [];
      }
      groupedResults[result.sensorId].push(result);
    });

    // Convert to array format
    const finalResults = Object.entries(groupedResults).map(
      ([sensorId, data]) => ({
        sensorId: parseInt(sensorId, 10),
        data,
      })
    );

    // Store in cache
    dataCache.set(cacheKey, finalResults);

    return finalResults;
  } catch (error) {
    console.error("Error in getAverageData:", error);
    return [];
  }
}

/**
 * Gets interval data based on parameters
 * @param {string} configuration - Configuration (A or B)
 * @param {Object} dateRange - Date range object
 * @param {string} interval - Interval type
 * @param {Array} selectedSensors - Array of selected sensor IDs
 * @returns {Promise<Array>} Processed data
 */
async function getIntervalData(
  configuration,
  dateRange,
  interval,
  selectedSensors = []
) {
  // Generate cache key
  try {
    console.log(
      "getIntervalData fn: ",
      configuration,
      dateRange,
      interval,
      selectedSensors
    );

    // Generate cache key
    const cacheKey = generateCacheKey({
      reportType: "interval",
      configuration,
      dateRange,
      interval,
      selectedSensors,
    });

    // Check cache first
    const cachedData = dataCache.get(cacheKey);
    if (cachedData) {
      console.log('Returning cached interval data');
      return cachedData;
    }

    // Create match stage
    const matchStage = createMatchStage({
      dateRange,
      configuration,
      selectedSensors,
    });

    // Generate time periods for the given date range and interval
    const periods = generateTimePeriods(
      new Date(dateRange.from),
      new Date(dateRange.to),
      interval
    );

    // Create aggregation pipeline
    const pipeline = [
      { $match: matchStage },
      ...createUnwindPipeline(selectedSensors.length > 0, selectedSensors),
      // Group by interval and sensor ID
      {
        $group: {
          _id: {
            interval: {
              $switch: {
                branches: [
                  {
                    case: { $eq: [interval, "hour"] },
                    then: {
                      $dateToString: {
                        format: "%Y-%m-%d-%H",
                        date: "$timestamp",
                      },
                    },
                  },
                  {
                    case: { $eq: [interval, "day"] },
                    then: {
                      $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$timestamp",
                      },
                    },
                  },
                  {
                    case: { $eq: [interval, "week"] },
                    then: {
                      $concat: [
                        { $toString: { $year: "$timestamp" } },
                        "-W",
                        {
                          $toString: {
                            $ceil: {
                              $divide: [
                                { $add: [{ $dayOfYear: "$timestamp" }, 6] },
                                7,
                              ],
                            },
                          },
                        },
                      ],
                    },
                  },
                  {
                    case: { $eq: [interval, "month"] },
                    then: {
                      $dateToString: {
                        format: "%Y-%m",
                        date: "$timestamp",
                      },
                    },
                  },
                ],
                default: {
                  $dateToString: {
                    format: "%Y-%m-%d-%H",
                    date: "$timestamp",
                  },
                },
              },
            },
            sensorId: "$sensorId",
          },
          avgValue: { $avg: "$value" },
          minValue: { $min: "$value" },
          maxValue: { $max: "$value" },
          firstTimestamp: { $min: "$timestamp" },
        },
      },
      // Format the output
      {
        $project: {
          _id: 0,
          interval: "$_id.interval",
          sensorId: "$_id.sensorId",
          value: { $round: ["$avgValue", 2] },
          min: { $round: ["$minValue", 2] },
          max: { $round: ["$maxValue", 2] },
          timestamp: "$firstTimestamp",
        },
      },
      // Sort by interval and sensor ID
      { $sort: { timestamp: 1, sensorId: 1 } },
    ];

    console.log('Executing interval data aggregation pipeline');
    const results = await VoltageData.aggregate(pipeline).exec();
    console.log(`Retrieved ${results.length} interval data points`);

    // Process results to match intervals
    const formattedResults = results.map((result) => {
      const period = periods.find((p) => p.key === result.interval);
      return {
        ...result,
        intervalLabel: period
          ? formatPeriodLabel(period.startTime, interval)
          : result.interval,
        start: period ? period.startTime : new Date(result.timestamp),
        end: period ? period.endTime : new Date(result.timestamp),
      };
    });

    // Group by sensor ID for consistent output format with getAverageData
    const groupedResults = {};
    formattedResults.forEach((result) => {
      if (!groupedResults[result.sensorId]) {
        groupedResults[result.sensorId] = [];
      }
      groupedResults[result.sensorId].push(result);
    });

    // Convert to array format
    const finalResults = Object.entries(groupedResults).map(
      ([sensorId, data]) => ({
        sensorId: parseInt(sensorId, 10),
        data,
      })
    );

    // Store in cache
    dataCache.set(cacheKey, finalResults);
    console.log('Interval data processing complete');

    return finalResults;
  } catch (error) {
    console.error("Error in getIntervalData:", error);
    return [];
  }
}

/**
 * Gets date-based data for Excel export or API response
 * @param {string} configuration - Configuration (A or B)
 * @param {Object} dateRange - Date range object
 * @param {Array} selectedSensors - Array of selected sensor IDs
 * @returns {Promise<Array>} Processed data
 */
async function getDateData(
  configuration,
  dateRange,
  selectedSensors = []
) {
  try {
    console.log(
      "getDateData fn: ",
      configuration,
      dateRange,
      selectedSensors
    );

    // Generate cache key
    const cacheKey = generateCacheKey({
      reportType: "date",
      configuration,
      dateRange,
      selectedSensors,
    });

    // Check cache first
    const cachedData = dataCache.get(cacheKey);
    if (cachedData) {
      console.log('Returning cached date data');
      return cachedData;
    }

    // Create match stage
    const matchStage = createMatchStage({
      dateRange,
      configuration,
      selectedSensors,
    });

    // Create aggregation pipeline
    const pipeline = [
      { $match: matchStage },
      ...createUnwindPipeline(selectedSensors.length > 0, selectedSensors),
      // Sort by timestamp and sensor ID
      { $sort: { timestamp: 1, sensorId: 1 } },
      // Project only the fields we need
      {
        $project: {
          _id: 0,
          timestamp: 1,
          sensorId: 1,
          value: { $round: ["$value", 2] },
        },
      },
    ];


    console.log('Executing date data aggregation pipeline');
    const results = await VoltageData.aggregate(pipeline).exec();
    console.log(`Retrieved ${results.length} date data points`);

    // Group by sensor ID for consistent output format with getAverageData
    const groupedResults = {};
    results.forEach((result) => {
      if (!groupedResults[result.sensorId]) {
        groupedResults[result.sensorId] = [];
      }
      groupedResults[result.sensorId].push({
        ...result,
        timestamp: new Date(result.timestamp).toISOString(),
      });
    });

    // Convert to array format
    const finalResults = Object.entries(groupedResults).map(
      ([sensorId, data]) => ({
        sensorId: parseInt(sensorId, 10),
        data,
      })
    );

    // Store in cache
    dataCache.set(cacheKey, finalResults);
    console.log('Date data processing complete');

    return finalResults;
  } catch (error) {
    console.error("Error in getDateData:", error);
    return [];
  }
}

/**
 * Gets sample data for API responses
 * @param {string} configuration - Configuration (A or B)
 * @param {Object} dateRange - Date range object
 * @param {Array} selectedSensors - Array of selected sensor IDs
 * @returns {Promise<Object>} Result object with sample data
 */
async function getSampleData(configuration, dateRange, selectedSensors = []) {
  // Generate cache key
  const cacheKey = generateCacheKey({
    reportType: "sample",
    configuration,
    dateRange,
    selectedSensors,
  });

  // Check cache first
  const cachedData = dataCache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // Create match stage
  const matchStage = createMatchStage({ dateRange, configuration });

  // Check if we have selected sensors
  const hasSelectedSensors =
    Array.isArray(selectedSensors) && selectedSensors.length > 0;

  // Create aggregation pipeline
  const pipeline = [
    { $match: matchStage },
    { $sort: { timestamp: 1 } },
    { $limit: 100 },
    ...createUnwindPipeline(hasSelectedSensors, selectedSensors),
    // Format the result
    {
      $project: {
        _id: 0,
        timestamp: 1,
        deviceId: 1,
        sensorGroup: 1,
        sensorId: { $concat: ["s", { $toString: "$sensorId" }] },
        value: { $round: ["$value", 2] },
      },
    },
    // Sort by timestamp and sensor ID
    { $sort: { timestamp: 1, sensorId: 1 } },
  ];

  // Execute the aggregation
  const sampleData = await VoltageData.aggregate(pipeline).exec();

  const result = {
    success: true,
    message: "Sample data processed successfully using aggregation",
    totalProcessed: sampleData.length,
    totalRows: sampleData.length,
    data: sampleData,
  };

  // Store in cache
  dataCache.set(cacheKey, result);

  return result;
}

/**
 * Gets count-based data
 * @param {Object} options - Options object
 * @param {Object} options.selectedCounts - Selected count options
 * @param {number} options.customCount - Custom count value
 * @param {Array} options.sensorIds - Array of selected sensor IDs
 * @param {string} options.configuration - Configuration (A or B)
 * @returns {Promise<Array>} Processed data
 */
async function getCountData({
  selectedCounts,
  customCount,
  sensorIds = [],
  configuration,
}) {
  try {
    console.log("getCountData fn: ", {
      selectedCounts,
      customCount,
      sensorIds,
      configuration,
    });

    // Generate cache key
    const cacheKey = generateCacheKey({
      reportType: "count",
      selectedCounts,
      customCount,
      sensorIds,
      configuration,
    });

    // Check cache first
    const cachedData = dataCache.get(cacheKey);
    if (cachedData) {
      console.log('Returning cached count data');
      return cachedData;
    }

    // Determine the limit based on selected counts
    let limit = 100; // Default to last 100 records
    if (selectedCounts.last100) limit = 100;
    else if (selectedCounts.last500) limit = 500;
    else if (selectedCounts.last1000) limit = 1000;
    else if (selectedCounts.custom && customCount > 0) limit = customCount;

    // Create match stage
    const matchStage = {
      sensorGroup: configuration === "A" ? "1-20" : "21-40",
    };

    // Create aggregation pipeline
    const pipeline = [
      { $match: matchStage },
      ...createUnwindPipeline(sensorIds.length > 0, sensorIds),
      // Sort by timestamp in descending order to get the most recent records
      { $sort: { timestamp: -1 } },
      // Limit to the requested number of records
      { $limit: limit },
      // Sort back to ascending order for display
      { $sort: { timestamp: 1, sensorId: 1 } },
      // Project only the fields we need
      {
        $project: {
          _id: 0,
          timestamp: 1,
          sensorId: 1,
          value: { $round: ["$value", 2] },
        },
      },
    ];


    console.log('Executing count data aggregation pipeline');
    const results = await VoltageData.aggregate(pipeline).exec();
    console.log(`Retrieved ${results.length} count data points`);

    // Group by sensor ID for consistent output format with getAverageData
    const groupedResults = {};
    results.forEach((result) => {
      if (!groupedResults[result.sensorId]) {
        groupedResults[result.sensorId] = [];
      }
      groupedResults[result.sensorId].push({
        ...result,
        timestamp: new Date(result.timestamp).toISOString(),
      });
    });

    // Convert to array format
    const finalResults = Object.entries(groupedResults).map(
      ([sensorId, data]) => ({
        sensorId: parseInt(sensorId, 10),
        data,
      })
    );

    // Store in cache
    dataCache.set(cacheKey, finalResults);
    console.log('Count data processing complete');

    return finalResults;
  } catch (error) {
    console.error("Error in getCountData:", error);
    return [];
  }
}

/**
 * Clears all caches
 */
function clearCaches() {
  dataCache.flushAll();
  timePeriodCache.clear();
  console.log("All data caches cleared");
}

module.exports = {
  getAverageData,
  getIntervalData,
  getDateData,
  getCountData,
  getSampleData,
  clearCaches,
};
