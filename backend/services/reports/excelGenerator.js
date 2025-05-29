const ExcelJs = require("exceljs");

function generateWorkSheet(workbook, data, options = {}) {
  const { sheetName = "Data", type = "average" } = options;

  const worksheet = workbook.addWorksheet(sheetName, {
    properties: { tabColor: { argb: "4167B8" } },
    pageSetup: { fitToPage: true, orientation: "landscape" },
    views: [{ state: "frozen", xSplit: 0, ySplit: 1 }]
  });

  const configs = {
    average: {
      columns: [
        { header: "Timestamp", key: "timestamp", width: 20 },
        { header: "Sensor ID", key: "sensorId", width: 15 },
        { header: "Average Value (mV)", key: "value", width: 20 }
      ],
      rowMapper: (item) => ({
        timestamp: new Date(item.timestamp).toLocaleString(),
        sensorId: item.sensorId,
        value: item.value
      })
    },
    interval: {
      columns: [
        { header: "Interval Start", key: "start", width: 25 },
        { header: "Interval End", key: "end", width: 25 },
        { header: "Sensor ID", key: "sensorId", width: 15 },
        { header: "Value (mV)", key: "value", width: 20 }
      ],
      rowMapper: (item) => ({
        start: new Date(item.start).toLocaleString(),
        end: new Date(item.end).toLocaleString(),
        sensorId: item.sensorId,
        value: item.value
      })
    },
    date: {
      columns: [
        { header: "Date", key: "date", width: 15 },
        { header: "Timestamp", key: "timestamp", width: 25 },
        { header: "Sensor ID", key: "sensorId", width: 15 },
        { header: "Value (mV)", key: "value", width: 15 }
      ],
      rowMapper: (item) => ({
        date: new Date(item.date).toLocaleDateString(),
        timestamp: new Date(item.timestamp).toLocaleString(),
        sensorId: item.sensorId,
        value: item.value
      })
    }
  };

  const config = configs[type];
  if (!config) {
    throw new Error(`Invalid worksheet type: ${type}`);
  }

  worksheet.columns = config.columns;

  // Add logo
  const logoId = workbook.addImage({
    filename: "../assets/xyma.png",
    extension: 'png'
  });
  worksheet.addImage(logoId, {
    tl: { col: 0, row: 0 },
    ext: { width: 100, height: 30 }
  });

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "4167B8" }
  };

  // Add data
  data.forEach(item => {
    worksheet.addRow(config.rowMapper(item));
  });

  // Apply basic styling
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
      if (typeof cell.value === "number") {
        cell.numFmt = "#,##0.00";
      }
    });
  });

  return worksheet;
}

async function generateExcelFile(data, reportType, filePath, options = {}) {
  const workbook = new ExcelJs.Workbook();
  workbook.creator = "LogLoc System";
  workbook.created = new Date();

  generateWorkSheet(workbook, data, {
    sheetName: options.sheetName || "Report Data",
    type: reportType
  });

  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

module.exports = {
  generateExcelFile
};