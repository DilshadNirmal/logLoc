const NodeCache = require("node-cache");

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
    sensorIds,
  } = params;

  // Create a deterministic string from the parameters
  return JSON.stringify({
    reportType,
    configuration,
    dateRange,
    averageBy,
    interval,
    selectedSensors: selectedSensors ? [...selectedSensors].sort() : [],
    sensorIds,
  });
}

/**
 * Unified function to fetch report data in different modes
 * @param {Object} options - Configuration options
 * @param {'raw'|'average'|'interval'} options.mode - Data processing mode
 * @param {'hour'|'day'} [options.timeUnit='hour'] - Time unit for aggregation
 * @param {string} options.configuration - Configuration (A or B)
 * @param {string[]} [options.sensorIds=[]] - Selected sensor IDs
 * @param {Date} options.fromDate - Start date for the report
 * @param {Date} options.toDate - End date for the report
 * @returns {Promise<Array>} - Processed report data in format [{ sensorId: number, data: [...] }]
 */
async function fetchReportData({
  mode = "raw",
  timeUnit = "hour",
  configuration,
  sensorIds = [],
  fromDate,
  toDate,
}) {
  // Generate cache key
  const cacheKey = generateCacheKey({
    reportType: mode,
    configuration,
    dateRange: { from: fromDate, to: toDate },
    averageBy: timeUnit,
    sensorIds,
  });

  // Check cache first
  const cachedData = dataCache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // Convert sensor IDs to numbers
  const numericSensorIds = sensorIds.map((id) => parseInt(id));

  // Determine sensor group
  const sensorGroup = configuration === "A" ? "1-20" : "21-40";

  // Base pipeline stages
  const basePipeline = [
    {
      $match: {
        timestamp: { $gte: fromDate, $lte: toDate },
        $or: sensorIds.map((id) => ({
          [`voltages.v${id}`]: { $exists: true },
        })),
      },
    },
    { $addFields: { voltageEntries: { $objectToArray: "$voltages" } } },
    { $unwind: "$voltageEntries" },
    {
      $addFields: {
        sensorId: {
          $toInt: {
            $substr: [
              "$voltageEntries.k",
              1,
              { $subtract: [{ $strLenCP: "$voltageEntries.k" }, 1] },
            ],
          },
        },
        value: "$voltageEntries.v",
      },
    },
    ...(numericSensorIds.length > 0
      ? [{ $match: { sensorId: { $in: numericSensorIds } } }]
      : []),
  ];

  // Mode-specific processing
  let modePipeline = [];
  switch (mode) {
    case "average":
      modePipeline = [
        {
          $group: {
            _id: {
              time: {
                $dateTrunc: {
                  date: "$timestamp",
                  unit: timeUnit,
                  timezone: "Asia/Kolkata",
                },
              },
              sensorId: "$sensorId",
            },
            avgValue: { $avg: "$value" },
            minValue: { $min: "$value" },
            maxValue: { $max: "$value" },
          },
        },
        {
          $project: {
            _id: 0,
            timestamp: "$_id.time",
            sensorId: "$_id.sensorId",
            value: { $round: ["$avgValue", 2] },
            min: { $round: ["$minValue", 2] },
            max: { $round: ["$maxValue", 2] },
          },
        },
      ];
      break;
    case "interval":
      modePipeline = [
        {
          $group: {
            _id: {
              time: {
                $dateTrunc: {
                  date: "$timestamp",
                  unit: timeUnit,
                  timezone: "Asia/Kolkata",
                },
              },
              sensorId: "$sensorId",
            },
            value: { $first: { $round: ["$value", 2] } },
          },
        },
        {
          $project: {
            _id: 0,
            timestamp: "$_id.time",
            sensorId: "$_id.sensorId",
            value: 1,
          },
        },
      ];
      break;
    default: // raw
      modePipeline = [
        {
          $project: {
            _id: 0,
            timestamp: 1,
            sensorId: 1,
            value: { $round: ["$value", 2] },
          },
        },
      ];
  }

  const finalPipeline = [
    ...basePipeline,
    ...modePipeline,
    { $sort: { timestamp: 1, sensorId: 1 } },
  ];

  const results = await VoltageData.aggregate(finalPipeline)
    .allowDiskUse(true)
    .exec();

  // Convert to the grouped format: [{ sensorId: number, data: [...] }]
  const groupedResults = {};
  results.forEach((result) => {
    const sensorId = result.sensorId;
    if (!groupedResults[sensorId]) {
      groupedResults[sensorId] = [];
    }

    // Format timestamp consistently
    const formattedResult = {
      ...result,
      timestamp:
        result.timestamp instanceof Date
          ? result.timestamp.toISOString()
          : new Date(result.timestamp).toISOString(),
    };

    groupedResults[sensorId].push(formattedResult);
  });

  // Convert to array format
  const finalResults = Object.entries(groupedResults).map(
    ([sensorId, data]) => ({
      sensorId: parseInt(sensorId),
      data,
    })
  );

  // Store in cache
  dataCache.set(cacheKey, finalResults);

  return finalResults;
}

