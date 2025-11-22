import React, { useMemo, useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Cpu, Power, Zap, Clock, TrendingUp, RefreshCcw } from 'lucide-react';

// --- MOCK CONTEXT FOR SINGLE FILE RUNNABILITY ---
const ThemeContext = createContext();
const useTheme = () => {
    // Assume dark mode for aesthetic reasons
    return { isDarkMode: true };
};
// --- END MOCK CONTEXT ---


// --- BACKEND UTILITIES INTEGRATED ---

/**
 * Safely extracts the numerical value from BSON-like number fields.
 */
const extractNumber = (field) => {
    if (typeof field === 'number') return field;
    if (typeof field === 'object' && field !== null) {
      if (field.$numberDouble !== undefined) return parseFloat(field.$numberDouble);
      if (field.$numberInt !== undefined) return parseInt(field.$numberInt, 10);
      if (field.$numberLong !== undefined) return parseInt(field.$numberLong, 10);
    }
    return 0;
};

/**
 * Function to convert seconds to a human-readable 'Xd Yh' string.
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
 * Maps the detailed MongoDB log entry to the simplified device format.
 */
const mapLogToDeviceForAPI = (logEntry) => {
    const deviceId = logEntry.digitalTwin?.deviceId;
    
    const batteryPct = extractNumber(logEntry.telemetry?.batteryPercentage);
    const uptimeSec = extractNumber(logEntry.telemetry?.uptimeSeconds);
    const sendIntervalSec = extractNumber(logEntry.battery?.sendIntervalSec);

    // Calculate Payloads Sent Per Hour: (3600 seconds/hour) / sendIntervalSec
    // If interval is 0 or missing, we default to 15 payloads/hour
    const payloadsPerHour = sendIntervalSec > 0 ? 
                            Math.round(3600 / sendIntervalSec) : 
                            15; 
                            
    // Mocked value for avgConsumePerPayload
    let avgConsume = 0.8; 

    return {
        deviceId: deviceId,
        currentBatteryPct: parseFloat(batteryPct.toFixed(1)),
        payloadsSentPerHour: payloadsPerHour,
        avgConsumePerPayload: avgConsume, 
        uptime: formatUptime(uptimeSec),
    };
};

// --- MOCK LOG DATA (from deviceRoutes.js) ---
const realLogEntry = {
    "_id": { "$oid": "6920eb92d72497daa7f018fd" },
    "digitalTwin": { "deviceId": "ESP32-DEVKIT-001", "deviceType": "IoT Sensor Node", "hardwareSpecs": "ESP32-WROOM-32, 4MB flash, 320KB RAM", "firmware": "v1.0.0", "sensors": "DHT22, HC-SR04, LDR", "lastOTA": "1970-01-01T00:00:00Z" },
    "telemetry": { "temperature": { "$numberDouble": "22.95" }, "humidity": { "$numberInt": "81" }, "distance": { "$numberDouble": "30.287" }, "light": { "$numberInt": "0" }, "batteryPercentage": { "$numberDouble": "80.45" }, "uptimeSeconds": { "$numberInt": "10" }, "lastContactTime": "1970-01-01T00:00:10Z" },
    "battery": { "connectCount": { "$numberInt": "8" }, "connAttemptCount": { "$numberInt": "0" }, "sendCount": { "$numberInt": "872" }, "sendIntervalSec": { "$numberInt": "5" }, "firmwareUpdateCount": { "$numberInt": "0" }, "payloadSizeBytes": { "$numberInt": "801" }, "batteryConsumedThisPayload": { "$numberInt": "0" }, "failedTransmissions": { "$numberInt": "0" }, "retryCount": { "$numberInt": "0" }, "wifiRSSI": { "$numberInt": "0" } },
    "behaviour": { "resetCount": { "$numberInt": "0" }, "connectionPattern": "bluetooth" },
    "anomaly": { "sensorJump": false, "batterySpike": false, "tampering": false },
    "security": { "currentBattery": { "$numberDouble": "80.45" }, "isAnomalyDetected": false },
    "cerberus_analysis": { "decision": "BALANCED", "reasoning": "Trigger: System Nominal", "metrics": { "anomaly_score": { "$numberInt": "1" }, "battery_prediction_hours": { "$numberInt": "16090" } }, "processed_at": "2025-11-22T04:15:37.848624" },
    "receivedAt": { "$date": { "$numberLong": "1763765138394" } }
};

