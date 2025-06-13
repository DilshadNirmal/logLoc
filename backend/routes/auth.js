const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User.js");
const auth = require("../middleware/auth.js");
const { reverseGeocode } = require("../services/locationService.js");
const {
  storeRefreshToken,
  storeAccessToken,
  clearPreviousUserSessions,
} = require("../utils/redis.js");
const UserActivity = require("../models/UserActivity.js");
const { clearAccessToken, clearRefreshToken } = require("../utils/tokenUtils");

const router = express.Router();

// --- Geolocation Helper Functions ---
const isValidIP = (ip) => {
  if (!ip) return false;
  // Regex for IPv4 and IPv6
  const ipv4Regex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

async function fetchGeolocationData(ipAddress) {
  if (!isValidIP(ipAddress)) {
    console.warn("Invalid IP address for geolocation:", ipAddress);
    return null;
  }

  // Ensure IPINFO_TOKEN is set in your .env file
  const ipinfoToken = process.env.IPINFO_TOKEN;

  // 1. Try ip-api.com
  try {
    const ipApiResponse = await fetch(`http://ip-api.com/json/${ipAddress}`);
    if (ipApiResponse.ok) {
      const ipData = await ipApiResponse.json();
      if (ipData.status === "success") {
        return {
          source: "ip-api.com",
          city: ipData.city,
          region: ipData.regionName,
          country: ipData.country,
          org: ipData.org,
          latitude: ipData.lat,
          longitude: ipData.lon,
          timezone: ipData.timezone,
        };
      }
    }
  } catch (error) {
    console.error("ip-api.com error:", error.message);
  }

  // 2. Fallback to ipapi.co
  try {
    const ipapiResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`);
    if (ipapiResponse.ok) {
      const ipData = await ipapiResponse.json();
      if (!ipData.error) {
        return {
          source: "ipapi.co",
          city: ipData.city,
          region: ipData.region,
          country: ipData.country_name,
          org: ipData.org,
          latitude: ipData.latitude,
          longitude: ipData.longitude,
          timezone: ipData.timezone,
        };
      }
    }
  } catch (error) {
    console.error("ipapi.co error:", error.message);
  }

  // 3. Final fallback to ipinfo.io
  if (ipinfoToken) {
    try {
      const ipinfoResponse = await fetch(
        `https://ipinfo.io/${ipAddress}?token=${ipinfoToken}`
      );
      if (ipinfoResponse.ok) {
        const ipData = await ipinfoResponse.json();
        const [latitude, longitude] = ipData.loc
          ? ipData.loc.split(",").map(Number)
          : [null, null];
        return {
          source: "ipinfo.io",
          city: ipData.city,
          region: ipData.region,
          country: ipData.country,
          org: ipData.org,
          latitude,
          longitude,
          timezone: ipData.timezone,
        };
      }
    } catch (error) {
      console.error("ipinfo.io error:", error.message);
    }
  } else {
    console.warn("IPINFO_TOKEN not set. Skipping ipinfo.io service.");
  }

  console.warn("All geolocation services failed for IP:", ipAddress);
  return null; // Return null if all services fail
}

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
    const { Email, Password } = req.body;
    const user = await User.findOne({ Email });

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

    // Fetch geolocation data
    let locationData = null;
    const clientIP = req.ip; // Make sure 'trust proxy' is set in Express if behind a proxy
    if (clientIP) {
      locationData = await fetchGeolocationData(clientIP);
    }

    user.lastLogin = new Date();
    if (user.lastLoginStreakStart) {
      const diffTime = Math.abs(new Date() - user.lastLoginStreakStart);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      user.loginStreak = diffDays;
    } else {
      user.lastLoginStreakStart = new Date();
      user.loginStreak = 1;
    }
    if (locationData) {
      user.locationHistory = user.locationHistory || [];
      user.locationHistory.push({
        timestamp: new Date(),
        ipAddress: clientIP,
        details: locationData, // Save the whole location object from the service
      });
    }

    await user.save();

    const activity = new UserActivity({
      user: user._id,
      type: "login",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      // We'll update the location in the update-location endpoint
      location: locationData || { message: "Location data unavailable" },
    });

    // Store the activity ID in the user's session or token for later update
    const loginActivity = await activity.save();

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
      loginActivityId: loginActivity._id,
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

    const loginActivity = await UserActivity.findOne({
      user: user._id,
      type: "login",
    }).sort({ createdAt: -1 });

    if (loginActivity) {
      // Update the login activity with location
      loginActivity.location = {
        city: req.body.city,
        region: req.body.region,
        country: req.body.country,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
      };
      await loginActivity.save();
    }

    // Store location history
    user.locationHistory = user.locationHistory || [];
    user.locationHistory.push(req.body);
    await user.save();

    res.json({
      success: true,
      message: "Location updated successfully",
    });
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({
      success: false,
      message: "Error updating location",
      error: error.message,
    });
  }
});

router.post("/logout", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    // Log the logout activity
    await new UserActivity({
      user: user._id,
      type: "logout",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    }).save();

    // Clear tokens
    await clearAccessToken(user._id);
    await clearRefreshToken(user._id);

    res.json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    console.error("Error in logout:", error);
    res.status(500).json({
      success: false,
      message: "Error during logout",
      error: error.message,
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
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.cookieConsent = true;
    await user.save();

    res.cookie("cookieConsent", "true", {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({
      success: true,
      message: "Cookie consent updated successfully",
      user: {
        _id: user._id,
        cookieConsent: true,
      },
    });
  } catch (error) {
    console.error("Error updating cookie consent:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update cookie consent",
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

router.get("/admin/activities", auth, async (req, res) => {
  try {
    // Check if user is super_admin
    if (req.user.Role !== "super_admin") {
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

    const query = {
      type: { $in: ["login", "logout"] }, // Only include login/logout events
    };

    if (userId) query.user = userId;
    if (type && ["login", "logout"].includes(type)) query.type = type;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [activities, count] = await Promise.all([
      UserActivity.find(query)
        .populate("user", "UserName Email")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean(),
      UserActivity.countDocuments(query),
    ]);

    res.json({
      success: true,
      activities,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
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
