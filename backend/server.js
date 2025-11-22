const express = require("express");
const codeRouter =  require("./routes/code");   
const cors = require("cors");
const app = express();
const PORT = 3000;
const mongoose = require("mongoose");
const dataRoutes = require("./routes/data");
const reportRoutes = require("./routes/report");
const fetchReports = require("./routes/fetchReports");
const batteryRoutes = require("./routes/battery");
const securotyiRoutes = require("./routes/secure");
// Middleware to parse JSON
app.use(express.json());

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"],
}));

mongoose.connect('mongodb+srv://hjpreetham1:Bfx3tEIMuSI2CxZ2@cluster0.3surfcb.mongodb.net/iot-security?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.log("❌ MongoDB Connection Error:", err);
  });
// Log file path
app.use("/reports", fetchReports);
app.use("/code", codeRouter);
app.use("/battery-status", batteryRoutes);

// Ensure log file exists
app.use("/report", reportRoutes);
app.use("/api", dataRoutes);
app.use("/dashboard/security", securotyiRoutes);
// Simple health check route


// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
