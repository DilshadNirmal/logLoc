const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  UserName: {
    type: String,
    required: true,
    unique: true,
  },
  Email: {
    type: String,
    required: true,
    unique: true,
  },
  Password: {
    type: String,
    required: true,
  },
  Role: {
    type: String,
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  activities: [
    {
      type: {
        type: String,
        enum: ["login", "logout"],
        requied: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      ipAddress: {
        type: String,
        requied: true,
      },
      location: {
        city: String,
        country: String,
        latitude: Number,
        longitude: Number,
      },
    },
  ],
  cookieConsent: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("User", UserSchema);
