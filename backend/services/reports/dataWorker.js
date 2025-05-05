const { parentPort, workerData } = require("worker_threads");
const mongoose = require("mongoose");
const ExcelJS = require("exceljs");

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

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data");

    // Add headers
    worksheet.addRow(["Date", "Timestamp", "Sensor ID", "Value", "Status"]);

    // Process in smaller batches to avoid memory issues
    const BATCH_SIZE = 20;
    let totalProcessed = 0;
    let totalRows = 0;
    let hasMoreData = true;
    let lastId = null;

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
        .limit(BATCH_SIZE);

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

          for (const [sensorKey, value] of record.voltages.entries()) {
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
        }

        // Report progress
        if (totalProcessed % 100 === 0 || !hasMoreData) {
          parentPort.postMessage({
            type: "progress",
            totalProcessed,
            totalRows,
          });

          // Allow garbage collection
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    }

    // Save the Excel file
    await workbook.xlsx.writeFile(workerData.excelFilePath);

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
