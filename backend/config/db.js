const mongoose = require("mongoose");

const connectDB = async (MONGODB_URI) => {
  await mongoose.connect(
    `${MONGODB_URI}/userDB` || "mongodb://localhost:27017/userDB",
    {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      heartbeatFrequencyMS: 10000,
    }
  );

  mongoose.connection.on("connection", () =>
    console.log(`connected to MONGODB`)
  );
};

module.exports = { connectDB };
