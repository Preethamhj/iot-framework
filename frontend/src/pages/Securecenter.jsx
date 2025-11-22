import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Lock, Zap, Clock, Wifi, Battery, AlertTriangle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext'; 

// --- Configuration and API Endpoint ---
const API_URL = 'http://localhost:5000/api/latest-logs'; // <--- Matches the Node.js server URL


// --- Data Mapping & Utility Functions ---

// Function to safely extract a BSON-like number ($numberDouble, $numberInt)
const extractNumber = (field) => {
    if (typeof field === 'number') return field;
    if (typeof field === 'object' && field !== null) {
      if (field.$numberDouble !== undefined) return parseFloat(field.$numberDouble);
      if (field.$numberInt !== undefined) return parseInt(field.$numberInt, 10);
    }
    return 0;
};

// Function to convert seconds to a human-readable 'Xd Yh' string
const formatUptime = (totalSeconds) => {
    if (typeof totalSeconds !== 'number' || totalSeconds < 0) return '0d 0h';
    const SECONDS_IN_DAY = 86400;
    const SECONDS_IN_HOUR = 3600;

    const days = Math.floor(totalSeconds / SECONDS_IN_DAY);
    const remainingSeconds = totalSeconds % SECONDS_IN_DAY;
    const hours = Math.floor(remainingSeconds / SECONDS_IN_HOUR);

    return `${days}d ${hours}h`;
};

// Log to Security Device Mapper
function mapLogToSecurityDevice(logEntry) {
    const deviceId = logEntry.digitalTwin.deviceId;
    const deviceType = logEntry.digitalTwin.deviceType;
    
    // Telemetry extraction
    const batteryPct = extractNumber(logEntry.telemetry?.batteryPercentage);
    const uptimeSec = extractNumber(logEntry.telemetry?.uptimeSeconds);
    const rssi = extractNumber(logEntry.battery?.wifiRSSI);
    const payloadSize = extractNumber(logEntry.battery?.payloadSizeBytes);

    // Cerberus Analysis extraction
    const anomalyScoreRaw = extractNumber(logEntry.cerberus_analysis?.metrics?.anomaly_score);
    const predictedBatteryHours = extractNumber(logEntry.cerberus_analysis?.metrics?.battery_prediction_hours);
    const decision = logEntry.cerberus_analysis?.decision || 'BALANCED';

    // Simulate Predicted Battery drop rate for 24 hours
    const dropRateEstimate = predictedBatteryHours > 0 ? (10000 / predictedBatteryHours) : 0; 
    const predictedBatteryPct = Math.max(0, batteryPct - dropRateEstimate); 

    // Normalize anomaly score to 0.0 to 1.0 (assuming the raw score is 0-10)
    const normalizedAnomalyScore = Math.min(1.0, anomalyScoreRaw / 10.0);

    return {
        id: deviceId,
        type: deviceType,
        battery: parseFloat(batteryPct.toFixed(1)),
        predictedBattery: parseFloat(predictedBatteryPct.toFixed(1)), // Simulated value
        anomalyScore: parseFloat(normalizedAnomalyScore.toFixed(2)),
        payloadSize: payloadSize,
        rssi: rssi,
        uptime: formatUptime(uptimeSec),
        cerberusDecision: decision.toUpperCase(),
    };
}

// Security Decision Logic
function getSecurityDecisions(device) {
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
}

function getRiskColor(risk) {
    if (risk === 'High') return { hex: '#f87171', twBg: 'bg-red-500' };
    if (risk === 'Moderate') return { hex: '#fbbf24', twBg: 'bg-amber-500' };
    return { hex: '#34D399', twBg: 'bg-emerald-500' };
}


// --- MAIN COMPONENT ---

