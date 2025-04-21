require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { connectDB } = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const voltageRoutes = require("./routes/voltage");
const alertRoutes = require("./routes/alerts");
const otpRoutes = require("./routes/otp");
const dataRoutes = require("./routes/data");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// get method to check api running
app.get("/", (req, res) => {
  res.send({ message: "logLoc online" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/api", voltageRoutes);
app.use("/api", alertRoutes);
app.use("/api", otpRoutes);
app.use("/api", dataRoutes);

// Connect to MongoDB
connectDB(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connection successful");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
