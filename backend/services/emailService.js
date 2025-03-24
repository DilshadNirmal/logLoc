const sgMail = require("@sendgrid/mail");
const mongoose = require("mongoose");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const formatDataToHTML = (data) => {
  let tableRows = data
    .map(
      (record) => `
            <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${new Date(
        record.timestamp
      ).toLocaleString()}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${record.temperature.toFixed(
        2
      )}°C</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${record.humidity.toFixed(
        2
      )}%</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${record.pressure.toFixed(
        2
      )} hPa</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${record.device_id}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${record.location}</td>
    </tr>
        `
    )
    .join("");

  return `
     <html>
      <body>
        <h2>Sensor Data Report</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px;">Timestamp</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Temperature</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Humidity</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Pressure</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Device ID</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Location</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>
    `;
};

module.exports = { formatDataToHTML, sgMail };
