const PDFDocument = require("pdfkit");

const generatePDF = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // Add title
      doc.fontSize(16).text("Sensor Data Report", { align: "center" });
      doc.moveDown();

      // Add timestamp range
      doc
        .fontSize(12)
        .text(
          `Time Period: ${data[0].timestamp.toLocaleString()} to ${data[
            data.length - 1
          ].timestamp.toLocaleString()}`
        );
      doc.moveDown();

      // Create table headers
      const headers = [
        "Timestamp",
        "Temperature",
        "Humidity",
        "Pressure",
        "Device ID",
        "Location",
      ];
      const rowSpacing = 20;
      let yPosition = 150;

      // Draw headers
      doc.fontSize(10);
      headers.forEach((header, i) => {
        doc.text(header, 50 + i * 90, yPosition);
      });

      yPosition += rowSpacing;

      // Draw data rows
      data.forEach((record) => {
        if (yPosition > 700) {
          // Check if we need a new page
          doc.addPage();
          yPosition = 50;
        }

        doc.text(record.timestamp.toLocaleString(), 50, yPosition, {
          width: 85,
        });
        doc.text(`${record.temperature.toFixed(1)}°C`, 140, yPosition);
        doc.text(`${record.humidity.toFixed(1)}%`, 230, yPosition);
        doc.text(`${record.pressure.toFixed(1)}`, 320, yPosition);
        doc.text(record.device_id, 410, yPosition);
        doc.text(record.location, 500, yPosition);

        yPosition += rowSpacing;
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = generatePDF;