// Mock data for other devices (used to simulate the API response body)
const mockAPIResponse = [
    // Real transformed data will go here
    { deviceId: 'LORA-C3', currentBatteryPct: 56, avgConsumePerPayload: 1.6 },
    { deviceId: 'STM32-D4', currentBatteryPct: 94, payloadsSentPerHour: 2, avgConsumePerPayload: 0.3, uptime: '15d 08:12' }
];
// --- END BACKEND INTEGRATION ---


// 1. STATIC CONFIGURATION (Used for metadata and fallback values)
const staticDeviceConfig = [
    {
        id: 'ESP32-DEVKIT-001',
        type: 'IoT Sensor Node',
        payloadsSentPerHour: 15,
        avgConsumePerPayload: 0.8,
        uptime: 'N/A' 
    },
    {
        id: 'LORA-C3',
        type: 'LoRa Node',
        payloadsSentPerHour: 4, 
        avgConsumePerPayload: 1.6,
        uptime: 'N/A'
    },
    {
        id: 'STM32-D4',
        type: 'STM32 Edge',
        payloadsSentPerHour: 2,
        avgConsumePerPayload: 0.3,
        uptime: 'N/A'
    },
    { 
        id: 'RPI-B2',
        type: 'Raspberry Pi',
        payloadsSentPerHour: 30,
        avgConsumePerPayload: 0.1,
        uptime: 'N/A'
    }
];

/**
 * Calculates a predicted battery level 24 hours ahead based on current state and consumption rates.
 */
function predictBattery(currentBattery, payloadsPerHour, avgConsumePerPayload, hoursAhead = 24) {
    const rawConsumption = payloadsPerHour * avgConsumePerPayload * hoursAhead;
    const raw = currentBattery - rawConsumption;
    
    // Add a small randomized 'noise' (more realistic)
    const noise = (Math.random() - 0.45) * 2; 
    
    const pred = Math.max(0, Math.min(100, Math.round((raw + noise) * 10) / 10));
    return pred;
}

/**
 * Determines battery status mode for styling and labeling.
 */
function batteryMode(batteryPercent) {
    if (batteryPercent <= 20) return { label: 'Low', hex: '#ef4444', tailwindBg: 'bg-red-500' };
    if (batteryPercent <= 50) return { label: 'Moderate', hex: '#f59e0b', tailwindBg: 'bg-amber-500' };
    return { label: 'High', hex: '#34D399', tailwindBg: 'bg-emerald-500' };
}

/**
 * Helper to merge backend data with static configuration and calculate derived fields
 */
const enrichDeviceData = (config, telemetry) => {
    const deviceId = config.id;
    // Check if the telemetry data is for the current config entry (using deviceId)
    const liveTelemetry = telemetry?.deviceId === deviceId ? telemetry : null;

    // Merge the static configuration data with the live telemetry data
    const mergedData = {
        ...config,
        // Override with live telemetry values, providing default/fallback values (0 or N/A)
        batteryRemaining: liveTelemetry?.currentBatteryPct ?? config.batteryRemaining ?? 0,
        payloadsSentPerHour: liveTelemetry?.payloadsSentPerHour ?? config.payloadsSentPerHour,
        avgConsumePerPayload: liveTelemetry?.avgConsumePerPayload ?? config.avgConsumePerPayload,
        uptime: liveTelemetry?.uptime ?? config.uptime,
        // Mark if the device received live data
        isLive: !!liveTelemetry, 
    };

    // Calculate derived fields
    const predictedBattery = predictBattery(
        mergedData.batteryRemaining, 
        mergedData.payloadsSentPerHour, 
        mergedData.avgConsumePerPayload, 
        24
    );

    return { 
        ...mergedData, 
        predictedBattery, 
        consumedPerPayload: mergedData.avgConsumePerPayload 
    };
};

