const express = require("express");
const router = express.Router();

const TelemetryReport = require("../models/TelemetryReport");
const { mapLogToDeviceForAPI } = require("../utils/deviceMapper");

// GET /api/devices/battery-status
router.get("/battery-status", async (req, res) => {
    try {
        console.log("API Hit: Fetching battery status from MongoDB...");

        // Get the latest log for each device
        const logs = await TelemetryReport.aggregate([
            { $sort: { receivedAt: -1 } },
            {
                $group: {
                    _id: "$digitalTwin.deviceId",
                    latestLog: { $first: "$$ROOT" }
                }
            }
        ]);

        // Transform each log entry
        const transformed = logs.map((item) =>
            mapLogToDeviceForAPI(item.latestLog)
        );

        // Optional extra demo devices
        transformed.push(
            { deviceId: "LORA-C3", currentBatteryPct: 56, avgConsumePerPayload: 1.6, uptime: "1d 05h" },
            { deviceId: "STM32-D4", currentBatteryPct: 94, payloadsSentPerHour: 2, avgConsumePerPayload: 0.3, uptime: "15d 08h" }
        );

        res.json(transformed);
    } catch (err) {
        console.error("Error fetching battery status:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
