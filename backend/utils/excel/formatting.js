/**
 * Applies common styling to an Excel worksheet
 * @param {ExcelJS.Worksheet} worksheet - The worksheet to style
 */
function applyCommonStyles(worksheet) {
  // Skip if worksheet is empty
  if (!worksheet || worksheet.rowCount === 0) return;

  // Header styling - only apply once
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "4167B8" },
  };

  // Apply alignment to header
  headerRow.eachCell((cell) => {
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
  });

  // Cell borders and formatting for all rows
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      // Add borders
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      // Format numbers consistently
      if (typeof cell.value === "number") {
        cell.numFmt = "#,##0.00";
      }

      // Format dates consistently
      if (cell.value instanceof Date) {
        cell.numFmt = "yyyy-mm-dd hh:mm:ss";
      }

      // Basic alignment for non-header rows
      if (rowNumber > 1) {
        cell.alignment = {
          vertical: "middle",
          horizontal: "left",
          wrapText: true,
        };
      }
    });

    // Set row height for better readability
    row.height = 18;
  });

  // Auto-filter for easier data analysis
  if (worksheet.rowCount > 1) {
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: worksheet.columnCount },
    };
  }
}

/**
 * Applies conditional formatting to status cells
 * @param {ExcelJS.Worksheet} worksheet - The worksheet to format
 */
function applyStatusConditionalFormatting(worksheet) {
  // Skip if worksheet is empty
  if (!worksheet || worksheet.rowCount <= 1) return;

  // Find the status column index
  let statusColumnIndex = 0;
  worksheet.columns.forEach((column, index) => {
    if (column.key === "status") {
      statusColumnIndex = index + 1; // ExcelJS uses 1-based indexing
    }
  });

  // Skip if status column not found
  if (statusColumnIndex === 0) return;

  // Apply conditional formatting to each row
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber > 1) {
      const statusCell = row.getCell(statusColumnIndex);
      const statusValue = statusCell.value;

      if (statusValue === "High") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFCCCC" },
        };
        statusCell.font = { color: { argb: "CC0000" }, bold: true };
      } else if (statusValue === "Low") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "CCCCFF" },
        };
        statusCell.font = { color: { argb: "0000CC" }, bold: true };
      } else if (statusValue === "Normal") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "CCFFCC" },
        };
        statusCell.font = { color: { argb: "006600" } };
      }

      // Center status text
      statusCell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
    }
  });
}

/**
 * Adds a frequency chart to the worksheet
 * @param {ExcelJS.Workbook} workbook - The workbook
 * @param {ExcelJS.Worksheet} worksheet - The worksheet
 * @param {Array} data - The data for the chart
 */
function addFrequencyChart(workbook, worksheet, data) {
  // Skip if no data
  if (!data || data.length === 0) return;

  // Create a formatted table for frequency distribution
  const startRow = Math.min(worksheet.rowCount + 2, 2);

  // Add title
  worksheet.getCell(`A${startRow}`).value = "Frequency Distribution";
  worksheet.getCell(`A${startRow}`).font = { bold: true, size: 14 };
  worksheet.mergeCells(`A${startRow}:B${startRow}`);

  // Add headers
  const headerRow = startRow + 1;
  worksheet.getCell(`A${headerRow}`).value = "Category";
  worksheet.getCell(`B${headerRow}`).value = "Frequency";
  worksheet.getCell(`A${headerRow}`).font = { bold: true };
  worksheet.getCell(`B${headerRow}`).font = { bold: true };

  // Style header cells
  [
    worksheet.getCell(`A${headerRow}`),
    worksheet.getCell(`B${headerRow}`),
  ].forEach((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "E6E6E6" },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    cell.alignment = { horizontal: "center" };
  });

  // Process data to get frequency distribution
  const frequencyMap = new Map();
  data.forEach((item) => {
    const key = item.value || item.type || "Unknown";
    frequencyMap.set(key, (frequencyMap.get(key) || 0) + 1);
  });

  // Add data rows
  let rowIndex = headerRow + 1;
  for (const [category, frequency] of frequencyMap.entries()) {
    worksheet.getCell(`A${rowIndex}`).value = category;
    worksheet.getCell(`B${rowIndex}`).value = frequency;

    // Style data cells
    [
      worksheet.getCell(`A${rowIndex}`),
      worksheet.getCell(`B${rowIndex}`),
    ].forEach((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    rowIndex++;
  }

  // Add a chart if there's enough data
  if (frequencyMap.size > 1 && frequencyMap.size <= 10) {
    const chartDataRange = `B${headerRow + 1}:B${rowIndex - 1}`;
    const labelRange = `A${headerRow + 1}:A${rowIndex - 1}`;

    const chart = workbook.addChart("pie");
    chart.title.text = "Frequency Distribution";
    chart.legend.position = "right";

    chart.addSeries({
      name: "Frequency",
      labels: worksheet.getCell(labelRange),
      values: worksheet.getCell(chartDataRange),
      dataLabels: {
        showValue: true,
        showPercent: true,
        position: "center",
      },
    });

    chart.setSize(500, 300);
    worksheet.addChart(chart, `D${startRow}`);
  }
}

module.exports = {
  applyCommonStyles,
  applyStatusConditionalFormatting,
  addFrequencyChart,
};
