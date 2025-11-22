const express = require("express");
const TelemetryReport = require("../models/TelemetryReport");
const router = express.Router();

/**
 * GET /api/reports/latest?limit=10&deviceId=ESP32-DEVKIT-001
 */
router.get("/reports/latest", async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const deviceId = req.query.deviceId;

        const query = deviceId ? { "digitalTwin.deviceId": deviceId } : {};

        const reports = await TelemetryReport
            .find(query)
            .sort({ receivedAt: -1 }) // newest first
            .limit(limit);

        return res.json({
            success: true,
            count: reports.length,
            data: reports
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

module.exports = router;

