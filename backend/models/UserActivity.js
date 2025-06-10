// backend/models/UserActivity.js
const mongoose = require('mongoose');

const UserActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['login', 'logout'],
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  location: {
    city: String,
    region: String,
    country: String,
    latitude: Number,
    longitude: Number
  },
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

// Indexes for common queries
UserActivitySchema.index({ user: 1, type: 1, timestamp: -1 });
UserActivitySchema.index({ type: 1, timestamp: -1 });

module.exports = mongoose.model('UserActivity', UserActivitySchema);