/**
 * Gets count-based data in consistent format with other functions
 * @param {Object} options - Options object
 * @param {Object} options.selectedCounts - Selected count options
 * @param {number} options.customCount - Custom count value
 * @param {Array} options.sensorIds - Array of selected sensor IDs
 * @param {string} options.configuration - Configuration (A or B)
 * @returns {Promise<Array>} Processed data in format [{ sensorId: number, data: [...] }]
 */
async function getCountData({
  selectedCounts,
  customCount,
  configuration,
  selectedSensors,
}) {
  try {
    const sensorIds = selectedSensors.map((sensor) => sensor);

    // Generate cache key
    const cacheKey = generateCacheKey({
      reportType: "count_data",
      selectedCounts,
      customCount,
      sensorIds,
      configuration,
    });

    // Check cache first
    const cachedData = dataCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Determine the limit based on selected options
    let limit = 100; // Default to last 100 records
    if (selectedCounts.last100) limit = 100;
    else if (selectedCounts.last500) limit = 500;
    else if (selectedCounts.last1000) limit = 1000;
    else if (selectedCounts.custom && customCount > 0) limit = customCount;

    // Prepare sensor filters - handle both numeric IDs and string IDs (like "s22")
    const numericSensorIds = sensorIds
      .map((id) =>
        typeof id === "string" && id.startsWith("s")
          ? parseInt(id.substring(1))
          : parseInt(id)
      )
      .filter((id) => !isNaN(id));

    // Create match stage
    const matchStage = {
      sensorGroup: configuration === "A" ? "1-20" : "21-40",
    };

    // Create aggregation pipeline
    const pipeline = [
      { $match: matchStage },
      { $sort: { timestamp: -1 } }, // Get most recent documents first
      { $limit: limit },
      // Convert voltages map to array of entries
      {
        $addFields: {
          voltageEntries: { $objectToArray: "$voltages" },
        },
      },
      { $unwind: "$voltageEntries" },
      // Extract sensor ID from key (e.g., "v1" -> 1)
      {
        $addFields: {
          sensorId: {
            $toInt: {
              $substr: [
                "$voltageEntries.k",
                1,
                { $subtract: [{ $strLenCP: "$voltageEntries.k" }, 1] },
              ],
            },
          },
          value: "$voltageEntries.v",
        },
      },
      // Filter by selected sensors if any
      ...(numericSensorIds.length > 0
        ? [
            {
              $match: {
                sensorId: { $in: numericSensorIds },
              },
            },
          ]
        : []),
      // Sort by timestamp and sensor ID
      { $sort: { timestamp: 1, sensorId: 1 } },
      // Project to desired format
      {
        $project: {
          _id: 0,
          timestamp: {
            $dateToString: {
              format: "%Y-%m-%d %H:%M:%S",
              date: "$timestamp",
              timezone: "Asia/Kolkata",
            },
          },
          sensorId: 1,
          value: { $round: ["$value", 2] },
        },
      },
    ];

    const results = await VoltageData.aggregate(pipeline).exec();

    // Group by sensor ID to match the format of other functions
    const groupedResults = {};
    results.forEach((result) => {
      if (!groupedResults[result.sensorId]) {
        groupedResults[result.sensorId] = [];
      }
      groupedResults[result.sensorId].push(result);
    });

    // Convert to array format [{ sensorId: number, data: [...] }]
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
    console.error("Error in getCountData:", error);
    return [];
  }
}

async function fetchExcelReportData({
  reportType, // 'date', 'average', or 'interval'
  configuration,
  sensorIds,
  dateRange,
  averageBy,
  interval,
}) {
  // Use existing fetchReportData with appropriate mode
  const mode = reportType === "date" ? "raw" : reportType;
  const data = await fetchReportData({
    mode,
    configuration,
    sensorIds,
    fromDate: new Date(dateRange.from),
    toDate: new Date(dateRange.to),
    timeUnit: reportType === "average" ? averageBy : interval,
  });

  // Transform data into Excel format
  const excelData = [];
  const timeKey = reportType === "average" ? "time" : "timestamp";

  data.forEach((sensor) => {
    sensor.data.forEach((point) => {
      const existingRow = excelData.find(
        (row) => row[timeKey] === point[timeKey]
      );

      if (existingRow) {
        existingRow[`sensor${sensor.sensorId}`] = point.value;
      } else {
        const newRow = { [timeKey]: point[timeKey] };
        newRow[`sensor${sensor.sensorId}`] = point.value;
        excelData.push(newRow);
      }
    });
  });

  return {
    data: excelData.sort((a, b) => new Date(a[timeKey]) - new Date(b[timeKey])),
    headers: [
      {
        header: timeKey === "time" ? "Time Period" : "Timestamp",
        key: timeKey,
      },
      ...sensorIds.map((id) => ({
        header: `Sensor ${id}`,
        key: `sensor${id}`,
      })),
    ],
  };
}

/**
 * Clears all caches
 */
function clearCaches() {
  dataCache.flushAll();
  timePeriodCache.clear();
}

module.exports = {
  fetchReportData,
  getCountData,
  fetchExcelReportData,
  clearCaches,
};
