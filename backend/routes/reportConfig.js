const express = require("express");
const auth = require("../middleware/auth.js");
const ReportConfig = require("../models/ReportConfig.js");
const User = require("../models/User.js");

const router = express.Router();

// Get report configuration
router.get("/report-config", auth, async (req, res) => {
  try {
    let config = await ReportConfig.findById("global").populate('users', 'UserName Email Role');
    
    if (!config) {
      // Create default config if none exists
      config = await ReportConfig.create({
        _id: "global",
        frequency: "daily",
        users: [],
        defaultFormat: "excel",
        autoExport: false,
        includeCharts: true
      });
    }
    
    res.json(config);
  } catch (error) {
    console.error("Error fetching report configuration:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch report configuration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Save report configuration
router.post("/report-config", auth, async (req, res) => {
  try {
    const { frequency, users, defaultFormat, autoExport, includeCharts } = req.body;
    
    // Validate users exist
    if (users && users.length > 0) {
      const userCount = await User.countDocuments({
        _id: { $in: users }
      });
      
      if (userCount !== users.length) {
        return res.status(400).json({
          success: false,
          message: "One or more selected users do not exist"
        });
      }
    }
    
    // Update or create report configuration
    const config = await ReportConfig.findOneAndUpdate(
      { _id: "global" },
      { 
        frequency, 
        users, 
        defaultFormat, 
        autoExport, 
        includeCharts 
      },
      { upsert: true, new: true }
    );
    
    res.json({
      success: true,
      message: "Report configuration saved successfully",
      config
    });
  } catch (error) {
    console.error("Error saving report configuration:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to save report configuration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

module.exports = router;