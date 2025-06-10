const Redis = require("redis");

const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.connect().catch(console.error);

const storeRefreshToken = async (userId, token) => {
  await redisClient.set(`refresh_${userId}`, token, { EX: 7 * 24 * 60 * 60 });
};

const storeAccessToken = async (userId, token) => {
  await redisClient.set(`access_${userId}`, token, {
    EX: 24 * 60 * 60,
  });
};

const getToken = async (key) => {
  return await redisClient.get(key);
};

const deleteToken = async (key) => {
  await redisClient.del(key);
};

const clearPreviousUserSessions = async (userId) => {
  const accessKey = `access_${userId}`;
  const refreshKey = `refresh_${userId}`;
  await redisClient.del(accessKey);
  await redisClient.del(refreshKey);
};

module.exports = {
  storeRefreshToken,
  storeAccessToken,
  getToken,
  deleteToken,
  clearPreviousUserSessions,
};
