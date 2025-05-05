const { parentPort, workerData } = require("worker_threads");
const mongoose = require("mongoose");
const ExcelJS = require("exceljs");
const fs = require("fs");
const stream = require("stream");
const { promisify } = require("util");

// Define VoltageData schema for the worker
const VoltageDataSchema = new mongoose.Schema({
  timestamp: Date,
  deviceId: String,
  sensorGroup: String,
  voltages: Map,
});

// Connect to MongoDB with retry logic
async function connectWithRetry(uri, options = {}, retries = 5, delay = 5000) {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000, // Longer server selection timeout
      socketTimeoutMS: 45000, // Longer socket timeout
      connectTimeoutMS: 30000, // Longer connection timeout
      heartbeatFrequencyMS: 10000, // More frequent heartbeats
      ...options,
    });
    console.log("Worker connected to MongoDB");
    return mongoose;
  } catch (err) {
    if (retries === 0) {
      console.log("Max retries reached. Giving up connecting to MongoDB");
      throw err;
    }
    console.log(
      `Connection failed, retrying in ${delay}ms... (${retries} attempts left)`
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
    return connectWithRetry(uri, options, retries - 1, delay);
  }
}

// Process data function
async function processData() {
  let db;
  try {
    // Get MongoDB connection string from workerData
    const MONGODB_URI =
      workerData.mongoUri || "mongodb://localhost:27017/logLoc";

    // Connect to MongoDB with retry logic
    db = await connectWithRetry(MONGODB_URI);

    // Register the model
    const VoltageData = mongoose.model("VoltageData", VoltageDataSchema);

    // Parse query parameters
    const query = {
      timestamp: {
        $gte: new Date(workerData.startDate),
        $lte: new Date(workerData.endDate),
      },
    };

    if (workerData.sensorGroup) {
      query.sensorGroup = workerData.sensorGroup;
    }

    // Create Excel workbook with streaming options
    const options = {
      filename: workerData.excelFilePath,
      useStyles: true,
      useSharedStrings: false,
    };
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter(options);
    const worksheet = workbook.addWorksheet("Data");

    // Add headers
    worksheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Timestamp", key: "timestamp", width: 20 },
      { header: "Sensor ID", key: "sensorId", width: 15 },
      { header: "Value", key: "value", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    // Process in smaller batches to avoid memory issues
    const BATCH_SIZE = 10;
    let totalProcessed = 0;
    let totalRows = 0;
    let hasMoreData = true;
    let lastId = null;

    // Collect rows in batches to add to Excel
    const rowBatch = [];
    const ROWS_PER_WRITE = 500;

    // Use _id-based pagination instead of skip/limit for better performance
    while (hasMoreData) {
      // Modify query to use _id for pagination
      let batchQuery = { ...query };
      if (lastId) {
        batchQuery._id = { $gt: lastId };
      }

      // Get a batch of documents
      const batch = await VoltageData.find(batchQuery)
        .sort({ _id: 1 })
        .limit(BATCH_SIZE)
        .lean();

      // If we got fewer documents than batch size, we've reached the end
      if (batch.length < BATCH_SIZE) {
        hasMoreData = false;
      }

      // Process this batch
      if (batch.length > 0) {
        // Save the last _id for next batch
        lastId = batch[batch.length - 1]._id;

        // Process each document
        for (const record of batch) {
          totalProcessed++;

          const recordDate = new Date(record.timestamp);
          const dateString = recordDate.toISOString().split("T")[0];

          for (const [sensorKey, value] of Object.entries(record.voltages)) {
            if (value !== null && !isNaN(value)) {
              const sensorId = parseInt(sensorKey.substring(1)); // Remove 'v' prefix

              // Determine status based on value
              let status = "Normal";
              if (value < 3) status = "Low";
              if (value > 7) status = "High";

              // Add row to Excel
              worksheet.addRow([
                dateString,
                new Date(record.timestamp).toLocaleString(),
                `Sensor ${sensorId}`,
                parseFloat(value.toFixed(2)),
                status,
              ]);

              totalRows++;
            }
          }

          //   periodically commit rows to file to free memeory
          if (rowBatch.length >= ROWS_PER_WRITE || !hasMoreData) {
            for (const row of rowBatch) {
              worksheet.addRow(row).commit();
            }
            rowBatch.length = 0;

            // forcing garbage collection
            if (global.gc) {
              console.log("forcing gc");
              global.gc();
            }
          }
        }

        // Report progress
        if (totalProcessed % 100 === 0 || !hasMoreData) {
          parentPort.postMessage({
            type: "progress",
            totalProcessed,
            totalRows,
          });

          // Allow garbage collection
          batch.length = 0;
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    }

    // Add any remaining rows
    if (rowBatch.length > 0) {
      for (const row of rowBatch) {
        worksheet.addRow(row).commit();
      }
    }

    // Write the workbook to file
    await workbook.commit();

    // Send completion message
    parentPort.postMessage({
      type: "complete",
      totalProcessed,
      totalRows,
    });
  } catch (error) {
    // Send error message
    parentPort.postMessage({
      type: "error",
      error: error.message,
      stack: error.stack,
    });
  } finally {
    // Close MongoDB connection
    if (db) {
      await mongoose.disconnect();
    }
  }
}

// Start processing
processData();
