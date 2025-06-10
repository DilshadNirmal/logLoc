const User = require('../models/User');

const clearAccessToken = async (userId) => {
  await User.findByIdAndUpdate(userId, { accessToken: null });
};

const clearRefreshToken = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

module.exports = {
  clearAccessToken,
  clearRefreshToken
};