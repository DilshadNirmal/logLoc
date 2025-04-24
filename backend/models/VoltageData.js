const mongoose = require("mongoose");

const voltageValidator = {
  validator: function (v) {
    return (
      !isNaN(v) && typeof v === "number" && isFinite(v) && v >= -10 && v <= 10
    );
  },
  message: (props) =>
    `${props.value} is not a valid voltage reading. Must be between -10 and 10 mV`,
};

// Create a voltage schema with all required fields
const voltagesSchema = {
  type: Map,
  of: {
    type: Number,
    // validate: voltageValidator,
  },
  required: true,
  default: {},
};

const VoltageDataSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true,
  },
  deviceId: {
    type: String,
    required: true,
    match: /^XY\d{3}-[A-Z]$/, // Validates format like XY001-A
    index: true,
  },
  sensorGroup: {
    type: String,
    required: true,
    enum: ["1-20", "21-40"],
    index: true, // Add index for quick filtering
  },
  voltages: voltagesSchema,
  batteryStatus: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    // validate: voltageValidator,
  },
  signalStrength: {
    type: Number,
    required: true,
    // min: 0,
    // max: 50,
    // validate: {
    //   validator: function (v) {
    //     return !isNaN(v) && v >= 0 && v <= 50;
    //   },
    //   message: (props) =>
    //     `${props.value} is not a valid signal strength! Must be between 0 and 50 dBm.`,
    // },
  },
});

// compound index for timestamp and sensorGroup
VoltageDataSchema.index({ timestamp: 1, sensorGroup: 1 });

module.exports = mongoose.model("VoltageData", VoltageDataSchema);
