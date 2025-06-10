const jwt = require("jsonwebtoken");
const { getToken } = require("../utils/redis.js");
const User = require("../models/User.js");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new Error("No token provided! Please authenticate.");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const storedToken = await getToken(`access_${decoded._id}`);
    const user = await User.findOne({ _id: decoded._id });

    if (!storedToken || token !== storedToken) {
      throw new Error("Invalid or expired token! Please authenticate.");
    }

    if (!user) {
      throw new Error('User not found');
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

module.exports = auth;
