const express = require("express");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");

const auth = require("../middleware/auth.js");
const VoltageData = require("../models/VoltageData.js");
const { checkAndSendAlert } = require("../services/alertSender.js");
const {
  getCountData,
  getIntervalData,
  getAverageData,
} = require("../services/reports/dataFetcher.js");
const { checkVoltageThresholds } = require('../services/notificationService');

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

    await checkVoltageThresholds({
      deviceId,
      sensorGroup: "1-20",
      voltages,
    });

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

    await checkVoltageThresholds({
      deviceId,
      sensorGroup: "21-40",
      voltages,
    });

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
    const {
      sensorId,
      timeRange,
      from,
      to,
      averageBy,
      mode,
      interval,
      selectedCounts,
      customCount,
    } = req.query;
    const sensorIds = Array.isArray(sensorId)
      ? sensorId.map(Number)
      : [Number(sensorId)];

    let startDate, endDate;

    // Handle both date range and hour-based range
    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
    } else {
      console.log(timeRange);
      console.log(isNaN(timeRange));

      const hours = parseInt(timeRange);
      console.log(hours);
      if (isNaN(hours)) {
        throw new Error("Invalid time range");
      }
      endDate = new Date();
      startDate = new Date(endDate - hours * 60 * 60 * 1000);
    }

    // Determine which mode to use based on the request
    let chartData;

    if (mode === "average" && averageBy) {
      // Get average data
      const sensorGroup = sensorIds[0] <= 20 ? "1-20" : "21-40";
      const configuration = sensorIds[0] <= 20 ? "A" : "B";

      const averageData = await getAverageData(
        configuration,
        { from: startDate, to: endDate },
        averageBy
      );

      // Format data for chart
      chartData = sensorIds.map((id) => ({
        sensorId: id,
        data: averageData.map((item) => ({
          timestamp: item.timestamp,
          value: item.value,
          label: item.label,
        })),
      }));
    } else if (mode === "interval" && interval) {
      // Get interval data
      const configuration = sensorIds[0] <= 20 ? "A" : "B";

      const intervalData = await getIntervalData(
        configuration,
        { from: startDate, to: endDate },
        interval
      );

      // Filter and format data for the requested sensors
      chartData = sensorIds.map((id) => ({
        sensorId: id,
        data: intervalData
          .filter((item) => item.sensorId === id)
          .map((item) => ({
            timestamp: item.start,
            value: item.value,
            min: item.min,
            max: item.max,
          })),
      }));
    } else if (mode === "count") {
      // Get count-based data
      const configuration = sensorIds[0] <= 20 ? "A" : "B";

      const countData = await getCountData({
        selectedCounts: selectedCounts
          ? JSON.parse(selectedCounts)
          : { last100: true },
        customCount: customCount ? parseInt(customCount) : 100,
        configuration
      });

      // Filter and format data for the requested sensors
      chartData = sensorIds.map((id) => ({
        sensorId: id,
        data: countData
          .filter(
            (item) => parseInt(item.sensorId.replace("Sensor ", "")) === id
          )
          .map((item) => ({
            timestamp: new Date(item.timestamp),
            value: item.value,
          })),
      }));
    } else {
      // Default behavior - raw voltage data
      // Query for documents that have any of the requested sensor voltages
      const voltageHistory = await VoltageData.find({
        timestamp: { $gte: startDate, $lte: endDate },
        $or: [
          { sensorGroup: "1-20", $and: [{ voltages: { $exists: true } }] },
          { sensorGroup: "21-40", $and: [{ voltages: { $exists: true } }] },
        ],
      }).sort({ timestamp: 1 });

      console.log("Found voltage records:", voltageHistory.length);

      chartData = sensorIds
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
    }

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

