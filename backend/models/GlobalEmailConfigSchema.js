const { default: mongoose } = require("mongoose");

const GlobalEmailConfigSchema = new mongoose.Schema({
 
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  alertDelay: {
    type: Number,
    default: 5,
    min: 1,
    max: 10,
  },
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