const ExcelJs = require("exceljs");

const {
  addFrequencyChart,
  applyCommonStyles,
  applyStatusConditionalFormatting,
} = require("../../utils/excel/formatting.js");

function generateWorkSheet(workbook, data, options = {}) {
  const { sheetName = "Data", type = "average", averageBy, interval } = options;

  const worksheet = workbook.addWorksheet(sheetName);

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

  //adding row
  data.forEach((item) => {
    worksheet.addRow(config.rowMapper(item));
  });

  applyCommonStyles(worksheet);

  // applying type-specific formatting
  if (type === "date") {
    applyStatusConditionalFormatting(worksheet);
  } //else if (type === "count") {
  //   addFrequencyChart(workbook, worksheet, data);
  // }
}

// Add this function to create an Excel writer for streaming
function createExcelWriter(reportType, filePath) {
  const workbook = new ExcelJs.Workbook();
  const worksheet = workbook.addWorksheet("Data");

  // Configure worksheet based on report type
  if (reportType === "date") {
    // Apply formatting for date data
    worksheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Timestamp", key: "timestamp", width: 20 },
      { header: "Sensor ID", key: "sensorId", width: 15 },
      { header: "Value", key: "value", width: 10 },
      { header: "Status", key: "status", width: 10 },
    ];
  }

  // Create a writer object with methods for streaming
  const writer = {
    worksheet,
    workbook,
    filePath,

    // Add headers to the worksheet
    async addHeaders(headers) {
      // Headers are already set in the columns definition
    },

    // Add a row to the worksheet
    addRow(rowData) {
      this.worksheet.addRow(rowData);
    },

    // Finalize and save the workbook
    async finalize() {
      // Apply formatting to the worksheet
      applyCommonStyles(this.worksheet);

      // Apply type-specific formatting
      if (reportType === "date") {
        applyStatusConditionalFormatting(this.worksheet);
      }

      // Save the workbook to the file
      await this.workbook.xlsx.writeFile(this.filePath);
    },
  };

  return writer;
}

function generateExcelFile(reportType, data, options) {
  // creating excel workbook
  const workbook = new ExcelJs.Workbook();
  workbook.creator = "LogLoc System";
  workbook.created = new Date();

  //   generate worksheet based on report type
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

  return workbook;
}

module.exports = { generateWorkSheet, generateExcelFile, createExcelWriter };
