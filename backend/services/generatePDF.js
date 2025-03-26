const PDFDocument = require("pdfkit");

const generatePDF = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // Add logo
      const imagePath = path.join(__dirname, "../assets/xyma.png");
      doc.image(imagePath, 50, 45, { width: 150 });

      // Add title
      doc.moveDown(4);
      doc.fontSize(20).text("Sensor Data Report", { align: "center" });
      doc.moveDown(2);

      // Add date range information with better formatting
      const startDate = new Date(data[0].timestamp).toLocaleDateString();
      const endDate = new Date(
        data[data.length - 1].timestamp
      ).toLocaleDateString();

      doc
        .fontSize(12)
        .text(
          `This report contains sensor data collected from ${startDate} to ${endDate}.`,
          {
            align: "left",
            width: 500,
          }
        );
      doc.moveDown(2);

      // Table settings
      const tableTop = 250;
      const rowHeight = 30;
      const colWidth = 90;
      const textPadding = 5;

      // Create table headers
      const headers = [
        "Timestamp",
        "Temperature",
        "Humidity",
        "Pressure",
        "Device ID",
        "Location",
      ];

      // Draw table header with borders
      doc.lineWidth(1);
      headers.forEach((header, i) => {
        const x = 50 + i * colWidth;
        // Draw cell border
        doc.rect(x, tableTop, colWidth, rowHeight).stroke();
        // Add header text
        doc
          .fontSize(10)
          .text(header, x + textPadding, tableTop + textPadding, {
            width: colWidth - textPadding * 2,
          });
      });

      // Draw data rows
      let yPosition = tableTop + rowHeight;

      data.forEach((record) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;

          // Redraw headers on new page
          headers.forEach((header, i) => {
            const x = 50 + i * colWidth;
            doc.rect(x, yPosition, colWidth, rowHeight).stroke();
            doc.text(header, x + textPadding, yPosition + textPadding, {
              width: colWidth - textPadding * 2,
            });
          });
          yPosition += rowHeight;
        }

        // Draw row cells with borders
        const rowData = [
          record.timestamp.toLocaleString(),
          `${record.temperature.toFixed(1)}°C`,
          `${record.humidity.toFixed(1)}%`,
          record.pressure.toFixed(1),
          record.device_id,
          record.location,
        ];

        rowData.forEach((text, i) => {
          const x = 50 + i * colWidth;
          doc.rect(x, yPosition, colWidth, rowHeight).stroke();
          doc.text(text, x + textPadding, yPosition + textPadding, {
            width: colWidth - textPadding * 2,
          });
        });

        yPosition += rowHeight;
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = generatePDF;
