const express = require("express");

const auth = require("../middleware/auth.js");
const AlertConfig = require("../models/AlertConfig.js");
const VoltageThreshold = require("../models/VoltageThreshold.js");
const GlobalEmailConfig = require("../models/GlobalEmailConfigSchema.js");

const router = express.Router();

router.post("/alert-config", auth, async (req, res) => {
  try {
    const { sensorId, high, low, emails, alertDelay } = req.body;

    const config = await AlertConfig.findOneAndUpdate(
      { sensorId },
      { high, low, alertDelay },
      { upsert: true, new: true }
    );

    // Save global email configuration
    await GlobalEmailConfig.findOneAndUpdate(
      { _id: "global" },
      { emails },
      { upsert: true }
    );

    res.json({
      success: true,
      message: "Configuration saved successfully",
      config,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to save alert configuration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.get("/alert-config", auth, async (req, res) => {
  try {
    const configs = await VoltageThreshold.find({});
    const globalConfig = await GlobalEmailConfig.findOne({ _id: "global" });

    const response = configs.map((config) => ({
      ...config.toObject(),
      emails: globalConfig?.emails || [],
    }));

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/global-email-config", auth, async (req, res) => {
  try {
    const globalConfig = await GlobalEmailConfig.findOne({ _id: "global" });
    res.json(globalConfig?.emails || []);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch global email configuration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.post("/global-email-config", auth, async (req, res) => {
  try {
    const { emails } = req.body;

    if (!Array.isArray(emails)) {
      return res.status(400).json({
        success: false,
        message: "Emails must be an array",
      });
    }

    const config = await GlobalEmailConfig.findOneAndUpdate(
      { _id: "global" },
      { emails },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: "Global email configuration saved successfully",
      config,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to save global email configuration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.post("/thresholds", auth, async (req, res) => {
  try {
    const { sensorId, high, low } = req.body;

    const threshold = await VoltageThreshold.findOneAndUpdate(
      { sensorId },
      { high, low },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: "Threshold updated successfully",
      threshold,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update threshold",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.get("/thresholds", auth, async (req, res) => {
  try {
    const thresholds = await VoltageThreshold.find();
    const thresholdMap = thresholds.reduce((acc, threshold) => {
      acc[threshold.sensorId] = {
        high: threshold.high,
        low: threshold.low,
      };
      return acc;
    }, {});

    res.json(thresholdMap);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch thresholds",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
