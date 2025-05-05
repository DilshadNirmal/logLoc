// Helper function for common styling
function applyCommonStyles(worksheet) {
  // Header styling
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "4167B8" },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };

  // Cell borders
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });
}

// Helper function for status conditional formatting
function applyStatusConditionalFormatting(worksheet) {
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const statusCell = row.getCell("status");
      if (statusCell.value === "High") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFCCCC" },
        };
      } else if (statusCell.value === "Low") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "CCCCFF" },
        };
      }
    }
  });
}

// Helper function for count chart
function addFrequencyChart(workbook, worksheet, data) {
  // Create a formatted table instead of a chart
  worksheet.getCell("E1").value = "Frequency Distribution";
  worksheet.getCell("E1").font = { bold: true, size: 14 };

  // Add headers
  worksheet.getCell("E3").value = "Category";
  worksheet.getCell("F3").value = "Frequency";
  worksheet.getCell("E3").font = { bold: true };
  worksheet.getCell("F3").font = { bold: true };

  // Add data
  data.forEach((item, index) => {
    const rowIndex = index + 4; // Start from row 4
    worksheet.getCell(`E${rowIndex}`).value = item.value || item.type;
    worksheet.getCell(`F${rowIndex}`).value = item.frequency;
  });
}

module.exports = {
  applyCommonStyles,
  applyStatusConditionalFormatting,
  addFrequencyChart,
};
