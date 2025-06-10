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
const reportsRoutes = require("./routes/reports");
const reportConfigRoutes = require("./routes/reportConfig");
const notificationRoutes = require("./routes/notification");
const { initReportScheduler } = require("./services/reportScheduler");

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL,
      process.env.CLIENT_URL_2,
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: [
      "Authorization",
      "Content-Dispositon",
      "Content-Type",
      "Content-Length",
    ],
    maxAge: 3600,
    optionsSuccessStatus: 200,
  })
);
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
app.use("/api/reports", reportsRoutes);
app.use("/api", reportConfigRoutes);
app.use("/api/notifications", notificationRoutes);

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
  // Initialize the report scheduler
  initReportScheduler();
});
