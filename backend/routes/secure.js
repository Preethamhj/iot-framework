const express = require("express");
const TelemetryReport = require("../models/TelemetryReport");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // Get last 10 latest telemetry reports (if multi-device)
    const records = await TelemetryReport.find()
      .sort({ _id: -1 })
      .limit(10)
      .lean();

    if (!records || records.length === 0) {
      return res.status(404).json({ message: "No telemetry records found" });
    }

    // Convert DB records into Dashboard card format
    const devices = records.map((doc) => {
      const tele = doc.telemetry || {};
      const security = doc.security || {};
      const analysis = doc.cerberus_analysis || {};
      const battery = doc.battery || {};

      return {
        id: doc.digitalTwin?.deviceId || "Unknown",
        type: doc.digitalTwin?.deviceType || "IoT Device",
        battery: tele.batteryPercentage || 0,
        predictedBattery: analysis?.metrics?.battery_prediction_hours || 0,
        anomalyScore: analysis?.metrics?.anomaly_score || 0,
        payloadSize: battery?.payloadSizeBytes || 0,
        rssi: battery?.wifiRSSI || -100,
        uptime: tele?.uptimeSeconds
          ? (tele.uptimeSeconds / 3600).toFixed(1) + "h"
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
