const { default: mongoose } = require("mongoose");

const GlobalEmailConfigSchema = new mongoose.Schema({
  emails: [
    {
      type: String,
      required: true,
    },
  ],
  _id: {
    type: String,
    default: "global",
  },
});

const GlobalEmailConfig = mongoose.model(
  "GlobalEmailConfig",
  GlobalEmailConfigSchema
);

module.exports = GlobalEmailConfig;
