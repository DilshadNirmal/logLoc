// Replace the current implementation with:
const ExcelJS = require("exceljs");

async function generateExcelReport(data, headers, res) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Report");

  // Set dynamic headers
  worksheet.columns = headers;

  // Format timestamp column if present
  const timestampCol = headers.find((h) => h.key === "timestamp");
  if (timestampCol) {
    worksheet.getColumn(timestampCol.key).numFmt = "yyyy-mm-dd hh:mm:ss";
  }

  // Add all data rows
  data.forEach((row) => worksheet.addRow(row));

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    const headerLength = column.header.length;
    const dataLength = Math.max(
      ...data.map((row) =>
        row[column.key] ? String(row[column.key]).length : 0
      )
    );
    column.width = Math.max(headerLength, dataLength) + 2;
  });

  // Set response headers
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=report.xlsx");

  await workbook.xlsx.write(res);
  res.end();
}

module.exports = {
  generateExcelReport,
};
