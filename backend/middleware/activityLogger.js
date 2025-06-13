const UserActivity = require("../models/UserActivity");

const activityLogger = {
  logActivity: async (
    user,
    type,
    { ip, userAgent, location, metadata = {} }
  ) => {
    try {
      if (!user || !user._id) {
        console.error("Invalid user object provided to logActivity");
        return null;
      }

      const activityData = {
        user: user._id,
        type,
        ipAddress: ip,
        userAgent,
        metadata,
        timestamp: new Date(),
      };

      // Only add location if it exists
      if (location && typeof location === "object") {
        activityData.location = {
          city: location.city,
          region: location.region,
          country: location.country,
          latitude: location.latitude,
          longitude: location.longitude,
        };
      }

      const activity = new UserActivity(activityData);
      const savedActivity = await activity.save();
      return savedActivity;
    } catch (error) {
      console.error("Error in logActivity:", {
        error: error.message,
        stack: error.stack,
        userId: user?._id,
        type,
      });
      return null;
    }
  },
};

module.exports = activityLogger;
