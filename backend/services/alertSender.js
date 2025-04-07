const AlertConfig = require("../models/AlertConfig");
const GlobalEmailConfig = require("../models/GlobalEmailConfigSchema");
const sendEmail = require("./sendEmail");

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

        const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #ff4444;">Voltage Alert</h2>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
            <p><strong>Sensor:</strong> ${sensorId}</p>
            <p><strong>Current Value:</strong> ${value}mV</p>
            <p><strong>Threshold Exceeded:</strong> ${
              value >= config.high
                ? `High (${config.high}mV)`
                : `Low (${config.low}mV)`
            }</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `;

        await sendEmail({
          to: globalConfig.emails,
          subject: `Voltage Alert: Sensor ${sensorId}`,
          html: htmlContent,
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
        });
      }
    }
  } catch (error) {
    console.error("Error in checkAndSendAlert:", error);
  }
};

module.exports = {
  checkAndSendAlert,
};
// This function checks if the value of a sensor exceeds its configured thresholds
