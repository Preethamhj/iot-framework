const express = require("express");

const app = express();
const PORT = 3000;
const mongoose = require("mongoose");
const dataRoutes = require("./routes/data");
// Middleware to parse JSON
app.use(express.json());
mongoose.connect('mongodb+srv://hjpreetham1:Bfx3tEIMuSI2CxZ2@cluster0.3surfcb.mongodb.net/iot-security?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.log("❌ MongoDB Connection Error:", err);
  });
// Log file path


// Ensure log file exists

app.use("/api", dataRoutes);
// Simple health check route
app.get("/", (req, res) => {
    res.send("ESP32 Log Server Running...");
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
