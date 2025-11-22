// securityUtils.js

/**
 * Safely extracts the numerical value from BSON-like number fields,
 * handling $numberDouble, $numberInt, and standard JavaScript numbers.
 */
const extractNumber = (field) => {
    if (typeof field === 'number') return field;
    if (typeof field === 'object' && field !== null) {
      if (field.$numberDouble !== undefined) return parseFloat(field.$numberDouble);
      if (field.$numberInt !== undefined) return parseInt(field.$numberInt, 10);
      if (field.$numberLong !== undefined) return parseInt(field.$numberLong, 10);
    }
    return 0; // Default to 0 if the field is not found or malformed
};

/**
 * Function to convert seconds to a human-readable 'Xd Yh' string.
 * @param {number} totalSeconds - Uptime in seconds.
 * @returns {string} Formatted uptime string.
 */
const formatUptime = (totalSeconds) => {
    if (typeof totalSeconds !== 'number' || totalSeconds < 0) return '0d 0h';
    const SECONDS_IN_DAY = 86400;
    const SECONDS_IN_HOUR = 3600;

    const days = Math.floor(totalSeconds / SECONDS_IN_DAY);
    const remainingSeconds = totalSeconds % SECONDS_IN_DAY;
    const hours = Math.floor(remainingSeconds / SECONDS_IN_HOUR);

    return `${days}d ${hours}h`;
};

/**
 * Maps the detailed MongoDB log entry to the intermediate device format
 * required for security calculations.
 * @param {object} logEntry - The single, detailed log object.
 * @returns {object} Intermediate device object.
 */
const mapLogToSecurityDevice = (logEntry) => {
    const deviceId = logEntry.digitalTwin?.deviceId;
    const deviceType = logEntry.digitalTwin?.deviceType;
    
    const batteryPct = extractNumber(logEntry.telemetry?.batteryPercentage);
    const uptimeSec = extractNumber(logEntry.telemetry?.uptimeSeconds);
    const rssi = extractNumber(logEntry.battery?.wifiRSSI);
    const payloadSize = extractNumber(logEntry.battery?.payloadSizeBytes);

    const anomalyScoreRaw = extractNumber(logEntry.cerberus_analysis?.metrics?.anomaly_score);
    const predictedBatteryHours = extractNumber(logEntry.cerberus_analysis?.metrics?.battery_prediction_hours);
    const decision = logEntry.cerberus_analysis?.decision || 'BALANCED';

    // Simulate Predicted Battery drop rate for 24 hours (Logic copied from frontend)
    const dropRateEstimate = predictedBatteryHours > 0 ? (10000 / predictedBatteryHours) : 0; 
    const predictedBatteryPct = Math.max(0, batteryPct - dropRateEstimate); 

    // Normalize anomaly score to 0.0 to 1.0
    const normalizedAnomalyScore = Math.min(1.0, anomalyScoreRaw / 10.0);

    return {
        id: deviceId,
        type: deviceType,
        battery: parseFloat(batteryPct.toFixed(1)),
        predictedBattery: parseFloat(predictedBatteryPct.toFixed(1)),
        anomalyScore: parseFloat(normalizedAnomalyScore.toFixed(2)),
        payloadSize: payloadSize,
        rssi: rssi,
        uptime: formatUptime(uptimeSec),
        cerberusDecision: decision.toUpperCase(),
    };
};

/**
 * Determines security and transmission decisions based on core metrics.
 * @param {object} device - The intermediate device object.
 * @returns {object} Security decision properties.
 */
const getSecurityDecisions = (device) => {
    const { battery, predictedBattery, anomalyScore, cerberusDecision } = device;
    
    const dropSpeed = battery - predictedBattery;
    
    let encryptionLevel = '128-bit AES';
    let transmissionFrequency = '60s';
    
    switch (cerberusDecision) {
      case 'SECURITY PRIORITY':
        encryptionLevel = '256-bit AES';
        transmissionFrequency = '5s';
        break;
      case 'BATTERY SAVING':
        encryptionLevel = '128-bit AES';
        transmissionFrequency = '600s';
        break;
      case 'BALANCED':
      default:
        encryptionLevel = '128-bit AES';
        transmissionFrequency = '60s';
        break;
    }

    if (anomalyScore > 0.7) {
        encryptionLevel = '256-bit AES';
        transmissionFrequency = '1s';
    }

    const freqValue = parseFloat(transmissionFrequency.replace('s', ''));
    const updateIntervalSec = Math.round(freqValue * 100) / 100;

    let securityRisk = 'Low';
    if (anomalyScore > 0.7) {
      securityRisk = 'High';
    } else if (anomalyScore > 0.4) {
      securityRisk = 'Moderate';
    }
    
    return {
      encryptionLevel: encryptionLevel,
      transmissionFrequency: transmissionFrequency,
      updateInterval: `${updateIntervalSec} sec`,
      securityRisk: securityRisk,
      dropSpeed: `${dropSpeed.toFixed(1)}% / 24h`,
      decisionPolicy: cerberusDecision,
    };
};

module.exports = { mapLogToSecurityDevice, getSecurityDecisions };