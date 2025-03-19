// const mongoose = require("mongoose");

export const connectDB = async (MONGODB_URI) => {
  await mongoose.connect(MONGODB_URI || "mongodb://localhost:27017/userDB");

  mongoose.connection.on("connection", () =>
    console.log(`connected to MONGODB`)
  );
};
