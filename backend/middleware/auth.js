const jwt = require("jsonwebtoken");
const { getToken } = require("../utils/redis.js");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new Error("No token provided! Please authenticate.");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const storedToken = await getToken(`access_${decoded._id}`);

    if (!storedToken || token !== storedToken) {
      throw new Error("Invalid or expired token! Please authenticate.");
    }

    req.user = decoded;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).send({
      error: "Please Authenticate",
      details: error.message,
    });
  }
};

module.exports = auth;
