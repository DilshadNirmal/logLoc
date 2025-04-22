const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const otpStore = new Map();

const storeOTP = (phoneNumber, otp) => {
  otpStore.set(phoneNumber, {
    otp,
    timestamp: Date.now(),
    attemps: 0,
  });
};

const verifyOTP = (phoneNumber, userOTP) => {
  const otpData = otpStore.get(phoneNumber);

  if (!otpData) {
    return false;
  }

  if (Date.now() - otpData.timestamp > 5 * 60 * 1000) {
    otpStore.delete(phoneNumber);
    return false;
  }

  if (otpData.attemps >= 3) {
    otpStore.delete(phoneNumber);
    return false;
  }
  if (otpData.otp !== userOTP) {
    otpData.attemps += 1;
    return false;
  }
  otpStore.delete(phoneNumber);

  return otpData.otp === userOTP;
};

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP,
};
