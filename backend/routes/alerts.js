const express = require("express");

const auth = require("../middleware/auth.js");
const AlertConfig = require("../models/AlertConfig.js");
const VoltageThreshold = require("../models/VoltageThreshold.js");
const GlobalEmailConfig = require("../models/GlobalEmailConfigSchema.js");

const router = express.Router();

router.post("/alert-config", auth, async (req, res) => {
  try {
    const { sensorId, high, low, alertDelay, users } = req.body;
    console.log(`sensorId: ${sensorId}`);

    const config = await AlertConfig.findOneAndUpdate(
      { sensorId },
      { high, low, alertDelay },
      { upsert: true, new: true }
    );

    const updateData = {};
    if (Array.isArray(users)) {
      updateData.users = users;
    }

    // Save global email configuration
    await GlobalEmailConfig.findOneAndUpdate(
      { _id: "global" },
      updateData,
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
    const configs = await AlertConfig.find({});
    const globalConfig = await GlobalEmailConfig.findOne({ _id: "global" })
      .populate('users', 'UserName Email Role phoneNumber');
    console.log(`configs: ${JSON.stringify(configs)}`);

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
    const globalConfig = await GlobalEmailConfig.findOne({ _id: "global" })
      .populate('users', 'UserName Email Role phoneNumber');
      
    res.json({
      emails: globalConfig?.emails || [],
      users: globalConfig?.users || [],
      alertDelay: globalConfig?.alertDelay || 5
    });
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
    const { emails, users, alertDelay } = req.body;

    const updateData = {};
    
    // Add emails array if provided
    if (Array.isArray(emails)) {
      updateData.emails = emails;
    }
    
    // Add users array if provided
    if (Array.isArray(users)) {
      updateData.users = users;
    }
    
    // Add alertDelay if provided
    if (alertDelay !== undefined) {
      updateData.alertDelay = alertDelay;
    }

    const config = await GlobalEmailConfig.findOneAndUpdate(
      { _id: "global" },
      updateData,
      { upsert: true, new: true }
    ).populate('users', 'UserName Email Role phoneNumber');

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

    const threshold = await AlertConfig.findOneAndUpdate(
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
    const thresholds = await AlertConfig.find();
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
