const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User.js");
const auth = require("../middleware/auth.js");
const axios = require("../utils/axiosConfig.js");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const { locationFind } = require("../utils/locationService.js");
const {
  storeRefreshToken,
  storeAccessToken,
  clearPreviousUserSessions,
} = require("../utils/redis.js");
const { generateOTP, storeOTP, verifyOTP } = require("../utils/otpUtil.js");
const twilioClient = require("../config/twilio.js");
const {
  startDataSending,
  stopDataSending,
} = require("../services/dataSender.js");
const VoltageData = require("../models/VoltageData.js");
const VoltageThreshold = require("../models/VoltageThreshold.js");
const AlertConfig = require("../models/AlertConfig.js");
const { checkAndSendAlert } = require("../services/alertSender.js");
const GlobalEmailConfig = require("../models/GlobalEmailConfigSchema.js");

const router = express.Router();

router.get("/signup", async (req, res) => {
  try {
    const { UserName, Email, Password, Role, phoneNumber } = req.query;
    const hashedPassword = await bcrypt.hash(Password, 8);

    const user = new User({
      UserName,
      Email,
      Password: hashedPassword,
      Role,
      phoneNumber,
    });

    await user.save();
    res.status(201).send({ message: "User created successfully" });
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { UserName, Password, latitude, longitude, consent } = req.body;
    const user = await User.findOne({ UserName });

    if (!user || !(await bcrypt.compare(Password, user.Password))) {
      throw new Error("Invalid login credentials");
    }

    await clearPreviousUserSessions(user._id);

    const accessToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const refreshToken = jwt.sign(
      { _id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    await storeAccessToken(user._id, accessToken);
    await storeRefreshToken(user._id, refreshToken);

    // Get location data
    let locationData = null;
    console.log("Latitude:", latitude, "Longitude:", longitude);
    if (latitude && longitude) {
      locationData = await reverseGeocode(latitude, longitude);
      console.log(locationData);
    } else {
      locationData = await locationFind(req.ip);
    }

    const clientIp = req.ip;

    // Update activity with login
    user.activities = user.activities.filter(
      (activity) => activity.type !== "login"
    );
    user.activities.push({
      type: "login",
      ipAddress: clientIp,
      location: {
        city: locationData?.city || locationData?.state_district || "Unknown",
        country: locationData?.country || "Unknown",
        latitude: locationData?.latitude || null,
        longitude: locationData?.longitude || null,
      },
    });

    await user.save();

    // Set cookie consent
    if (user.cookieConsent) {
      res.cookie("cookieConsent", true, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
    }

    res.send({
      user: {
        ...user.toObject(),
        phoneVerified: user.phoneVerified || false,
      },
      accessToken,
      refreshToken,
      hasCookieConsent: user.cookieConsent,
    });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

router.post("/logout", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const clientIp = req.ip;

    // Update activity with logout
    user.activities = user.activities.filter(
      (activity) => activity.type !== "logout"
    );
    user.activities.push({
      type: "logout",
      ipAddress: clientIp,
      location: user.activities.find((activity) => activity.type === "login")
        .location,
    });

    await user.save();

    res.send({ message: "User logged out successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// reverse geocode function
const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    );

    return {
      city:
        response.data.address.city ||
        response.data.address.town ||
        response.data.address.village ||
        response.data.address.state_district ||
        "Unknown",
      country: response.data.address.country || "Unknown",
      latitude,
      longitude,
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
};

// Add the reverse geocode endpoint
router.post("/reverse-geocode", async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const locationData = await reverseGeocode(latitude, longitude);

    if (!locationData) {
      return res.status(400).json({ message: "Failed to get location data" });
    }

    res.json(locationData);
  } catch (error) {
    console.error("Error in reverse geocoding endpoint:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/users", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    console.log(user);
    if (user.Role !== "admin" && user.Role !== "super_admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin privileges required." });
    }
    const users = await User.find({}, { Password: 0 }); // Exclude password field
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }
    res.send(user);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

router.post("/update-cookie-consent", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.cookieConsent = true;
    await user.save();

    res.cookie("cookieConsent", "true", {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({ message: "Cookie consent saved" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/send-otp", auth, async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid Phone Number format. Use E.164 format (e.g., +1234567890)",
      });
    }

    const otp = generateOTP();
    storeOTP(phoneNumber, otp);

    const message = await twilioClient.messages.create({
      body: `Your verification code is: ${otp}. Valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    res.json({
      success: true,
      message: `OTP sent to ${phoneNumber} successfully`,
      messageId: message.sid,
    });
  } catch (error) {
    console.error(`Error sending OTP: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      // error: process.env.NODE_ENV === "production" ? null : error.message,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.post("/verify-otp", auth, async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!verifyOTP(phoneNumber, otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const user = await User.findById(req.user._id);
    user.phoneNumber = phoneNumber;
    user.phoneVerified = true;
    await user.save();

    res.json({
      success: true,
      message: "Phone number verified successfully",
      user: {
        ...user.toObject(),
        phoneVerified: true,
      },
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
    });
  }
});

router.post("/send-data/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { duration } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await startDataSending(user._id.toString(), user.Email, duration);
    res.status(200).json({
      success: true,
      message: `Started sending ${duration} data to ${user.Email}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post("/stop-data/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;

    const stopped = stopDataSending(userId);
    res.status(200).json({
      success: stopped,
      message: stopped ? "Data sending stopped" : "No active sending found",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get("/verify-token", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.send({ user });
  } catch (error) {
    res.status(401).send({ error: "Please Authenticate" });
  }
});

router.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token is required" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded._id);

    if (!user) {
      return res
        .status(401)
        .json({ message: "User not found || Invalid Token" });
    }

    const accessToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    await storeAccessToken(user._id, accessToken);

    res.send({
      accessToken,
      user,
    });
  } catch (error) {
    res.status(401).send({ error: "Please Authenticate" });
  }
});

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

router.get("/voltage-data", async (req, res) => {
  try {
    const { sensorId, timeRange } = req.query;
    const sensorKey = `v${sensorId}`;

    // Calculate time range (same as image endpoint)
    const now = new Date();
    let startDate = new Date(now);

    switch (timeRange) {
      case "1h":
        startDate.setHours(now.getHours() - 1);
        break;
      case "6h":
        startDate.setHours(now.getHours() - 6);
        break;
      case "12h":
        startDate.setHours(now.getHours() - 12);
        break;
      case "24h":
        startDate.setDate(now.getDate() - 1);
        break;
      default:
        startDate.setHours(now.getHours() - 1);
    }

    // Get formatted data for D3
    const voltageHistory = await VoltageData.find({
      timestamp: { $gte: startDate },
      [`voltages.${sensorKey}`]: { $exists: true },
    })
      .sort({ timestamp: 1 })
      .lean();

    const chartData = voltageHistory.map((d) => ({
      timestamp: d.timestamp,
      value: d.voltages[sensorKey],
    }));

    res.json(chartData);
  } catch (error) {
    console.error("Chart data error:", error);
    res.status(500).json({ error: "Failed to get chart data" });
  }
});

router.put("/users/:userId", auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    if (currentUser.Role !== "super_admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { UserName, Email, Role, phoneNumber } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user details
    user.UserName = UserName;
    user.Email = Email;
    user.Role = Role;
    user.phoneNumber = phoneNumber;

    await user.save();
    res.json({ message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/users/:userId/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword, isSuperAdmin } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only allow users to change their own password unless they're super_admin
    const currentUser = await User.findById(req.user._id);
    if (
      currentUser._id.toString() !== user._id.toString() &&
      currentUser.Role !== "super_admin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Verify current password only if not super admin
    if (!isSuperAdmin) {
      const isMatch = await bcrypt.compare(currentPassword, user.Password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 8);
    user.Password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/users/:userId", auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    if (currentUser.Role !== "super_admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Super admin privileges required." });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent super_admin from deleting themselves
    if (user._id.toString() === currentUser._id.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    }

    await User.findByIdAndDelete(req.params.userId);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
