const mongoose = require("mongoose");

const VoltageDataSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
  voltages: {
    v1: { type: Number, required: true },
    v2: { type: Number, required: true },
    v3: { type: Number, required: true },
    v4: { type: Number, required: true },
    v5: { type: Number, required: true },
    v6: { type: Number, required: true },
    v7: { type: Number, required: true },
    v8: { type: Number, required: true },
    v9: { type: Number, required: true },
    v10: { type: Number, required: true },
    v11: { type: Number, required: true },
    v12: { type: Number, required: true },
    v13: { type: Number, required: true },
    v14: { type: Number, required: true },
    v15: { type: Number, required: true },
    v16: { type: Number, required: true },
    v17: { type: Number, required: true },
    v18: { type: Number, required: true },
    v19: { type: Number, required: true },
    v20: { type: Number, required: true },
  },
  batteryStatus: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  signalStrength: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  //   device_id: {
  //     type: String,
  //     required: true,
  //   },
});

module.exports = mongoose.model("VoltageData", VoltageDataSchema);
