// --- Format uptime from seconds into "Xd Yh" ---
const formatUptime = (totalSeconds) => {
    if (!totalSeconds || totalSeconds < 0) return "0d 0h";

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);

    return `${days}d ${hours}h`;
};

// --- Convert MongoDB log → simplified device object ---
const mapLogToDeviceForAPI = (logEntry) => {
    const deviceId = logEntry.digitalTwin?.deviceId;

    const batteryPct = logEntry.telemetry?.batteryPercentage || 0;
    const uptimeSec = logEntry.telemetry?.uptimeSeconds || 0;
    const sendIntervalSec = logEntry.battery?.sendIntervalSec || 0;

    const payloadsPerHour =
        sendIntervalSec > 0 ? Math.round(3600 / sendIntervalSec) : 15;

    return {
        deviceId,
        currentBatteryPct: Number(batteryPct.toFixed(1)),
        payloadsSentPerHour: payloadsPerHour,
        avgConsumePerPayload: 0.8, // keep your mock
        uptime: formatUptime(uptimeSec)
    };
};

module.exports = { mapLogToDeviceForAPI };
 