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
const { generateOTP, storeOTP, verifyOTP } = require("../utils/otpUtil.js");
const twilioClient = require("../config/twilio.js");
const {
  startDataSending,
  stopDataSending,
} = require("../services/dataSender.js");

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
    if (user.Role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
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

module.exports = router;
