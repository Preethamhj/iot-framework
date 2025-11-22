import React, { useMemo, useState, useEffect } from 'react';
import axios from "axios";
import { Shield, Lock, Zap, Clock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// -------------------------------------------------------
// DECISION ENGINE
// -------------------------------------------------------
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
        securityRisk:
            anomalyScore > 0.7 ? "High" :
            anomalyScore > 0.4 ? "Moderate" : "Low",
        batteryTrend,
        dropSpeed: `${dropSpeed.toFixed(1)}% / 24h`
    };
}

function getRiskColor(risk) {
    if (risk === "High") return { hex: "#f87171", twBg: "bg-red-500" };
    if (risk === "Moderate") return { hex: "#fbbf24", twBg: "bg-amber-500" };
    return { hex: "#34D399", twBg: "bg-emerald-500" };
}

// -------------------------------------------------------
// MAIN COMPONENT
// -------------------------------------------------------
export default function SecureCenter() {
    const { isDarkMode } = useTheme();
    const [devices, setDevices] = useState([]);

    // Fetch Data From Backend
    useEffect(() => {
        async function loadSecurity() {
            try {
                const res = await axios.get("http://localhost:3000/dashboard/security");

                const enriched = res.data.devices.map(d => ({
                    ...d,
                    ...getSecurityDecisions(d)
                }));

                setDevices(enriched);
            } catch (err) {
                console.error("Error loading security dashboard:", err);
            }
        }

        loadSecurity();
    }, []);

    return (
        <div
            className={`min-h-screen transition-colors duration-300 p-6 ${
                isDarkMode ? "bg-gray-950 text-white" : "bg-gray-50 text-slate-900"
            }`}
        >
            <div className="max-w-7xl mx-auto">
                <header className="mb-10">
                    <div className="w-fit">
                        <h1
                            className="text-4xl font-extrabold mb-2"
                            style={{
                                background: isDarkMode
                                    ? "linear-gradient(90deg, #10B981, #06B6D4)"
                                    : "linear-gradient(90deg, #059669, #0891b2)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent"
                            }}
                        >
                            🛡️ Security Control Center
                        </h1>
                    </div>
                    <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Real-Time Security • Energy Optimization • Anomaly Defense
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    {devices.map((device, i) => (
                        <SecurityDeviceCard
                            key={device.id}
                            device={device}
                            isDarkMode={isDarkMode}
                            index={i}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

// -------------------------------------------------------
// DEVICE CARD COMPONENT
// -------------------------------------------------------
const SecurityDeviceCard = ({ device, isDarkMode, index }) => {
    const risk = device.securityRisk;
    const color = getRiskColor(risk);

    const cardStyle = useMemo(
        () => ({
            animationDelay: `${index * 100}ms`,
            border: isDarkMode
                ? `1px solid ${risk === "High" ? color.hex : "rgb(55,65,81)"}`
                : "1px solid rgb(229,231,235)"
        }),
        [isDarkMode, risk, color.hex, index]
    );

    const chartData = [
        {
            label: "Security",
            value: risk === "High" ? 100 : risk === "Moderate" ? 65 : 30,
            color: color.hex
        },
        {
            label: "Battery Cost",
            value: Math.max(0, 100 - device.battery),
            color: "#06B6D4"
        },
        {
            label: "Anomaly",
            value: device.anomalyScore * 100,
            color: "#FCD34D"
        }
    ];

    return (
        <div
            className={`rounded-xl p-6 card-anim transition-all ${
                isDarkMode ? "bg-gray-900/90" : "bg-white"
            } ${risk === "High" ? "high-risk-glow" : ""}`}
            style={cardStyle}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-6 border-b pb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${isDarkMode ? "bg-indigo-500/10" : "bg-indigo-50"}`}>
                        <Shield className={`w-6 h-6 ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`} />
                    </div>
                    <div>
                        <div className="text-xl font-semibold">{device.id}</div>
                        <div className="text-xs opacity-70">{device.type}</div>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-xs opacity-70 mb-1">Risk Level</div>
                    <div
                        className="inline-flex items-center gap-2 py-1 px-3 rounded-full text-sm font-bold"
                        style={{ color: color.hex }}
                    >
                        <span
                            className="w-2 h-2 rounded-full pulse-dot-red"
                            style={{ background: color.hex }}
                        />
                        {risk}
                    </div>
                </div>
            </div>

            {/* Chart */}
            <h3 className="text-base font-semibold mb-4">Trade-off Engine Metrics</h3>
            <div className="grid grid-cols-3 gap-2 mb-6">
                {chartData.map(item => (
                    <TradeOffMetric key={item.label} data={item} isDarkMode={isDarkMode} />
                ))}
            </div>

            {/* Decisions */}
            <h3 className="text-base font-semibold mb-4 border-t pt-4">Decision Outputs</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
                <DecisionPill icon={Lock} label="Encryption" value={device.encryptionLevel} />
                <DecisionPill icon={Clock} label="Frequency" value={device.transmissionFrequency} />
                <DecisionPill icon={Zap} label="Interval" value={device.updateInterval} />
            </div>
        </div>
    );
};

// -------------------------------------------------------
// SMALL COMPONENTS
// -------------------------------------------------------
const TradeOffMetric = ({ data }) => (
    <div className="text-center p-3 rounded-lg bg-gray-800/40">
        <div className="relative w-full aspect-square mx-auto mb-2">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="3.5"
                />
                <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
                    fill="none"
                    stroke={data.color}
                    strokeWidth="3.5"
                    strokeDasharray={`${data.value} ${100 - data.value}`}
                    strokeLinecap="round"
                />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-lg font-bold">
                    {Math.round(data.value)}
                    <span className="text-xs font-normal">%</span>
                </div>
            </div>
        </div>
        <div className="text-xs opacity-70">{data.label}</div>
    </div>
);

const DecisionPill = ({ icon: Icon, label, value }) => (
    <div className="p-3 rounded-lg flex flex-col items-center bg-gray-800/40">
        <Icon className="w-5 h-5 mb-1 text-emerald-400" />
        <div className="text-xs opacity-70">{label}</div>
        <div className="text-sm font-bold">{value}</div>
    </div>
);
