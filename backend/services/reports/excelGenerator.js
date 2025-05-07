const ExcelJs = require("exceljs");
const {
  addFrequencyChart,
  applyCommonStyles,
  applyStatusConditionalFormatting,
} = require("../../utils/excel/formatting.js");

/**
 * Generates a worksheet with data based on the specified type
 * @param {ExcelJs.Workbook} workbook - The Excel workbook
 * @param {Array} data - The data to add to the worksheet
 * @param {Object} options - Configuration options
 */
function generateWorkSheet(workbook, data, options = {}) {
  const { sheetName = "Data", type = "average", averageBy, interval } = options;

  // Create worksheet with consistent options
  const worksheet = workbook.addWorksheet(sheetName, {
    properties: { tabColor: { argb: "4167B8" } },
    pageSetup: { fitToPage: true, orientation: "landscape" },
    views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
  });

  // Define column configurations for different report types
  const configs = {
    average: {
      columns: [
        { header: "Timestamp", key: "timestamp", width: 20 },
        { header: "Sensor ID", key: "sensorId", width: 15 },
        { header: "Average Value (mV)", key: "value", width: 20 },
        { header: "Aggregation", key: "aggregation", width: 15 },
      ],
      rowMapper: (item) => ({
        timestamp: new Date(item.timestamp).toLocaleString(),
        sensorId: item.sensorId,
        value: item.value,
        aggregation: averageBy,
      }),
    },
    interval: {
      columns: [
        { header: "Interval Start", key: "start", width: 20 },
        { header: "Interval End", key: "end", width: 20 },
        { header: "Sensor ID", key: "sensorId", width: 15 },
        { header: "Average Value (mV)", key: "value", width: 20 },
        { header: "Min Value (mV)", key: "min", width: 15 },
        { header: "Max Value (mV)", key: "max", width: 15 },
        { header: "Reading Count", key: "count", width: 15 },
      ],
      rowMapper: (item) => ({
        start: new Date(item.start).toLocaleString(),
        end: new Date(item.end).toLocaleString(),
        sensorId: item.sensorId,
        value: item.value,
        min: item.min,
        max: item.max,
        count: item.count,
      }),
    },
    date: {
      columns: [
        { header: "Date", key: "date", width: 15 },
        { header: "Timestamp", key: "timestamp", width: 20 },
        { header: "Sensor ID", key: "sensorId", width: 15 },
        { header: "Value (mV)", key: "value", width: 15 },
        { header: "Status", key: "status", width: 15 },
      ],
      rowMapper: (item) => ({
        date: new Date(item.date).toLocaleDateString(),
        timestamp: new Date(item.timestamp).toLocaleString(),
        sensorId: item.sensorId,
        value: item.value,
        status: item.status,
      }),
    },
    count: {
      columns: [
        { header: "Timestamp", key: "timestamp", width: 20 },
        { header: "Device ID", key: "deviceId", width: 15 },
        { header: "Sensor Group", key: "sensorGroup", width: 15 },
        { header: "Sensor ID", key: "sensorId", width: 15 },
        { header: "Value (mV)", key: "value", width: 15 },
      ],
      rowMapper: (item) => item,
    },
  };

  const config = configs[type];
  if (!config) {
    throw new Error(`Invalid worksheet type: ${type}`);
  }

  worksheet.columns = config.columns;

  // Process data in batches for better memory efficiency
  const BATCH_SIZE = 1000;
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    batch.forEach((item) => {
      worksheet.addRow(config.rowMapper(item));
    });
  }

  applyCommonStyles(worksheet);

  // Apply type-specific formatting
  if (type === "date") {
    applyStatusConditionalFormatting(worksheet);
  } else if (type === "count" && data.length > 0) {
    addFrequencyChart(workbook, worksheet, data);
  }

  return worksheet;
}

/**
 * Creates an Excel writer for streaming large datasets
 * @param {string} reportType - The type of report
 * @param {string} filePath - The file path to save the Excel file
 * @returns {Object} Writer object with methods for streaming
 */
function createExcelWriter(reportType, filePath) {
  const workbook = new ExcelJs.Workbook();
  workbook.creator = "LogLoc System";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Data", {
    properties: { tabColor: { argb: "4167B8" } },
    pageSetup: { fitToPage: true, orientation: "landscape" },
    views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
  });

  // Configure worksheet based on report type
  const columnConfigs = {
    date: [
      { header: "Date", key: "date", width: 15 },
      { header: "Timestamp", key: "timestamp", width: 20 },
      { header: "Sensor ID", key: "sensorId", width: 15 },
      { header: "Value (mV)", key: "value", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ],
    // Add other report types as needed
  };

  worksheet.columns = columnConfigs[reportType] || [];

  // Create a writer object with methods for streaming
  const writer = {
    worksheet,
    workbook,
    filePath,
    rowCount: 0,
    batchSize: 100,
    rowBuffer: [],

    // Add a row to the worksheet with buffering
    addRow(rowData) {
      this.rowBuffer.push(rowData);
      this.rowCount++;

      if (this.rowBuffer.length >= this.batchSize) {
        this.flushBuffer();
      }
    },

    // Flush the buffer to the worksheet
    flushBuffer() {
      if (this.rowBuffer.length === 0) return;

      this.rowBuffer.forEach((rowData) => {
        this.worksheet.addRow(rowData);
      });

      this.rowBuffer = [];
    },

    // Finalize and save the workbook
    async finalize() {
      // Flush any remaining rows
      this.flushBuffer();

      // Apply formatting to the worksheet
      applyCommonStyles(this.worksheet);

      // Apply type-specific formatting
      if (reportType === "date") {
        applyStatusConditionalFormatting(this.worksheet);
      }

      // Save the workbook to the file
      await this.workbook.xlsx.writeFile(this.filePath);

      return {
        rowCount: this.rowCount,
        filePath: this.filePath,
      };
    },
  };

  return writer;
}

/**
 * Generates an Excel file with the provided data
 * @param {Array} data - The data to include in the Excel file
 * @param {string} reportType - The type of report
 * @param {string} filePath - The file path to save the Excel file
 * @param {Object} options - Additional options
 * @returns {Promise<void>}
 */
async function generateExcelFile(data, reportType, filePath, options = {}) {
  // Create Excel workbook with metadata
  const workbook = new ExcelJs.Workbook();
  workbook.creator = "LogLoc System";
  workbook.created = new Date();
  workbook.modified = new Date();

  // Generate worksheet based on report type
  switch (reportType) {
    case "average":
      generateWorkSheet(workbook, data, {
        sheetName: "Average Data",
        type: "average",
        averageBy: options.averageBy,
      });
      break;
    case "interval":
      generateWorkSheet(workbook, data, {
        sheetName: "Interval Data",
        type: "interval",
        interval: options.interval,
      });
      break;
    case "date":
      generateWorkSheet(workbook, data, {
        sheetName: "Date Data",
        type: "date",
      });
      break;
    case "count":
      generateWorkSheet(workbook, data, {
        sheetName: "Voltage Readings",
        type: "count",
      });
      break;
    default:
      throw new Error(`Invalid report type: ${reportType}`);
  }

  // Write the file
  await workbook.xlsx.writeFile(filePath);

  return {
    filePath,
    rowCount: data.length,
  };
}

module.exports = {
  generateWorkSheet,
  generateExcelFile,
  createExcelWriter,
};
