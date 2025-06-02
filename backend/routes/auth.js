const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User.js");
const auth = require("../middleware/auth.js");
const axios = require("../utils/axiosConfig.js");
const {
  locationFind,
  reverseGeocode,
} = require("../services/locationService.js");
const {
  storeRefreshToken,
  storeAccessToken,
  clearPreviousUserSessions,
} = require("../utils/redis.js");
const activityLogger = require("../middleware/activityLogger.js");
const UserActivity = require("../models/UserActivity.js");

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
    const { UserName, Password } = req.body;
    const user = await User.findOne({ UserName });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(Password, user.Password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    await clearPreviousUserSessions(user._id);

    const accessToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    const refreshToken = jwt.sign(
      { _id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    await storeAccessToken(user._id, accessToken);
    await storeRefreshToken(user._id, refreshToken);

    await user.save();

    await activityLogger.logActivity(user, "login", {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      location: req.body.location,
    });

    res.json({
      user: {
        _id: user._id,
        UserName: user.UserName,
        Email: user.Email,
        Role: user.Role,
        phoneNumber: user.phoneNumber,
        cookieConsent: user.cookieConsent,
        phoneVerified: user.phoneVerified,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

router.post("/update-location", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Store location history
    user.locationHistory = user.locationHistory || [];
    user.locationHistory.push(req.body);
    await user.save();

    await activityLogger.logActivity(user, "location_update", {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      location: req.body,
    });

    res.json({ message: "Location updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/logout", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    // First, find the last login activity
    const lastLoginActivity = await UserActivity.findOne({
      user: user._id,
      type: "login",
    }).sort({ createdAt: -1 });

    console.log("Last login activity:", lastLoginActivity);

    // Log the logout activity
    const logoutActivity = await activityLogger.logActivity(user, "logout", {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      location: lastLoginActivity?.location || null,
    });

    console.log("Created logout activity:", logoutActivity);

    // Update user's last activity
    user.lastActivity = {
      type: "logout",
      timestamp: new Date(),
      ipAddress: req.ip,
    };

    // Update the activities array in user model
    user.activities = user.activities || [];
    user.activities = user.activities.filter((a) => a.type !== "logout");
    user.activities.push({
      type: "logout",
      timestamp: new Date(),
      ipAddress: req.ip,
      location: lastLoginActivity?.location || null,
    });

    await user.save();

    // Clear tokens
    await clearAccessToken(user._id);
    await clearRefreshToken(user._id);

    res.send({
      message: "User logged out successfully",
      logoutActivityId: logoutActivity?._id,
    });
  } catch (error) {
    console.error("Error in logout:", error);
    res.status(500).send({
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

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

router.get("/admin/activities", auth, async (req, res) => {
  try {
    // Check if user is super_admin
    if (req.user.Role !== "super_admin") {
      console.log(
        `Access denied for user ${req.user._id} with role ${req.user.Role}`
      );
      return res.status(403).json({
        success: false,
        message: "Access denied. Only super admins can view activities.",
      });
    }

    const {
      userId,
      type,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};
    if (userId) query.user = userId;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const activities = await UserActivity.find(query)
      .populate("user", "UserName Email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await UserActivity.countDocuments(query);

    res.json({
      success: true,
      activities: activities || [],
      totalItems: count || 0,
      totalPages: Math.ceil(count / limit) || 1,
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error in /admin/activities:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
