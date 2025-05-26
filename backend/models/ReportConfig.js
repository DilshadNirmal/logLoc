const mongoose = require("mongoose");

const ReportConfigSchema = new mongoose.Schema({
  frequency: {
    type: String,
    required: true,
    enum: ["daily", "weekly", "monthly"],
    default: "daily"
  },
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  defaultFormat: {
    type: String,
    default: "excel",
    enum: ["excel", "pdf"]
  },
  autoExport: {
    type: Boolean,
    default: false
  },
  includeCharts: {
    type: Boolean,
    default: true
  },
  _id: {
    type: String,
    default: "global"
  },
  lastSent: {
    type: Date,
    default: null
  }
});

const ReportConfig = mongoose.model("ReportConfig", ReportConfigSchema);

module.exports = ReportConfig;