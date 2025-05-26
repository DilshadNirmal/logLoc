const { workerData, parentPort } = require("worker_threads");
const mongoose = require("mongoose");
const ExcelJS = require("exceljs");
const VoltageDataSchema = require("../../models/VoltageData").schema;
const fs = require("fs");

// Helper function for MongoDB connection with retry
async function connectWithRetry(uri) {
  const MAX_RETRIES = 5;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
      });
      console.log("Connected to MongoDB in worker thread");
      return mongoose.connection;
    } catch (err) {
      retries++;
      console.error(
        `MongoDB connection attempt ${retries} failed:`,
        err.message
      );
      if (retries >= MAX_RETRIES) throw err;
      // Wait before retrying (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * Math.pow(2, retries))
      );
    }
  }
}

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

    const selectedSensors = new Set(workerData.selectedSensors || []);
    console.log(selectedSensors)
    const hasSelectedSensors = selectedSensors.size > 0;

    // Create Excel workbook with optimized streaming options
    const options = {
      filename: workerData.excelFilePath,
      useStyles: true,
      useSharedStrings: false,
      zip: {
        compressionOptions: {
          level: 1, // Fastest compression
        },
      },
      workbookView: {
        activeTab: 0,
        autoFilterDateGrouping: true,
        firstSheet: 0,
        visibility: "visible",
      },
    };

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter(options);
    const worksheet = workbook.addWorksheet("Data", {
      properties: { tabColor: { argb: "4167B8" } },
      pageSetup: { fitToPage: true, orientation: "landscape" },
      views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
    });

    // Add headers with consistent styling
    worksheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Timestamp", key: "timestamp", width: 20 },
      { header: "Sensor ID", key: "sensorId", width: 15 },
      { header: "Value (mV)", key: "value", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4167B8" },
    };

    // Commit the header row immediately
    await worksheet.getRow(1).commit();

    // Optimize batch processing
    const BATCH_SIZE = 25; // Slightly increased but still small
    const ROWS_PER_WRITE = 500; // Increased for better throughput
    let totalProcessed = 0;
    let totalRows = 0;
    let hasMoreData = true;
    let lastId = null;
    let rowBuffer = [];

    const pipeline = [
      { $match: query },
      { $sort: { _id: 1 } },
      { $limit: BATCH_SIZE },
      {
        $addFields: {
          voltageEntries: { $objectToArray: "$voltages" },
        },
      },
      { $unwind: "$voltageEntries" },
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

      // adding match stage for selected sensors if needed
      ...(hasSelectedSensors
        ? [
            {
              $match: {
                $expr: {
                  $in: [
                    "$sensorId", // Use numeric sensorId directly
                    Array.from(selectedSensors),
                  ],
                },
              },
            },
          ]
        : []),
    ];

    // Use _id-based pagination for better performance
    while (hasMoreData) {
      if (lastId) {
        pipeline[0].$match._id = { $gt: lastId };
      }

      // Get a batch of documents with lean() for better performance
      const batch = await VoltageData.aggregate(pipeline).exec();

      // Check if we've reached the end
      if (batch.length < BATCH_SIZE) {
        hasMoreData = false;
      }

      // Process this batch
      if (batch.length > 0) {
        // Save the last _id for next batch
        lastId = batch[batch.length - 1]._id;

        // Process each document
        for (const doc of batch) {
          totalProcessed++;

          if (!doc || !doc.timestamp) continue;

          const sensorId = doc.sensorId;
          const value = doc.voltageEntries.v;

          if (value !== null && value !== undefined && !isNaN(value)) {
            const recordDate = new Date(doc.timestamp);
            const dateString = recordDate.toISOString().split("T")[0];

            // Determine status based on value
            let status = "Normal";
            if (value < 3) status = "Low";
            if (value > 7) status = "High";

            rowBuffer.push({
              date: dateString,
              timestamp: recordDate.toLocaleString(),
              sensorId: `Sensor ${sensorId}`,
              value: parseFloat(value.toFixed(2)),
              status: status,
            });

            totalRows++;

            if (rowBuffer.length >= ROWS_PER_WRITE) {
              await flushRowBuffer(worksheet, rowBuffer);
              rowBuffer = [];
              parentPort.postMessage({
                type: "progress",
                totalProcessed,
                totalRows,
              });
            }
          }
        }

        // Clear batch from memory
        batch.length = 0;

        // Allow time for garbage collection
        global.gc && global.gc();
      }
    }

    // Flush any remaining rows
    if (rowBuffer.length > 0) {
      await flushRowBuffer(worksheet, rowBuffer);
    }

    // Final commit to ensure all data is written
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

// Helper function to flush row buffer to worksheet
async function flushRowBuffer(worksheet, rowBuffer) {
  for (const rowData of rowBuffer) {
    if (rowData) {
      // Add a check to ensure rowData is not null or undefined
      try {
        worksheet.addRow(rowData);
      } catch (err) {
        // console.error("Error adding row:", err.message);
        // Continue with other rows instead of failing the entire batch
      }
    }
  }
  await worksheet.commit();
}

// Start processing when the worker is initialized
processData().catch((err) => {
  parentPort.postMessage({
    type: "error",
    error: err.message,
    stack: err.stack,
  });
});