router.get('/voltage-history/raw', auth, async (req, res) => {
  try {
    const { from, to, sensorIds } = req.query;
    
    // Parse sensor IDs from query parameter
    const sensorIdList = sensorIds ? sensorIds.split(',').map(id => `v${id.trim()}`) : [];
    
    const query = {
      timestamp: {
        $gte: new Date(from),
        $lte: new Date(to)
      }
    };

    // Only add sensorGroup filter if we're not filtering by specific sensor IDs
    if (sensorIdList.length === 0 && req.query.sensorGroup) {
      query.sensorGroup = req.query.sensorGroup;
    }

    const data = await VoltageData.find(query)
      .sort({ timestamp: 1 })
      .lean();

    // Transform the data to match the frontend's expected format
    const result = [];
    const sensors = new Set();

    // First, collect all unique sensor IDs that match our filter
    data.forEach(entry => {
      Object.keys(entry.voltages).forEach(sensorId => {
        // If we have specific sensor IDs, only include those
        if (sensorIdList.length === 0 || sensorIdList.includes(sensorId)) {
          sensors.add(sensorId.replace('v', ''));
        }
      });
    });

    // Create an entry for each sensor
    sensors.forEach(sensorId => {
      const sensorData = {
        sensorId: parseInt(sensorId),
        data: []
      };

      data.forEach(entry => {
        const value = entry.voltages[`v${sensorId}`];
        if (value !== undefined) {
          sensorData.data.push({
            timestamp: entry.timestamp,
            value: value
          });
        }
      });

      result.push(sensorData);
    });

    console.log(`Returning data for ${result.length} sensors`);
    res.json(result);
  } catch (error) {
    console.error('Error fetching raw voltage data:', error);
    res.status(500).json({ message: 'Error fetching raw voltage data', error: error.message });
  }
});

router.get('/voltage-history/dashboard-chart', auth, async (req, res) => {
  try {
    const { sensorIds, side, timeRange = '24h' } = req.query;

    if (!side && (!sensorIds || sensorIds === 'all')) {
      return res.status(400).json({ message: 'Either side or specific sensorIds must be provided' });
    }

    let fromDate = new Date();
    const toDate = new Date();

    switch (timeRange) {
      case "1h":
        fromDate.setHours(toDate.getHours() - 1);
        break;
      case "6h":
        fromDate.setHours(toDate.getHours() - 6);
        break;
      case "12h":
        fromDate.setHours(toDate.getHours() - 12);
        break;
      case "24h":
      default:
        fromDate.setDate(toDate.getDate() - 1);
        break;
    }

    const query = {
      timestamp: {
        $gte: fromDate,
        $lte: toDate,
      },
    };

    // Determine which sensor group to query if 'all' sensors for a side are requested
    if (sensorIds === 'all' && side) {
      if (side === 'A') query.sensorGroup = '1-20';
      else if (side === 'B') query.sensorGroup = '21-40';
    }

    const rawData = await VoltageData.find(query).sort({ timestamp: 1 }).lean();

    let processedSensorIds = [];
    if (sensorIds && sensorIds !== 'all') {
      processedSensorIds = sensorIds.split(',').map(id => id.trim());
    } else if (side === 'A') {
      processedSensorIds = Array.from({ length: 20 }, (_, i) => (i + 1).toString());
    } else if (side === 'B') {
      processedSensorIds = Array.from({ length: 20 }, (_, i) => (i + 21).toString());
    }

    const result = processedSensorIds.map(id => {
      const sensorKey = `v${id}`;
      const sensorDataEntries = rawData.map(entry => ({
        timestamp: entry.timestamp,
        value: entry.voltages[sensorKey],
      })).filter(entry => entry.value !== undefined);
      
      return {
        sensorId: parseInt(id),
        data: sensorDataEntries,
      };
    }).filter(sensor => sensor.data.length > 0);

    console.log(`Dashboard chart: Returning data for ${result.length} sensors, timeRange: ${timeRange}, side: ${side}, sensorIds: ${sensorIds}`);
    res.json(result);

  } catch (error) {
    console.error('Error fetching dashboard chart data:', error);
    res.status(500).json({ message: 'Error fetching dashboard chart data', error: error.message });
  }
});

module.exports = router;