// --- SPARKLINE COMPONENT ---
const Sparkline = ({ data, strokeColor }) => {
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100; 
        const y = 100 - d; 
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-10">
            <polyline
                fill="none"
                stroke={strokeColor}
                strokeWidth="3"
                points={points}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

// --- DEVICE CARD COMPONENT ---
const DeviceCard = ({ device, isDarkMode }) => {
    const mode = batteryMode(device.batteryRemaining);

    // Generate mock historical data for the sparkline (7 days)
    const sparkData = useMemo(() => {
        let current = device.batteryRemaining;
        const trend = [];
        for (let i = 0; i < 7; i++) {
            trend.push(current);
            current = predictBattery(current, device.payloadsSentPerHour, device.consumedPerPayload, 24); 
        }
        return trend.reverse();
    }, [device.batteryRemaining, device.payloadsSentPerHour, device.consumedPerPayload]);

    const strokeColor = mode.hex;
    const cardClass = isDarkMode 
        ? 'bg-gray-800 border-gray-700 hover:border-emerald-500' 
        : 'bg-white border-gray-200 hover:border-emerald-500 shadow-lg';

    return (
        <div
            className={`card-anim p-6 rounded-2xl border transition-all duration-300 ${cardClass}`}
            style={{ animationDelay: `${Math.random() * 200}ms` }}
        >
            {/* Header Row */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-cyan-600/10 rounded-xl">
                        <Cpu className="w-6 h-6 text-cyan-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold truncate">{device.id}</h2>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{device.type}</p>
                    </div>
                </div>

                <div className="text-right">
                    <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {device.isLive ? 'Live Telemetry' : 'Static Fallback'}
                    </div>
                    <div
                        className={`inline-flex items-center gap-2 py-1 px-3 rounded-full text-sm font-semibold ${
                            isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: mode.hex }} />
                        <span style={{ color: mode.hex }}>{mode.label}</span>
                    </div>
                </div>
            </div>

            {/* Main Battery Display */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                    <span className="text-5xl font-extrabold" style={{ color: strokeColor }}>
                        {device.batteryRemaining}%
                    </span>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Battery Remaining
                    </span>
                </div>
                
                {/* 24h Prediction */}
                <div className={`p-4 rounded-xl text-right ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <span className="text-xl font-bold block">
                        {device.predictedBattery}%
                    </span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Predicted in 24h
                    </span>
                </div>
            </div>

            {/* Sparkline and Prediction Text */}
            <div className="mb-6">
                <Sparkline data={sparkData} strokeColor={strokeColor} />
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    7-Day Consumption Forecast
                </p>
            </div>

            {/* Detailed Stats */}
            <div className="space-y-3 pt-4 border-t border-dashed" style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                <StatItem 
                    icon={Power} 
                    label="Consumption Rate" 
                    value={`${device.consumedPerPayload}% / payload`} 
                    isDarkMode={isDarkMode}
                />
                <StatItem 
                    icon={Zap} 
                    label="Payload Frequency" 
                    value={`${device.payloadsSentPerHour} payloads / hr`} 
                    isDarkMode={isDarkMode}
                />
                <StatItem 
                    icon={Clock} 
                    label="Uptime" 
                    value={device.uptime} 
                    isDarkMode={isDarkMode}
                />
            </div>
        </div>
    );
};

// --- STAT ITEM HELPER ---
const StatItem = ({ icon: Icon, label, value, isDarkMode }) => (
    <div className="flex items-center justify-between text-sm">
        <div className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <Icon className="w-4 h-4 text-emerald-500" />
            <span>{label}</span>
        </div>
        <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{value}</span>
    </div>
);

// --- LOADING STATE COMPONENT ---
const LoadingState = ({ isDarkMode }) => (
    <div className={`flex flex-col items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
        <RefreshCcw className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
        <p className="mt-4 text-lg font-semibold">Simulating data fetching and transformation...</p>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Data is now self-contained within the application.
        </p>
    </div>
);


// --- MAIN COMPONENT ---
export default function BatteryManagement() {
    const { isDarkMode } = useTheme();
    const [devices, setDevices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Function to simulate fetching and processing data
    const processDeviceData = useCallback(() => {
        setIsLoading(true);
        setError(null);

        // Simulate network delay (500ms, as in the original server.js)
        const delay = 500; 

        // Data preparation logic (formerly in the backend)
        const transformedRealDevice = mapLogToDeviceForAPI(realLogEntry);
        const backendData = [transformedRealDevice, ...mockAPIResponse];

        setTimeout(() => {
            try {
                // Convert the prepared backend array to a map for easy lookup
                const telemetryMap = new Map(backendData.map(d => [d.deviceId, d]));

                // Merge static configuration with live telemetry
                const enriched = staticDeviceConfig.map(config => {
                    const telemetry = telemetryMap.get(config.id);
                    return enrichDeviceData(config, telemetry);
                });
                
                // This handles cases where the backend provides data for a device not in staticConfig
                backendData.forEach(telemetry => {
                    if (!telemetryMap.has(telemetry.deviceId)) {
                        enriched.push(enrichDeviceData({ id: telemetry.deviceId, type: 'Unknown Device' }, telemetry));
                    }
                });

                setDevices(enriched);
            } catch (e) {
                console.error('Error during data processing:', e);
                setError('An error occurred during internal data processing.');
            } finally {
                setIsLoading(false);
            }
        }, delay);
        
    }, []);

    useEffect(() => {
        processDeviceData();
        // Set up polling for simulated real-time updates (every 60 seconds)
        // Note: This only re-processes the static mock data.
        const interval = setInterval(processDeviceData, 60000); 
        return () => clearInterval(interval);
    }, [processDeviceData]);


    if (isLoading) {
        return <LoadingState isDarkMode={isDarkMode} />;
    }

    return (
        <div
            className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-slate-900'}`}
        >
            <div className="min-h-screen w-full p-6">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-8">
                        <h1
                            className="text-4xl font-extrabold mb-2"
                            style={{
                                background: isDarkMode ? 'linear-gradient(90deg,#34D399,#06B6D4)' : 'linear-gradient(90deg,#059669,#0891b2)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}
                        >
                            IoT Battery Dashboard
                        </h1>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Real-time battery predictions, consumption per payload, and operational uptime
                        </p>
                        {error && (
                            <div className="mt-4 p-3 rounded-lg bg-red-800/20 text-red-300 border border-red-500 text-sm">
                                {error}
                            </div>
                        )}
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {devices.map((device, index) => (
                            <DeviceCard key={device.id} device={device} isDarkMode={isDarkMode} />
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes cardLift {
                    from { transform: translateY(6px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes statusPulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.18); opacity: 0.6; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .card-anim { 
                    animation: cardLift 420ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both; 
                    animation-delay: var(--animation-delay, 0ms);
                }
                .pulse-dot { 
                    animation: statusPulse 1.8s infinite; 
                }
                
                /* Apply delay to cards based on index for staggered appearance */
                .grid > div:nth-child(1) { --animation-delay: 0ms; }
                .grid > div:nth-child(2) { --animation-delay: 100ms; }
                .grid > div:nth-child(3) { --animation-delay: 200ms; }
                .grid > div:nth-child(4) { --animation-delay: 300ms; }
            `}</style>
        </div>
    );
}