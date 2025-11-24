const express = require("express");
const TelemetryReport = require("../models/TelemetryReport");

const router = express.Router();

// Utility to extract numbers safely from MongoDB extended formats
const extractNumber = (field) => {
  if (typeof field === "number") return field;
  if (typeof field === "string") return Number(field);

  if (field && typeof field === "object") {
    if (field.$numberDouble !== undefined) return parseFloat(field.$numberDouble);
    if (field.$numberInt !== undefined) return parseInt(field.$numberInt, 10);
    if (field.$numberLong !== undefined) return parseInt(field.$numberLong, 10);
  }
  return 0;
};

router.get("/", async (req, res) => {
  try {
    // Fetch last 10 device records
    const records = await TelemetryReport.find()
      .sort({ _id: -1 })
      .limit(10)
      .lean();

    if (!records || records.length === 0) {
      return res.status(404).json({ message: "No telemetry records found" });
    }

    // Transform DB documents into frontend-ready format
    const devices = records.map((doc) => {
      const tele = doc.telemetry || {};
      const analysis = doc.cerberus_analysis || {};
      const security = doc.security || {};
      const battery = doc.battery || {};
      const twin = doc.digitalTwin || {};

      return {
        // React requires unique keys -> send MongoDB _id
        _id: doc._id?.toString(),

        // Device Info
        id: twin.deviceId || "Device",
        type: twin.deviceType || "IoT Device",

        // Numeric-safe values
        battery: extractNumber(tele.batteryPercentage),
        predictedBattery: extractNumber(analysis?.metrics?.battery_prediction_hours),
        anomalyScore: extractNumber(analysis?.metrics?.anomaly_score),

        // Additional metrics
        payloadSize: extractNumber(battery.payloadSizeBytes),
        rssi: extractNumber(battery.wifiRSSI),

        uptime: tele.uptimeSeconds
          ? (extractNumber(tele.uptimeSeconds) / 3600).toFixed(1) + "h"
          : "--",
      };
    });

    res.json({ devices });
  } catch (err) {
    console.error("Security Dashboard API Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
