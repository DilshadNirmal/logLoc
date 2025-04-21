const express = require("express");

const auth = require("../middleware/auth.js");
const User = require("../models/User.js");
const {
  startDataSending,
  stopDataSending,
} = require("../services/dataSender.js");

const router = express.Router();

router.post("/send-data/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { duration } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await startDataSending(user._id.toString(), user.Email, duration);
    res.status(200).json({
      success: true,
      message: `Started sending ${duration} data to ${user.Email}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post("/stop-data/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;

    const stopped = stopDataSending(userId);
    res.status(200).json({
      success: stopped,
      message: stopped ? "Data sending stopped" : "No active sending found",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
