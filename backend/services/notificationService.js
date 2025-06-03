// backend/services/notificationService.js
const Notification = require('../models/Notification');
const AlertConfig = require('../models/AlertConfig');
const User = require('../models/User'); // Add this line to get all users

const checkVoltageThresholds = async (voltageData) => {
  try {
    const { deviceId, sensorGroup, voltages } = voltageData;
    const sensorIds = Object.keys(voltages);
    
    // Get all alert configurations for the sensors in this voltage data
    const alertConfigs = await AlertConfig.find({
      sensorId: { $in: sensorIds.map(id => parseInt(id.replace('v', ''))) }
    });

    console.log("Alert Configs:", alertConfigs);

    const notifications = [];

    for (const sensorKey of sensorIds) {
      const sensorNumber = parseInt(sensorKey.replace('v', ''));
      const alertConfig = alertConfigs.find(ac => ac.sensorId === sensorNumber);
      
      if (!alertConfig) {
        console.log(`No alert config found for sensor ${sensorNumber}`);
        continue;
      }

      const { low, high } = alertConfig;
      const voltage = voltages[sensorKey];
      let message = '';
      let severity = 'medium';

      if (voltage > high) {
        message = `High voltage (${voltage}V) detected on sensor ${sensorNumber} (${deviceId})`;
        severity = 'high';
      } else if (voltage < low) {
        message = `Low voltage (${voltage}V) detected on sensor ${sensorNumber} (${deviceId})`;
        severity = 'high';
      } else {
        console.log(`Sensor ${sensorNumber} value ${voltage}V is within thresholds (${low}-${high}V)`);
        continue; // Within threshold
      }

      // Create a single notification (without user ID for global notifications)
      notifications.push({
        deviceId,
        sensorId: sensorNumber,
        sensorGroup,
        message,
        severity,
        value: voltage,
        threshold: {
          min: low,
          max: high
        }
      });
    }

    if (notifications.length > 0) {
      console.log(`Creating ${notifications.length} global notifications`);
      await Notification.insertMany(notifications);
    } else {
      console.log('No threshold violations detected');
    }
  } catch (error) {
    console.error('Error in checkVoltageThresholds:', error);
    throw error;
  }
};

// Function to get notifications for a specific user or all global notifications
const getUserNotifications = async (userId) => {
  try {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    
    // Get both user-specific and global notifications
    const query = {
      $or: [
        { user: userId },
        { user: { $exists: false } } // Global notifications
      ],
      timestamp: { $gte: twelveHoursAgo }
    };

    return await Notification.find(query)
      .sort({ timestamp: -1 })
      .lean();
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

module.exports = { 
  checkVoltageThresholds,
  getUserNotifications
};