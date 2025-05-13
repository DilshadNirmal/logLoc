const express = require("express");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");

const auth = require("../middleware/auth.js");
const VoltageData = require("../models/VoltageData.js");
const { checkAndSendAlert } = require("../services/alertSender.js");

const router = express.Router();

router.get("/voltage-history", auth, async (req, res) => {
  try {
    const history = await VoltageData.find().sort({ timestamp: -1 }).limit(50);
    res.json(history);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch voltage history",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.get("/store-voltage-1-20", async (req, res) => {
  try {
    const { deviceId } = req.query;
    if (!deviceId || !/^XY\d{3}-[A-Z]$/.test(deviceId)) {
      throw new Error(
        'Invalid or missing deviceId. Format should be "XY001-A"'
      );
    }

    const voltages = {};
    for (let i = 1; i <= 20; i++) {
      const value = parseFloat(req.query[`v${i}`]);
      if (isNaN(value)) {
        throw new Error(`Invalid or missing value for voltage v${i}`);
      }

      try {
        await checkAndSendAlert(i, value);
      } catch (alertError) {
        console.error(`Error checking alerts for sensor ${i}:`, alertError);
      }
      voltages[`v${i}`] = value;
    }

    const voltageData = new VoltageData({
      voltages,
      deviceId,
      sensorGroup: "1-20",
      batteryStatus: parseInt(req.query.batteryStatus),
      signalStrength: parseInt(req.query.signalStrength),
      timestamp: new Date(),
    });

    await voltageData.save();

    res.status(201).json({
      success: true,
      message: "Voltage data 1-20 stored successfully",
      // data: voltageData
    });
  } catch (error) {
    console.error("Error storing voltage data 1-20:", error);
    res.status(500).json({
      success: false,
      message: "Failed to store voltage data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.get("/store-voltage-21-40", async (req, res) => {
  try {
    const { deviceId } = req.query;
    if (!deviceId || !/^XY\d{3}-[A-Z]$/.test(deviceId)) {
      throw new Error(
        'Invalid or missing deviceId. Format should be "XY001-A"'
      );
    }

    const voltages = {};
    for (let i = 21; i <= 40; i++) {
      const value = parseFloat(req.query[`v${i}`]);
      if (isNaN(value)) {
        throw new Error(`Invalid or missing value for voltage v${i}`);
      }

      try {
        await checkAndSendAlert(i, value);
      } catch (alertError) {
        console.error(`Error checking alerts for sensor ${i}:`, alertError);
        // Continue processing other sensors even if alert fails
      }
      voltages[`v${i}`] = value;
    }

    console.log("Voltages:", voltages);

    const voltageData = new VoltageData({
      voltages,
      deviceId,
      sensorGroup: "21-40", // Assuming you have a sensorGroup field in your VoltageData model to differentiate between the two sensor groups, and you're passing this value in the request para
      batteryStatus: parseInt(req.query.batteryStatus),
      signalStrength: parseInt(req.query.signalStrength),
      timestamp: new Date(),
    });

    await voltageData.save();

    res.status(201).json({
      success: true,
      message: "Voltage data 21-40 stored successfully",
    });
  } catch (error) {
    console.error("Error storing voltage data 21-40:", error);
    res.status(500).json({
      success: false,
      message: "Failed to store voltage data 21-40",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.get("/voltage-chart", async (req, res) => {
  try {
    const { sensorId, timeRange } = req.query;
    const sensorKey = `v${sensorId}`;

    // Calculate time range
    const now = new Date();
    let startDate = new Date(now);

    // Get historical data for specific sensor
    switch (timeRange) {
      case "1hr":
        startDate.setHours(now.getHours() - 1);
        break;
      case "6hrs":
        startDate.setHours(now.getHours() - 6);
        break;
      case "12hrs":
        startDate.setHours(now.getHours() - 12);
        break;
      case "24hrs":
        startDate.setDate(now.getDate() - 1);
        break;
      default:
        startDate.setHours(now.getHours() - 1);
    }

    // Get historical data for specific sensor
    const voltageHistory = await VoltageData.find({
      timestamp: { $gte: startDate },
      [`voltages.${sensorKey}`]: { $exists: true },
    }).sort({ timestamp: 1 });

    // Extract values for selected sensor
    const chartValues = voltageHistory.map((d) => d.voltages.get(sensorKey));
    const timestamps = voltageHistory.map((d) => d.timestamp);

    const configuration = {
      type: "line",
      data: {
        labels: timestamps.map((t) => t.toLocaleTimeString()),
        datasets: [
          {
            label: `Sensor ${sensorId} Voltage`,
            data: chartValues,
            borderColor: "#0077e4",
            borderWidth: 2,
            tension: 0.4,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { color: "rgba(255,255,255,0.1)" },
            ticks: { color: "#CBD5E0", maxTicksLimit: 10 },
          },
          y: {
            min: 0,
            max: 10,
            position: "right",
            grid: { color: "rgba(255,255,255,0.1)" },
            ticks: { color: "#CBD5E0" },
          },
        },
      },
    };

    const chartJSNodeCanvas = new ChartJSNodeCanvas({
      width: 800,
      height: 400,
      backgroundColour: "oklch(8% 0.005 255.4)", // Match dashboard background
    });

    const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    res.set("Content-Type", "image/png");
    res.send(buffer);
  } catch (error) {
    console.error("Chart generation error:", error);
    res.status(500).send("Error generating voltage chart");
  }
});

router.get("/voltage-data", auth, async (req, res) => {
  try {
    const { sensorId, timeRange, from, to } = req.query;
    const sensorIds = Array.isArray(sensorId)
      ? sensorId.map(Number)
      : [Number(sensorId)];

    let startDate, endDate;

    // Handle both date range and hour-based range
    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
    } else {
      const hours = parseInt(timeRange);
      if (isNaN(hours)) {
        throw new Error("Invalid time range");
      }
      endDate = new Date();
      startDate = new Date(endDate - hours * 60 * 60 * 1000);
    }

    // Query for documents that have any of the requested sensor voltages
    const voltageHistory = await VoltageData.find({
      timestamp: { $gte: startDate, $lte: endDate },
      $or: [
        { sensorGroup: "1-20", $and: [{ voltages: { $exists: true } }] },
        { sensorGroup: "21-40", $and: [{ voltages: { $exists: true } }] },
      ],
    }).sort({ timestamp: 1 });

    console.log("Found voltage records:", voltageHistory.length);

    const chartData = sensorIds
      .map((id) => {
        const sensorKey = `v${id}`;
        const sensorData = voltageHistory
          .map((record) => {
            const voltage = record.voltages.get(sensorKey);
            return {
              timestamp: record.timestamp,
              value: voltage !== undefined ? voltage : null,
            };
          })
          .filter((data) => data.value !== null);

        console.log(`Sensor ${id} data points:`, sensorData.length);

        return {
          sensorId: id,
          data: sensorData,
        };
      })
      .filter((sensor) => sensor.data.length > 0);

    if (chartData.length === 0) {
      console.log("No data found for sensors:", sensorIds);
    }

    res.json(chartData);
  } catch (error) {
    console.error("Error fetching voltage data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch voltage data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.get("/voltage-history/signal", auth, async (req, res) => {
  try {
    const { hours = 12 } = req.query;
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - parseInt(hours));

    // Get all records for the last 12 hours
    const allHistory = await VoltageData.find(
      { timestamp: { $gte: startTime } },
      { timestamp: 1, signalStrength: 1, _id: 0 }
    ).sort({ timestamp: 1 });

    // Group data by hour and take first record of each hour
    const hourlyData = [];
    let currentHour = new Date(startTime);

    for (let i = 0; i < parseInt(hours); i++) {
      const nextHour = new Date(currentHour);
      nextHour.setHours(nextHour.getHours() + 1);

      // Find first record in this hour
      const hourRecord = allHistory.find(
        (record) =>
          record.timestamp >= currentHour && record.timestamp < nextHour
      );

      if (hourRecord) {
        hourlyData.push({
          timestamp: hourRecord.timestamp,
          signalStrength: hourRecord.signalStrength,
        });
      }

      currentHour = nextHour;
    }

    res.json(hourlyData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch signal history",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
