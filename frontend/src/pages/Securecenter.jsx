import React, { useMemo, useState, useEffect } from 'react';
import { Shield, Lock, Zap, Clock, Wifi, AlertTriangle } from 'lucide-react';
// Import the theme context hook from the correct relative path
import { useTheme } from '../context/ThemeContext'; 

// --- MOCK DATA AND UTILITY FUNCTIONS ---

const securityDevicesMock = [
  { id: 'Gateway-01', type: 'ESP32', battery: 85, predictedBattery: 78, anomalyScore: 0.1, payloadSize: 256, rssi: -65, uptime: '45d 12h' },
  { id: 'Raspberry Pi38', type: 'Raspberry Pi', battery: 42, predictedBattery: 38, anomalyScore: 0.8, payloadSize: 64, rssi: -102, uptime: '18d 03h' },
  { id: 'US-SENS-01', type: 'Ultrasonic', battery: 99, predictedBattery: 99, anomalyScore: 0.05, payloadSize: 128, rssi: -50, uptime: '02d 08h' },
];

function getSecurityDecisions(device) {
    const { battery, predictedBattery, anomalyScore } = device;
    
    const dropSpeed = battery - predictedBattery;
    const batteryTrend = dropSpeed > 0 ? 'Discharging' : 'Charging';

    let encryptionLevel = 128;
    if (anomalyScore > 0.7) {
        encryptionLevel = 256;
    } else if (battery > 90 || predictedBattery > 85) {
        encryptionLevel = 256;
    }

    let frequencyHz = 60;
    if (anomalyScore > 0.5 || battery < 50) {
        frequencyHz = 30;
    }
    if (battery < 20 || anomalyScore > 0.85) {
        frequencyHz = 10;
    }
    
    const updateIntervalSec = Math.round(1000 / frequencyHz) / 1000; 

    return {
        encryptionLevel: `${encryptionLevel}-bit AES`,
        transmissionFrequency: `${frequencyHz}s`,
        updateInterval: `${updateIntervalSec} sec`,
        securityRisk: anomalyScore > 0.7 ? 'High' : anomalyScore > 0.4 ? 'Moderate' : 'Low',
        batteryTrend: batteryTrend,
        dropSpeed: `${dropSpeed.toFixed(1)}% / 24h`
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

  useEffect(() => {
    const enriched = securityDevicesMock.map(d => {
        const decisions = getSecurityDecisions(d);
        return { ...d, ...decisions };
    });
    setDevices(enriched);
  }, []);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 p-6 ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-slate-900'}`}
    >
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          {/* FIX APPLIED: Wrapped h1 in a div with w-fit to give the gradient text full space */}
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
            Security-Resource Trade-off Model Decisions
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {devices.map((device, index) => (
            <SecurityDeviceCard key={device.id} device={device} isDarkMode={isDarkMode} index={index} />
          ))}
        </div>
      </div>

      <style>{`
        /* Keyframe for a subtle glow effect on high-risk cards */
        @keyframes subtleGlow {
            0% { box-shadow: 0 0 5px rgba(255, 0, 0, 0.0); }
            50% { box-shadow: 0 0 15px rgba(255, 60, 60, 0.4); }
            100% { box-shadow: 0 0 5px rgba(255, 0, 0, 0.0); }
        }
        .high-risk-glow { animation: subtleGlow 3s ease-in-out infinite; }
        .card-anim { animation: cardLift 420ms ease both; }
        @keyframes cardLift {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .pulse-dot-red { animation: statusPulse 1.8s infinite; }
        @keyframes statusPulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.18); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// --- DEVICE CARD COMPONENT ---

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
        { label: 'Security', value: risk === 'High' ? 100 : risk === 'Moderate' ? 65 : 30, color: color.hex },
        { label: 'Battery Cost', value: Math.max(0, 100 - device.battery), color: '#06B6D4' }, 
        { label: 'Anomaly', value: device.anomalyScore * 100, color: '#FCD34D' },
    ];
    
    return (
        <div
            className={`rounded-xl p-6 card-anim transition-all duration-300 hover:-translate-y-1 ${
                isDarkMode ? 'bg-gray-900/90' : 'bg-white'
            } ${risk === 'High' ? 'high-risk-glow' : ''}`}
            style={cardStyle}
        >
            {/* Header: Device ID & Security Risk */}
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
                    <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Risk Level</div>
                    <div className={`inline-flex items-center gap-2 py-1 px-3 rounded-full text-sm font-bold`} style={{ backgroundColor: color.twBg.replace('bg-', 'bg-').replace('-500', '-50'), color: color.hex }}>
                        <span className={`w-2 h-2 rounded-full pulse-dot-red`} style={{ background: color.hex }} />
                        {risk}
                    </div>
                </div>
            </div>

            {/* Section: Trade-off Engine Metrics (Chart Area) */}
            <h3 className={`text-base font-semibold mb-4 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                Trade-off Engine Metrics
            </h3>
            
            <div className="grid grid-cols-3 gap-2 mb-6">
                {chartData.map(item => (
                    <TradeOffMetric key={item.label} data={item} isDarkMode={isDarkMode} />
                ))}
            </div>

            {/* Decision Outputs */}
            <h3 className={`text-base font-semibold mb-4 border-t pt-4 ${isDarkMode ? 'text-yellow-300 border-gray-700' : 'text-yellow-700 border-gray-200'}`}>
                Decision Outputs
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
                <DecisionPill icon={Lock} label="Encryption" value={device.encryptionLevel} isDarkMode={isDarkMode} />
                <DecisionPill icon={Clock} label="Frequency" value={device.transmissionFrequency} isDarkMode={isDarkMode} />
                <DecisionPill icon={Zap} label="Interval" value={device.updateInterval} isDarkMode={isDarkMode} />
            </div>

            {/* Removed: ML Inputs Summary and Raw Telemetry sections */}
        </div>
    );
};

// --- SUB-COMPONENTS ---

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