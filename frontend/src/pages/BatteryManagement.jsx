import React, { useMemo, useState, useEffect } from 'react';
import { Cpu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext'; // Corrected path as discussed earlier

const devicesMock = [
  {
    id: 'ESP32-A1',
    type: 'ESP32',
    batteryRemaining: 87,
    batteryUsed: 13,
    payloadsSentPerHour: 12,
    avgConsumePerPayload: 0.8,
    uptime: '12d 04:23'
  },
  {
    id: 'RPI-B4',
    type: 'Raspberry Pi',
    batteryRemaining: 42,
    batteryUsed: 58,
    payloadsSentPerHour: 150,
    avgConsumePerPayload: 1.2,
    uptime: '03d 11:15'
  },
  {
    id: 'US-SENS-01',
    type: 'Ultrasonic',
    batteryRemaining: 96,
    batteryUsed: 4,
    payloadsSentPerHour: 60,
    avgConsumePerPayload: 0.05,
    uptime: '25d 09:45'
  }
];

function predictBattery(currentBattery, payloadsPerHour, avgConsumePerPayload, hoursAhead = 24) {
  const raw = currentBattery - (payloadsPerHour * avgConsumePerPayload * hoursAhead);
  const noise = (Math.random() - 0.45) * 2;
  const pred = Math.max(0, Math.min(100, Math.round((raw + noise) * 10) / 10));
  return pred;
}

function batteryMode(batteryPercent) {
  if (batteryPercent <= 20) return { label: 'Low', hex: '#ef4444', tailwindBg: 'bg-red-500' };
  if (batteryPercent <= 50) return { label: 'Moderate', hex: '#f59e0b', tailwindBg: 'bg-amber-500' };
  return { label: 'High', hex: '#34D399', tailwindBg: 'bg-emerald-500' };
}

export default function BatteryManagement() {
  const { isDarkMode } = useTheme(); // No need for toggleTheme if button is removed
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const enriched = devicesMock.map(d => {
      const predicted = predictBattery(d.batteryRemaining, d.payloadsSentPerHour, d.avgConsumePerPayload, 24);
      return { ...d, predictedBattery: predicted, consumedPerPayload: d.avgConsumePerPayload };
    });
    setDevices(enriched);
  }, []);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-slate-900'}`}
    >
      {/* The theme toggle button div has been removed from here */}

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
              Battery Dashboard
            </h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Battery predictions, consumption per payload, uptime & modes
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {devices.map(device => (
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
        .card-anim { animation: cardLift 420ms ease both; }
        .pulse-dot { animation: statusPulse 1.8s infinite; }
        .gradient-fill {
          background: linear-gradient(90deg, #10B981 0%, #34D399 60%, #06B6D4 100%);
          background-size: 200% 100%;
          animation: gradientMove 3.6s linear infinite;
        }
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}

const DeviceCard = ({ device, isDarkMode }) => {
  const mode = batteryMode(device.batteryRemaining);

  const sparkData = useMemo(() => {
    const arr = [];
    let val = device.batteryRemaining;
    for (let i = 0; i < 8; i++) {
      const delta = (Math.random() * 1.2) * (i / 8);
      val = Math.min(100, Math.max(0, val + delta));
      arr.unshift(Math.round(val * 10) / 10);
    }
    return arr;
  }, [device.batteryRemaining]);

  const strokeColor = mode.hex;

  return (
    <div
      className={`rounded-xl p-6 card-anim transition-all duration-300 hover:-translate-y-1 ${
        isDarkMode
          ? 'bg-gray-900/90 border border-gray-800'
          : 'bg-white border border-gray-200'
      }`}
      style={{
        backdropFilter: isDarkMode ? 'blur(12px)' : 'none',
        boxShadow: isDarkMode
          ? '0 8px 32px rgba(0,0,0,0.4)'
          : '0 4px 16px rgba(0,0,0,0.08)'
      }}
    >
      {/* header row */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-lg ${isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}
          >
            <Cpu className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
          </div>

          <div>
            <div className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {device.id}
            </div>
            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {device.type}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Mode
          </div>
          <div
            className={`inline-flex items-center gap-2 py-1 px-3 rounded-full text-sm font-semibold ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: mode.hex }} />
            <span style={{ color: mode.hex }}>{mode.label}</span>
          </div>
        </div>
      </div>

      {/* main body: battery ring and stats */}
      <div className="flex items-center justify-between gap-6 mb-6">
        {/* left: ring with percentage */}
        <div className="relative w-32 h-32 flex-shrink-0">
          {/* background ring */}
          <svg viewBox="0 0 36 36" className="w-32 h-32 transform -rotate-90">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
              fill="none"
              stroke={strokeColor}
              strokeWidth="3"
              strokeDasharray={`${device.batteryRemaining} ${100 - device.batteryRemaining}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 650ms ease' }}
            />
          </svg>

          {/* center percentage */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {device.batteryRemaining}%
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Remaining
              </div>
            </div>
          </div>
        </div>

        {/* right: stats grid */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div>
            <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Predicted (24h)
            </div>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {device.predictedBattery}%
            </div>
          </div>

          <div>
            <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Battery Used
            </div>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {device.batteryUsed}%
            </div>
          </div>

          <div>
            <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Per Payload
            </div>
            <div className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {device.consumedPerPayload}%
            </div>
          </div>

          <div>
            <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Uptime
            </div>
            <div className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {device.uptime}
            </div>
          </div>
        </div>
      </div>

      {/* progress bar */}
      <div className="mb-6">
        <div className={`w-full h-2 rounded-full overflow-hidden ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
        }`}>
          <div
            className="h-2 rounded-full gradient-fill"
            style={{
              width: `${device.batteryRemaining}%`,
              transition: 'width 900ms cubic-bezier(.2,.9,.2,1)'
            }}
          />
        </div>
      </div>

      {/* sparkline + meta */}
      <div className="flex items-center gap-4 pt-4 border-t" style={{
        borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }}>
        <Sparkline values={sparkData} stroke={strokeColor} isDarkMode={isDarkMode} />
        <div className={`flex-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <div>
            <span className="font-semibold">Payloads/hr:</span> {device.payloadsSentPerHour}
          </div>
          <div className="mt-1">
            <span className="font-semibold">Avg/payload:</span> {device.avgConsumePerPayload}%
          </div>
        </div>
      </div>
    </div>
  );
};

const Sparkline = ({ values = [], stroke = '#34D399', isDarkMode = true }) => {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 100 - ((v - min) / (max - min || 1)) * 100;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg className="w-24 h-10" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: isDarkMode ? 0.9 : 1 }}
      />
    </svg>
  );
};