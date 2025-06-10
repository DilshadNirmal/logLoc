const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  deviceId: {
    type: String,
    required: true
  },
  sensorId: {
    type: Number,
    required: true
  },
  sensorGroup: {
    type: String,
    enum: ['1-20', '21-40'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  value: {
    type: Number,
    required: true
  },
  threshold: {
    min: Number,
    max: Number
  },
  read: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);