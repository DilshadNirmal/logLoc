const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User.js");
const auth = require("../middleware/auth.js");
const axios = require("../utils/axiosConfig.js");
const { locationFind } = require("../utils/locationService.js");
const {
  storeRefreshToken,
  storeAccessToken,
  clearPreviousUserSessions,
} = require("../utils/redis.js");
const twilioClient = require("../config/twilio.js");
const { reverseGeocode } = require("../services/locationService.js");

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

module.exports = router;
