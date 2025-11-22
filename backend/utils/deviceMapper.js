// securityUtils.js

const extractNumber = (field) => {
    if (typeof field === 'number') return field;
    if (typeof field === 'object' && field !== null) {
        if (field.$numberDouble !== undefined) return parseFloat(field.$numberDouble);
        if (field.$numberInt !== undefined) return parseInt(field.$numberInt, 10);
        if (field.$numberLong !== undefined) return parseInt(field.$numberLong, 10);
    }
    return 0;
};

const formatUptime = (totalSeconds) => {
    if (typeof totalSeconds !== 'number' || totalSeconds < 0) return '0d 0h';
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    return `${days}d ${hours}h`;
};

const mapLogToSecurityDevice = (logEntry) => {
    const deviceId = logEntry.digitalTwin?.deviceId;
    const deviceType = logEntry.digitalTwin?.deviceType;

    const batteryPct = extractNumber(logEntry.telemetry?.batteryPercentage);
    const uptimeSec = extractNumber(logEntry.telemetry?.uptimeSeconds);
    const rssi = extractNumber(logEntry.battery?.wifiRSSI);
    const payloadSize = extractNumber(logEntry.battery?.payloadSizeBytes);

    const anomalyScoreRaw = extractNumber(logEntry.cerberus_analysis?.metrics?.anomaly_score);
    const predictedBatteryHours = extractNumber(logEntry.cerberus_analysis?.metrics?.battery_prediction_hours);
    const decision = logEntry.cerberus_analysis?.decision || "BALANCED";

    const dropRateEstimate = predictedBatteryHours > 0 ? (10000 / predictedBatteryHours) : 0;
    const predictedBatteryPct = Math.max(0, batteryPct - dropRateEstimate);

    const normalizedAnomalyScore = Math.min(1.0, anomalyScoreRaw / 10.0);

    return {
        id: deviceId,
        type: deviceType,
        battery: parseFloat(batteryPct.toFixed(1)),
        predictedBattery: parseFloat(predictedBatteryPct.toFixed(1)),
        anomalyScore: parseFloat(normalizedAnomalyScore.toFixed(2)),
        payloadSize,
        rssi,
        uptime: formatUptime(uptimeSec),
        cerberusDecision: decision.toUpperCase(),
    };
};

const getSecurityDecisions = (device) => {
    const { battery, predictedBattery, anomalyScore, cerberusDecision } = device;

    const dropSpeed = battery - predictedBattery;

    let encryptionLevel = "128-bit AES";
    let transmissionFrequency = "60s";

    switch (cerberusDecision) {
        case "SECURITY PRIORITY":
            encryptionLevel = "256-bit AES";
            transmissionFrequency = "5s";
            break;
        case "BATTERY SAVING":
            encryptionLevel = "128-bit AES";
            transmissionFrequency = "600s";
            break;
        default:
            break;
    }

    if (anomalyScore > 0.7) {
        encryptionLevel = "256-bit AES";
        transmissionFrequency = "1s";
    }

    const updateIntervalSec = parseFloat(transmissionFrequency.replace("s", ""));

    let securityRisk = "Low";
    if (anomalyScore > 0.7) securityRisk = "High";
    else if (anomalyScore > 0.4) securityRisk = "Moderate";

    return {
        encryptionLevel,
        transmissionFrequency,
        updateInterval: `${updateIntervalSec} sec`,
        securityRisk,
        dropSpeed: `${dropSpeed.toFixed(1)}% / 24h`,
        decisionPolicy: cerberusDecision,
    };
};

module.exports = { mapLogToSecurityDevice, getSecurityDecisions };
