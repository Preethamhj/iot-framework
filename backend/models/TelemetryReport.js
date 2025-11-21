const mongoose = require("mongoose");

const TelemetryReportSchema = new mongoose.Schema({

    digitalTwin: {
        deviceId: { type: String, required: true, index: true },
        deviceType: String,
        hardwareSpecs: String,
        firmware: String,
        sensors: String,
        lastOTA: String
    },

    telemetry: {
        temperature: Number,
        humidity: Number,
        distance: Number,
        light: Number,
        batteryPercentage: Number,
        uptimeSeconds: Number,
        lastContactTime: String
    },

    battery: {
        connectCount: Number,
        connAttemptCount: Number,
        sendCount: Number,
        sendIntervalSec: Number,
        firmwareUpdateCount: Number,
        payloadSizeBytes: Number,
        batteryConsumedThisPayload: Number,
        failedTransmissions: Number,
        retryCount: Number,
        wifiRSSI: Number
    },

    behaviour: {
        resetCount: Number,
        connectionPattern: String
    },

    anomaly: {
        sensorJump: Boolean,
        batterySpike: Boolean,
        tampering: Boolean
    },

    security: {
        currentBattery: Number,
        isAnomalyDetected: Boolean
    },

    cerberus_analysis: {
        decision: String,
        reasoning: String,
        metrics: {
            anomaly_score: Number,
            battery_prediction_hours: Number,
            battery_status: String
        },
        processed_at: String
    },

    // Auto timestamp for database
    receivedAt: { type: Date, default: Date.now }

}, { versionKey: false });

module.exports = mongoose.model("TelemetryReport", TelemetryReportSchema);