export default function SecureCenter() {
  const { isDarkMode } = useTheme();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Fetch data from the Node.js API
        const response = await axios.get(API_URL);
        const rawLogs = response.data; 

        // 2. Process and enrich the data
        const enrichedDevices = rawLogs.map(logEntry => {
            const mappedDevice = mapLogToSecurityDevice(logEntry); 
            const decisions = getSecurityDecisions(mappedDevice);
            return { ...mappedDevice, ...decisions };
        });

        setDevices(enrichedDevices);
      } catch (err) {
        console.error("Error fetching logs:", err);
        // Check if the server is likely down
        if (err.code === 'ERR_NETWORK' || err.response?.status === 500) {
            setError('Could not connect to the backend API. Ensure the Node.js server is running on port 5000.');
        } else {
            setError('Failed to fetch data from the server.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLogData();
  }, []);

  if (loading) {
    return <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-slate-900'}`}>Loading device data...</div>;
  }

  if (error) {
    return <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Fetch Error: </strong>
            <span className="block sm:inline">{error}</span>
            <p className="text-sm mt-2">
                Make sure you have started the **Node.js server** (`node server.js`) and replaced `YOUR_MONGODB_CONNECTION_STRING` in `server.js`.
            </p>
        </div>
    </div>;
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 p-6 ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-slate-900'}`}
    >
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <div className="w-fit">
            <h1
              className="text-4xl font-extrabold mb-2" 
              style={{ 
                background: isDarkMode ? 'linear-gradient(90deg, #10B981, #06B6D4)' : 'linear-gradient(90deg, #059669, #0891b2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'inline-block' 
              }}
            >
              🛡️ Security Control Center
            </h1>
          </div>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Live decisions based on the latest logs fetched from MongoDB via Node.js API.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {devices.map((device, index) => (
            <SecurityDeviceCard key={device.id} device={device} isDarkMode={isDarkMode} index={index} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes subtleGlow { 0% { box-shadow: 0 0 5px rgba(255, 0, 0, 0.0); } 50% { box-shadow: 0 0 15px rgba(255, 60, 60, 0.4); } 100% { box-shadow: 0 0 5px rgba(255, 0, 0, 0.0); } }
        .high-risk-glow { animation: subtleGlow 3s ease-in-out infinite; }
        .card-anim { animation: cardLift 420ms ease both; }
        @keyframes cardLift { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .pulse-dot-red { animation: statusPulse 1.8s infinite; }
        @keyframes statusPulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.18); opacity: 0.6; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

// --- SUB-COMPONENTS (Card, Metric, Pill, DataPoint) ---

const SecurityDeviceCard = ({ device, isDarkMode, index }) => {
    const risk = device.securityRisk;
    const color = getRiskColor(risk);

    const cardStyle = useMemo(() => ({
        animationDelay: `${index * 100}ms`, 
        backdropFilter: isDarkMode ? 'blur(12px)' : 'none',
        boxShadow: isDarkMode 
            ? `0 8px 32px rgba(0,0,0,0.4), 0 0 5px ${risk === 'High' ? color.hex : 'transparent'}` 
            : '0 4px 16px rgba(0,0,0,0.08)',
        border: isDarkMode ? `1px solid ${risk === 'High' ? color.hex : 'rgb(55 65 81)'}` : '1px solid rgb(229 231 235)',
    }), [isDarkMode, risk, color.hex, index]);

    const chartData = [
        { label: 'Anomaly Score', value: device.anomalyScore * 100, color: '#FCD34D' },
        { label: 'Security Level', value: risk === 'High' ? 100 : risk === 'Moderate' ? 65 : 30, color: color.hex },
        { label: 'Battery Health', value: device.battery, color: '#06B6D4' },
    ];
    
    return (
        <div
            className={`rounded-xl p-6 card-anim transition-all duration-300 hover:-translate-y-1 ${
                isDarkMode ? 'bg-gray-900/90' : 'bg-white'
            } ${risk === 'High' ? 'high-risk-glow' : ''}`}
            style={cardStyle}
        >
            <div className="flex items-start justify-between mb-6 border-b pb-4" style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                        <Shield className={`w-6 h-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    </div>
                    <div>
                        <div className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{device.id}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{device.type}</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Policy</div>
                    <div className={`inline-flex items-center gap-2 py-1 px-3 rounded-full text-sm font-bold`} style={{ backgroundColor: color.twBg.replace('bg-', 'bg-').replace('-500', '-50'), color: color.hex }}>
                        <span className={`w-2 h-2 rounded-full pulse-dot-red`} style={{ background: color.hex }} />
                        {device.decisionPolicy}
                    </div>
                </div>
            </div>

            <h3 className={`text-base font-semibold mb-4 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                Core Metrics
            </h3>
            
            <div className="grid grid-cols-3 gap-2 mb-6">
                {chartData.map(item => (<TradeOffMetric key={item.label} data={item} isDarkMode={isDarkMode} />))}
            </div>

            <h3 className={`text-base font-semibold mb-4 border-t pt-4 ${isDarkMode ? 'text-yellow-300 border-gray-700' : 'text-yellow-700 border-gray-200'}`}>
                Adaptation Decisions
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
                <DecisionPill icon={Lock} label="Encryption" value={device.encryptionLevel} isDarkMode={isDarkMode} />
                <DecisionPill icon={Clock} label="Frequency" value={device.transmissionFrequency} isDarkMode={isDarkMode} />
                <DecisionPill icon={Zap} label="Risk" value={risk} isDarkMode={isDarkMode} />
            </div>

            <h3 className={`text-base font-semibold mb-4 border-t pt-4 ${isDarkMode ? 'text-indigo-300 border-gray-700' : 'text-indigo-700 border-gray-200'}`}>
                Resource Status
            </h3>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                <DataPoint icon={Battery} label="Current Battery" value={`${device.battery}%`} isDarkMode={isDarkMode} />
                <DataPoint icon={AlertTriangle} label="24h Battery Drop" value={device.dropSpeed} isDarkMode={isDarkMode} highlight={parseFloat(device.dropSpeed) > 1} />
                <DataPoint icon={Clock} label="Uptime" value={device.uptime} isDarkMode={isDarkMode} />
                <DataPoint icon={Wifi} label="RSSI (dBm)" value={device.rssi} isDarkMode={isDarkMode} />
            </div>
        </div>
    );
};

const TradeOffMetric = ({ data, isDarkMode }) => {
    const glowColor = data.color === '#f87171' ? 'rgba(255, 0, 0, 0.5)' : data.color;

    return (
        <div className={`text-center p-3 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <div className="relative w-full aspect-square mx-auto mb-2">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                        strokeWidth="3.5"
                    />
                    <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
                        fill="none"
                        stroke={data.color}
                        strokeWidth="3.5"
                        strokeDasharray={`${data.value} ${100 - data.value}`}
                        strokeLinecap="round"
                        style={{ 
                            transition: 'stroke-dasharray 650ms ease, filter 300ms',
                            filter: `drop-shadow(0 0 4px ${glowColor})`,
                        }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {Math.round(data.value)}
                        <span className="text-xs font-normal align-top">%</span>
                    </div>
                </div>
            </div>
            <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{data.label}</div>
        </div>
    );
};

const DecisionPill = ({ icon: Icon, label, value, isDarkMode }) => (
    <div className={`p-3 rounded-lg flex flex-col items-center justify-center transition-colors ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-100'}`}>
        <Icon className={`w-5 h-5 mb-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
        <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{label}</div>
        <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</div>
    </div>
);

const DataPoint = ({ icon: Icon, label, value, isDarkMode, highlight = false }) => (
    <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
            <span className="font-light">{label}:</span>
        </div>
        <div className={`font-semibold ${isDarkMode ? (highlight ? 'text-red-400' : 'text-white') : (highlight ? 'text-red-600' : 'text-gray-900')}`}>
            {value}
        </div>
    </div>
);