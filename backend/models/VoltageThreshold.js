const mongoose = require("mongoose");

const VoltageThresholdSchema = new mongoose.Schema({
  sensorId: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 40,
  },
  high: {
    type: Number,
    required: true,
    default: 450,
  },
  low: {
    type: Number,
    required: true,
    default: 100,
  },
});

module.exports = mongoose.model("VoltageThreshold", VoltageThresholdSchema);
