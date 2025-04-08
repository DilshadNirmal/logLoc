const AlertConfig = require("../models/AlertConfig");
const GlobalEmailConfig = require("../models/GlobalEmailConfigSchema");
const sendEmail = require("./sendEmail");

let pendingAlerts = [];
let alertTimeout = null;
const BATCH_DELAY = 60000;

const checkAndSendAlert = async (sensorId, value) => {
  try {
    const config = await AlertConfig.findOne({ sensorId });
    if (!config) {
      console.error(`No alert configuration found for sensor ID: ${sensorId}`);
      return;
    }

    const globalConfig = await GlobalEmailConfig.findById("global");
    if (!globalConfig || !globalConfig.emails.length) {
      console.error("No email recipients configured");
      return;
    }

    if (value >= config.high || value <= config.low) {
      const lastAlertKey = `lastAlert_${sensorId}`;

      // initialting global alertTimers if not exists
      if (!global.alertTimers) {
        global.alertTimers = {};
      }
      const lastAlertTime = global.alertTimers[lastAlertKey];
      const now = Date.now();

      if (
        !lastAlertTime ||
        now - lastAlertTime >= config.alertDelay * 60 * 1000
      ) {
        global.alertTimers[lastAlertKey] = now;

        pendingAlerts.push({
          sensorId,
          value,
          threshold:
            value >= config.high
              ? `High (${config.high}mV)`
              : `Low (${config.low}mV)`,
          time: new Date().toLocaleString(),
        });

        if (!alertTimeout) {
          alertTimeout = setTimeout(sendGroupedAlerts, BATCH_DELAY);
        }

        //   const htmlContent = `
        //   <div style="font-family: Arial, sans-serif; padding: 20px;">
        //     <h2 style="color: #ff4444;">Voltage Alert</h2>
        //     <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
        //       <p><strong>Sensor:</strong> ${sensorId}</p>
        //       <p><strong>Current Value:</strong> ${value}mV</p>
        //       <p><strong>Threshold Exceeded:</strong> ${
        //         value >= config.high
        //           ? `High (${config.high}mV)`
        //           : `Low (${config.low}mV)`
        //       }</p>
        //       <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        //     </div>
        //   </div>
        // `;

        // await sendEmail({
        //   to: globalConfig.emails,
        //   subject: `Voltage Alert: Sensor ${sensorId}`,
        //   html: htmlContent,
        //   `
        //       <h2>Voltage Alert</h2>
        //       <p>Sensor: ${sensorId}</p>
        //       <p>Current Value: ${value}V</p>
        //       <p>Threshold: ${
        //         value >= config.high
        //           ? `High (${config.high})`
        //           : `Low (${config.low})`
        //       }</p>
        //       <p>Time: ${new Date().toLocaleString()}</p>
        //     `
        // });
      }
    }
  } catch (error) {
    console.error("Error in checkAndSendAlert:", error);
  }
};

const sendGroupedAlerts = async () => {
  try {
    if (pendingAlerts.length === 0) return;

    const globalConfig = await GlobalEmailConfig.findById("global");
    if (!globalConfig || !globalConfig.emails.length) {
      console.error("No email recipients configured");
      return;
    }

    // Sort alerts by sensorId for better readability
    pendingAlerts.sort((a, b) => a.sensorId - b.sensorId);

    const alertsTable = pendingAlerts
      .map(
        (alert) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${alert.sensorId}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${alert.value}mV</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${alert.threshold}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${alert.time}</td>
        </tr>
      `
      )
      .join("");

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #ff4444;">Multiple Voltage Alerts Detected</h2>
        <p>The following sensors have exceeded their thresholds:</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 8px; border: 1px solid #ddd;">Sensor ID</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Current Value</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Threshold Exceeded</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Time</th>
            </tr>
          </thead>
          <tbody>
            ${alertsTable}
          </tbody>
        </table>
      </div>
    `;

    await sendEmail({
      to: globalConfig.emails,
      subject: `Voltage Alerts: ${pendingAlerts.length} Sensors Exceeded Thresholds`,
      html: htmlContent,
    });

    // Clear pending alerts and timeout
    pendingAlerts = [];
    alertTimeout = null;
  } catch (error) {
    console.error("Error sending grouped alerts:", error);
  }
};

module.exports = {
  checkAndSendAlert,
};
// This function checks if the value of a sensor exceeds its configured thresholds
