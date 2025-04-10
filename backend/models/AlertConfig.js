const { default: mongoose } = require("mongoose");

const AlertConfigSchema = new mongoose.Schema({
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
  alertDelay: {
    type: Number,
    required: true,
    default: 5,
    min: 1,
    max: 60,
  },
});

module.exports = mongoose.model("AlertConfig", AlertConfigSchema);
