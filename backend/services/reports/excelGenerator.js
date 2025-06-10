const ExcelJs = require("exceljs");

// helper function to format dates consistently
function formatDate(dateString) {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return isNaN(date) ? dateString : date.toLocaleString();
  } catch (e) {
    return dateString;
  }
}

function generateWorkSheet(workbook, data, options = {}) {
  const { sheetName = "Data", type = "average" } = options;

  const worksheet = workbook.addWorksheet(sheetName, {
    properties: { tabColor: { argb: "4167B8" } },
    pageSetup: { fitToPage: true, orientation: "landscape" },
    views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
  });

  const configs = {
    average: {
      columns: [
        { header: "Timestamp", key: "timestamp", width: 25 },
        { header: "Sensor ID", key: "sensorId", width: 15 },
        { header: "Average Value (mV)", key: "value", width: 20 },
        { header: "Label", key: "label", width: 15 },
      ],
      rowMapper: (item) => ({
        timestamp: formatDate(item.timestamp),
        sensorId: item.sensorId,
        value: item.value,
        label: item.label || "",
      }),
    },
    interval: {
      columns: [
        { header: "Interval Start", key: "start", width: 25 },
        { header: "Interval End", key: "end", width: 25 },
        { header: "Sensor ID", key: "sensorId", width: 15 },
        { header: "Value (mV)", key: "value", width: 15 },
        { header: "Label", key: "label", width: 15 },
      ],
      rowMapper: (item) => ({
        start: formatDate(item.start),
        end: formatDate(item.end),
        sensorId: item.sensorId,
        value: item.value,
        label: item.label || "",
      }),
    },
    date: {
      columns: [
        { header: "Timestamp", key: "timestamp", width: 25 },
        { header: "Sensor ID", key: "sensorId", width: 15 },
        { header: "Value (mV)", key: "value", width: 15 },
        { header: "Label", key: "label", width: 15 },
      ],
      rowMapper: (item) => ({
        timestamp: formatDate(item.timestamp),
        sensorId: item.sensorId,
        value: item.value,
        label: item.label || "",
      }),
    },
    count: {
      columns: [
        { header: "Timestamp", key: "timestamp", width: 25 },
        { header: "Sensor ID", key: "sensorId", width: 15 },
        { header: "Value (mV)", key: "value", width: 15 },
        { header: "Label", key: "label", width: 15 },
      ],
      rowMapper: (item) => ({
        timestamp: formatDate(item.timestamp),
        sensorId: item.sensorId,
        value: item.value,
        label: item.label || "",
      }),
    },
  };

  const config = configs[type] || configs.date;
  if (!config) {
    throw new Error(`Invalid worksheet type: ${type}`);
  }

  // If data is in the new format (array of {sensorId, data: [...]}), flatten it
  let flatData = [];
  if (
    Array.isArray(data) &&
    data.every((item) => item.data && Array.isArray(item.data))
  ) {
    data.forEach((sensor) => {
      flatData = [...flatData, ...sensor.data];
    });
  } else {
    flatData = Array.isArray(data) ? data : [];
  }

  worksheet.columns = config.columns;

  // try {
  //   const logoId = workbook.addImage({
  //     filename: "./assets/xyma.png",
  //     extension: "png",
  //   });
  //   worksheet.addImage(logoId, {
  //     tl: { col: 0, row: 0 },
  //     ext: { width: 200, height: 50 },
  //   });
  // } catch (error) {
  //   console.warn("Could not add logo:", error.message);
  // }

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "4167B8" },
  };

  // Add data
  flatData.forEach((item) => {
    try {
      const rowData = config.rowMapper(item);
      worksheet.addRow(rowData);
    } catch (error) {
      console.error("Error adding row:", error);
    }
  });

  // Apply basic styling
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      if (typeof cell.value === "number") {
        cell.numFmt = "#,##0.00";
      }
    });
  });

  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = Math.min(Math.max(maxLength + 2, 10), 30);
  });

  return worksheet;
}

async function generateExcelFile(data, reportType, filePath, options = {}) {
  const workbook = new ExcelJs.Workbook();
  workbook.creator = "LogLoc System";
  workbook.created = new Date();

  generateWorkSheet(workbook, data, {
    sheetName: options.sheetName || "Report Data",
    type: reportType,
  });

  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

module.exports = {
  generateExcelFile,
};
