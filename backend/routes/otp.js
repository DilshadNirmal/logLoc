const express = require("express");

const auth = require("../middleware/auth.js");
const { generateOTP, storeOTP, verifyOTP } = require("../utils/otpUtil.js");
const twilioClient = require("../config/twilio.js");

const router = express.Router();

router.post("/send-otp", auth, async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid Phone Number format. Use E.164 format (e.g., +1234567890)",
      });
    }

    const otp = generateOTP();
    storeOTP(phoneNumber, otp);

    const message = await twilioClient.messages.create({
      body: `Your verification code is: ${otp}. Valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    res.json({
      success: true,
      message: `OTP sent to ${phoneNumber} successfully`,
      messageId: message.sid,
    });
  } catch (error) {
    console.error(`Error sending OTP: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      // error: process.env.NODE_ENV === "production" ? null : error.message,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.post("/verify-otp", auth, async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!verifyOTP(phoneNumber, otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const user = await User.findById(req.user._id);
    user.phoneNumber = phoneNumber;
    user.phoneVerified = true;
    await user.save();

    res.json({
      success: true,
      message: "Phone number verified successfully",
      user: {
        ...user.toObject(),
        phoneVerified: true,
      },
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
    });
  }
});

module.exports = router;
