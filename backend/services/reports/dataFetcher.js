const mongoose = require("mongoose");
const { Worker } = require("worker_threads");
const path = require("path");

const VoltageData = require("../../models/VoltageData.js");
// helper functions
function generateTimePeriods(startDate, endDate, averageBy) {
  const periods = [];
  let currentDate = new Date(startDate);

  while (currentDate < endDate) {
    let periodEndTime;
    const periodKey = getPeriodKey(currentDate, averageBy);

    if (averageBy === "hour") {
      periodEndTime = new Date(currentDate);
      periodEndTime.setHours(currentDate.getHours() + 1);
    } else if (averageBy === "day") {
      periodEndTime = new Date(currentDate);
      periodEndTime.setDate(currentDate.getDate() + 1);
    } else if (averageBy === "week") {
      periodEndTime = new Date(currentDate);
      periodEndTime.setDate(currentDate.getDate() + 7);
    } else if (averageBy === "month") {
      periodEndTime = new Date(currentDate);
      periodEndTime.setMonth(currentDate.getMonth() + 1);
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

  return periods;
}

function getPeriodKey(date, averageBy) {
  if (averageBy === "hour") {
    return `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}-${date.getHours()}`;
  } else if (averageBy === "day") {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  } else if (averageBy === "week") {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    const weekNum = Math.ceil(
      (pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7
    );
    return `${date.getFullYear()}-W${weekNum}`;
  } else if (averageBy === "month") {
    return `${date.getFullYear()}-${date.getMonth() + 1}`;
  }
  return "";
}

function formatPeriodLabel(date, averageBy) {
  if (averageBy === "hour") {
    return `${date.toLocaleDateString()} ${date.getHours()}:00`;
  } else if (averageBy === "day") {
    return date.toLocaleDateString();
  } else if (averageBy === "week") {
    const endDate = new Date(date);
    endDate.setDate(date.getDate() + 6);
    return `Week of ${date.toLocaleDateString()}`;
  } else if (averageBy === "month") {
    return `${date.toLocaleString("default", {
      month: "long",
    })} ${date.getFullYear()}`;
  }
  return date.toLocaleDateString();
}

// more of a controller
async function getAverageData(configuration, dateRange, averageBy) {
  try {
    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);
    console.log("Date range:", { from: startDate, to: endDate });

    // Parse configuration to determine which sensors to include
    const sensorGroup =
      configuration === "A" ? "1-20" : configuration === "B" ? "21-40" : null;
    console.log("Using sensor group:", sensorGroup);

    const query = {
      timestamp: { $gte: startDate, $lte: endDate },
    };

    if (sensorGroup) {
      query.sensorGroup = sensorGroup;
    }

    console.log("MongoDB query:", JSON.stringify(query));

    const voltageHistory = await VoltageData.find(query).sort({ timestamp: 1 });
    console.log("Query returned records:", voltageHistory.length);

    if (voltageHistory.length === 0) {
      console.log(
        "No data found for the specified date range and configuration"
      );
      return [];
    }

    const allTimePeriods = generateTimePeriods(startDate, endDate, averageBy);
    console.log(`Generated ${allTimePeriods.length} time periods`);

    const timePeriodsData = {};
    allTimePeriods.forEach((period) => {
      timePeriodsData[period.key] = {
        startTime: period.startTime,
        endTime: period.endTime,
        totalValue: 0,
        count: 0,
      };
    });

    // processing data based on averageBy parameter
    const groupedData = {};

    voltageHistory.forEach((record) => {
      const recordDate = new Date(record.timestamp);
      let periodKey = getPeriodKey(recordDate, averageBy);

      if (!timePeriodsData[periodKey]) return;

      for (const [sensorKey, value] of record.voltages.entries()) {
        if (value !== null && !isNaN(value)) {
          timePeriodsData[periodKey].totalValue += value;
          timePeriodsData[periodKey].count += 1;
        }
      }
    });

    const result = [];
    for (const [periodKey, data] of Object.entries(timePeriodsData)) {
      // Only include periods that have data
      if (data.count > 0) {
        result.push({
          timestamp: data.startTime,
          value: parseFloat((data.totalValue / data.count).toFixed(2)),
          aggregation: averageBy,
          // Include a label that's more descriptive of the time period
          label: formatPeriodLabel(data.startTime, averageBy),
        });
      }
    }

    console.log(`Returning ${result.length} aggregated data points`);
    return result;
  } catch (error) {
    console.error("Error getting average data:", error);
    throw error;
  }
}

async function getIntervalData(configuration, dateRange, interval) {
  try {
    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);

    // Parse configuration to determine which sensors to include
    const sensorGroup =
      configuration === "A" ? "1-20" : configuration === "B" ? "21-40" : null;

    // Base query
    const query = {
      timestamp: { $gte: startDate, $lte: endDate },
    };

    // Add sensor group filter if specified
    if (sensorGroup) {
      query.sensorGroup = sensorGroup;
    }

    // Get all voltage data in the date range
    const voltageHistory = await VoltageData.find(query).sort({ timestamp: 1 });

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
        // Approximate - will be adjusted for actual month lengths
        intervalMs = 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        intervalMs = 60 * 60 * 1000; // Default to hour
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

      // Filter records for this interval
      const intervalRecords = voltageHistory.filter((record) => {
        return (
          record.timestamp >= currentIntervalStart &&
          record.timestamp < currentIntervalEnd
        );
      });

      // Process data for each sensor in this interval
      const sensorData = {};

      intervalRecords.forEach((record) => {
        for (const [sensorKey, value] of record.voltages.entries()) {
          if (value !== null && !isNaN(value)) {
            if (!sensorData[sensorKey]) {
              sensorData[sensorKey] = [];
            }
            sensorData[sensorKey].push(value);
          }
        }
      });

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

async function getDateData(configuration, dateRange, excelWriter) {
  try {
    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);

    console.log(startDate, "-", endDate);

    // parse configuration to determine which sensors to include
    const sensorGroup =
      configuration === "A" ? "1-20" : configuration === "B" ? "21-40" : null;

    // base query
    if (!excelWriter) {
      // base query
      const query = { timestamp: { $gte: startDate, $lte: endDate } };

      // Add sensor group filter if specified
      if (sensorGroup) {
        query.sensorGroup = sensorGroup;
      }

      // Get a small sample of data for API responses
      const sampleData = await VoltageData.find(query)
        .sort({ timestamp: 1 })
        .limit(100);

      return {
        success: true,
        message: "Sample data processed successfully",
        totalProcessed: sampleData.length,
        totalRows: sampleData.length,
      };
    }

    // For Excel export, use worker thread
    return new Promise((resolve, reject) => {
      // Get MongoDB connection string
      const mongoUri = mongoose.connection.client.s.url;

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
          maxOldGenerationSizeMb: 4096,
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

async function getCountData(selectedCounts, customCount) {
  try {
    console.log(selectedCounts);

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

    // Get the most recent voltage data documents
    const voltageHistory = await VoltageData.find({})
      .sort({ timestamp: -1 }) // Sort by timestamp descending (newest first)
      .limit(estimatedDocsNeeded);

    // Prepare data for Excel output
    const result = [];
    let totalValuesProcessed = 0;

    // Process each record
    for (const record of voltageHistory) {
      // For each sensor reading in this record
      for (const [sensorKey, value] of record.voltages.entries()) {
        if (value !== null && !isNaN(value)) {
          // Stop once we've reached the target number of values
          if (totalValuesProcessed >= targetValueCount) {
            console.log(targetValueCount);
            break;
          }

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

      // Stop processing records if we've reached the target
      if (totalValuesProcessed >= targetValueCount) {
        break;
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

module.exports = { getAverageData, getIntervalData, getDateData, getCountData };
