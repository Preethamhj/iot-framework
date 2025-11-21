import React, { useMemo, useState, useEffect } from 'react';
import { Battery, Zap, Cpu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * BatteryDashboard.jsx
 * - Tailwind CSS required
 * - Uses global isDarkMode from ThemeContext (no local toggle)
 * - Background uses uploaded image at /mnt/data/ui purple.jpg
 *
 * NOTE: The "ML prediction" here is simulated with a placeholder function `predictBattery`
 *       Replace with a real model / API call in production.
 */

const devicesMock = [
  {
    id: 'ESP32-A1',
    type: 'ESP32',
    batteryRemaining: 87,
    batteryUsed: 13,
    payloadsSentPerHour: 12,
    avgConsumePerPayload: 0.8, // percent per payload
    uptime: '12d 04:23'
  },
  {
    id: 'LORA-C3',
    type: 'LoRa Node',
    batteryRemaining: 56,
    batteryUsed: 44,
    payloadsSentPerHour: 4,
    avgConsumePerPayload: 1.6,
    uptime: '08d 12:45'
  },
  {
    id: 'STM32-D4',
    type: 'STM32',
    batteryRemaining: 94,
    batteryUsed: 6,
    payloadsSentPerHour: 2,
    avgConsumePerPayload: 0.3,
    uptime: '15d 08:12'
  }
];

// Helper: simulate a model prediction for battery after N hours
function predictBattery(currentBattery, payloadsPerHour, avgConsumePerPayload, hoursAhead = 24) {
  // Simple simulation: predictedRemaining = current - (payloadsPerHour * avgConsumePerPayload * hoursAhead)
  // Add a small noise simulating model uncertainty.
  const raw = currentBattery - (payloadsPerHour * avgConsumePerPayload * hoursAhead);
  const noise = (Math.random() - 0.45) * 2; // -0.9 .. +1.1
  const pred = Math.max(0, Math.min(100, Math.round((raw + noise) * 10) / 10));
  return pred;
}

function batteryMode(batteryPercent) {
  if (batteryPercent <= 20) return { label: 'Low', color: 'bg-red-500', text: 'text-red-400' };
  if (batteryPercent <= 50) return { label: 'Moderate', color: 'bg-amber-500', text: 'text-amber-400' };
  return { label: 'High', color: 'bg-emerald-500', text: 'text-emerald-400' };
}

const BatteryManagement = () => {
  const { isDarkMode } = useTheme();
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    // In real app: fetch your device list & telemetry
    // For now we use the mock data and compute predictions
    const enriched = devicesMock.map(d => {
      const predicted = predictBattery(d.batteryRemaining, d.payloadsSentPerHour, d.avgConsumePerPayload, 24);
      return { ...d, predictedBattery: predicted, consumedPerPayload: d.avgConsumePerPayload };
    });
    setDevices(enriched);
  }, []);

  return (
    <div
      className={`min-h-screen p-6 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
      style={{
        backgroundImage: `url('/mnt/data/ui purple.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* subtle overlay so glass cards show well */}
      <div className={`min-h-screen w-full p-6 ${isDarkMode ? 'bg-black/60' : 'bg-white/60'}`} style={{ backdropFilter: 'blur(6px)' }}>
        <div className="max-w-6xl mx-auto">
          <header className="flex items-center gap-4 mb-6">
            <h1 className="text-3xl font-extrabold bg-clip-text text-transparent" style={{ background: isDarkMode ? 'linear-gradient(90deg,#9AE6B4,#67E8F9)' : 'linear-gradient(90deg,#059669,#06b6d4)' }}>
              Battery Dashboard
            </h1>
            <p className="text-sm text-gray-300/80">Battery predictions, consumption per payload, uptime & modes</p>
          </header>

          {/* Grid of device cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map(device => (
              <DeviceCard key={device.id} device={device} isDarkMode={isDarkMode} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const DeviceCard = ({ device, isDarkMode }) => {
  const mode = batteryMode(device.batteryRemaining);

  // small inline sparkline data (simulate last 8 battery samples)
  const sparkData = useMemo(() => {
    const arr = [];
    let val = device.batteryRemaining;
    for (let i = 0; i < 8; i++) {
      // reverse generate older values
      const delta = (Math.random() * 1.4) * (i / 8);
      val = Math.min(100, Math.max(0, val + delta));
      arr.unshift(Math.round(val * 10) / 10);
    }
    return arr;
  }, [device.batteryRemaining]);

  return (
    <div className={`rounded-2xl p-5 shadow-2xl transition-transform transform hover:-translate-y-2 ${isDarkMode ? 'bg-gradient-to-br from-gray-800/60 via-gray-900/50 to-gray-800/40 border border-white/6' : 'bg-white/90 border border-gray-100'}`} style={{ backdropFilter: 'blur(8px) saturate(120%)' }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-white/3' : 'bg-gray-100'}`}>
            <Cpu className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="text-lg font-semibold">{device.id}</div>
            <div className="text-xs opacity-70">{device.type}</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-300/80">Mode</div>
          <div className={`inline-flex items-center gap-2 py-1 px-3 rounded-full text-sm font-semibold ${mode.color} ${isDarkMode ? 'text-white' : 'text-white'}`}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(0,0,0,0.12)' }} />
            {mode.label}
          </div>
        </div>
      </div>

      {/* battery big stat */}
      <div className="mt-5 flex items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-10">
            {/* ring + inner */}
            <svg viewBox="0 0 36 36" className="w-20 h-10 transform -rotate-90">
              <path d="M18 2.0845
                       a 15.9155 15.9155 0 0 1 0 31.831
                       a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={isDarkMode ? '#1F2937' : '#e6e6e6'}
                    strokeWidth="6"
                    strokeOpacity="0.12" />
              <path d="M18 2.0845
                       a 15.9155 15.9155 0 0 1 0 31.831"
                    fill="none"
                    stroke={mode.color === 'bg-emerald-500' ? '#34D399' : mode.color === 'bg-amber-500' ? '#f59e0b' : '#ef4444'}
                    strokeWidth="6"
                    strokeDasharray={`${device.batteryRemaining} ${100 - device.batteryRemaining}`}
                    strokeLinecap="round" />
            </svg>

            {/* center percentage */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-extrabold">{device.batteryRemaining}%</div>
                <div className="text-xs opacity-70">Remaining</div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-300/80">Predicted (24h)</div>
            <div className="text-lg font-bold">{device.predictedBattery}%</div>

            <div className="mt-3 text-xs text-gray-300/80">Consumed / payload</div>
            <div className="font-medium">{device.consumedPerPayload}%</div>

            <div className="mt-3 text-xs text-gray-300/80">Uptime</div>
            <div className="font-medium">{device.uptime}</div>
          </div>
        </div>

        {/* right column: small details */}
        <div className="ml-auto flex flex-col items-end gap-3">
          <div className="text-sm text-gray-300/80">Battery Used</div>
          <div className="text-lg font-bold">{device.batteryUsed}%</div>

          {/* progress / bar */}
          <div className="w-36 mt-2">
            <div className="w-full h-3 rounded-full bg-white/6 overflow-hidden">
              <div
                className="h-3 rounded-full"
                style={{
                  width: `${device.batteryRemaining}%`,
                  background: mode.color === 'bg-emerald-500' ? 'linear-gradient(90deg,#10B981,#34D399)' : mode.color === 'bg-amber-500' ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f97316)'
                }}
              />
            </div>
            <div className="text-xs mt-1 opacity-70">Remaining</div>
          </div>
        </div>
      </div>

      {/* sparkline + small metadata */}
      <div className="mt-6 flex items-center gap-4">
        <Sparkline values={sparkData} stroke={mode.color === 'bg-emerald-500' ? '#34D399' : mode.color === 'bg-amber-500' ? '#f59e0b' : '#ef4444'} />
        <div className="flex-1 text-sm text-gray-300/80">
          <div><span className="font-semibold">Payloads / hr:</span> {device.payloadsSentPerHour}</div>
          <div className="mt-1"><span className="font-semibold">Avg / payload:</span> {device.avgConsumePerPayload}%</div>
        </div>
      </div>
    </div>
  );
};

const Sparkline = ({ values = [], stroke = '#34D399' }) => {
  // simple small sparkline svg
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 100 - ((v - min) / (max - min || 1)) * 100;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg className="w-28 h-10" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline fill="none" stroke={stroke} strokeWidth="2" points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default BatteryManagement;
