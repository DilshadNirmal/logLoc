const mongoose = require("mongoose");

const connectDB = async (MONGODB_URI) => {
  await mongoose.connect(
    `${MONGODB_URI}/userDB` || "mongodb://localhost:27017/userDB"
  );

  mongoose.connection.on("connection", () =>
    console.log(`connected to MONGODB`)
  );
};

module.exports = { connectDB };
