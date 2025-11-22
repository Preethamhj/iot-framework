import React, { useEffect, useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, CartesianGrid, RadialBarChart, RadialBar
} from 'recharts';
import {
  Cpu, Shield, TrendingUp, Thermometer, Droplets, Ruler, X, Battery
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/* ------------------- DATA MAPPING HELPER FUNCTIONS ------------------- */

// Function to safely extract a BSON-like number ($numberDouble, $numberInt)
const extractNumber = (field) => {
  if (typeof field === 'number') return field;
  if (typeof field === 'object' && field !== null) {
    if (field.$numberDouble !== undefined) return parseFloat(field.$numberDouble);
    if (field.$numberInt !== undefined) return parseInt(field.$numberInt, 10);
  }
  return 0; // Default or error value
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

// Log entry example based on your provided data
const sampleLogEntry = {
  "_id": { "$oid": "6920eb92d72497daa7f018fd" },
  "digitalTwin": { "deviceId": "ESP32-DEVKIT-001", "deviceType": "IoT Sensor Node", "hardwareSpecs": "ESP32-WROOM-32, 4MB flash, 320KB RAM", "firmware": "v1.0.0", "sensors": "DHT22, HC-SR04, LDR", "lastOTA": "1970-01-01T00:00:00Z" },
  "telemetry": { "temperature": { "$numberDouble": "22.95" }, "humidity": { "$numberInt": "81" }, "distance": { "$numberDouble": "30.287" }, "light": { "$numberInt": "0" }, "batteryPercentage": { "$numberDouble": "80.45" }, "uptimeSeconds": { "$numberInt": "10" }, "lastContactTime": "1970-01-01T00:00:10Z" },
  "battery": { "connectCount": { "$numberInt": "8" }, "sendCount": { "$numberInt": "872" }, "sendIntervalSec": { "$numberInt": "5" }, "firmwareUpdateCount": { "$numberInt": "0" }, "payloadSizeBytes": { "$numberInt": "801" }, "batteryConsumedThisPayload": { "$numberInt": "0" }, "failedTransmissions": { "$numberInt": "0" }, "retryCount": { "$numberInt": "0" }, "wifiRSSI": { "$numberInt": "0" } },
  "behaviour": { "resetCount": { "$numberInt": "0" }, "connectionPattern": "bluetooth" },
  "anomaly": { "sensorJump": false, "batterySpike": false, "tampering": false },
  "security": { "currentBattery": { "$numberDouble": "80.45" }, "isAnomalyDetected": false },
  "cerberus_analysis": { "decision": "BALANCED", "reasoning": "Trigger: System Nominal", "metrics": { "anomaly_score": { "$numberInt": "1" }, "battery_prediction_hours": { "$numberInt": "16090" } }, "processed_at": "2025-11-22T04:15:37.848624" },
  "receivedAt": { "$date": { "$numberLong": "1763765138394" } }
};

// Function to map the DB log entry to the React Device Schema
function mapLogToDevice(logEntry) {
  const temp = extractNumber(logEntry.telemetry.temperature);
  const humidity = extractNumber(logEntry.telemetry.humidity);
  const distance = extractNumber(logEntry.telemetry.distance);
  const batteryPct = extractNumber(logEntry.telemetry.batteryPercentage);
  const uptimeSec = extractNumber(logEntry.telemetry.uptimeSeconds);
  const anomalyScore = extractNumber(logEntry.cerberus_analysis?.metrics?.anomaly_score);

  // Derive status: 'warning' if any anomaly detected or decision is not BALANCED
  const decision = logEntry.cerberus_analysis?.decision || 'BALANCED';
  const isAnomaly = logEntry.anomaly?.sensorJump || logEntry.anomaly?.batterySpike || logEntry.anomaly?.tampering || logEntry.security?.isAnomalyDetected || anomalyScore > 5; // Assuming score > 5 is an anomaly threshold

  const status = isAnomaly || decision.toUpperCase() !== 'BALANCED'
    ? 'warning'
    : 'active';

  // Calculate Health (e.g., 100 - (Anomaly Score * Scaling Factor))
  const healthScore = Math.max(0, 100 - Math.min(10, anomalyScore) * 5); // Simple inverse relationship

  return {
    id: logEntry.digitalTwin.deviceId,
    type: logEntry.digitalTwin.deviceType,
    status: status,
    firmwareVersion: logEntry.digitalTwin.firmware,
    sensors: logEntry.digitalTwin.sensors ? logEntry.digitalTwin.sensors.split(',').map(s => s.trim()) : [],
    capabilities: logEntry.digitalTwin.hardwareSpecs.split(',').map(s => s.trim()), // Using specs as capabilities for display
    telemetry: {
      temperature: parseFloat(temp.toFixed(1)),
      humidity: Math.round(humidity),
      distance: parseFloat(distance.toFixed(1)),
      batteryRemaining: Math.round(batteryPct),
      batteryUsed: 100 - Math.round(batteryPct),
      uptime: formatUptime(uptimeSec),
      lastContact: 'now', // Placeholder: You'd calculate relative time ('2s ago') here
    },
    gateway: {
      mode: decision.charAt(0).toUpperCase() + decision.slice(1).toLowerCase(), // e.g., 'BALANCED' -> 'Balanced'
      securityLevel: decision.toUpperCase() === 'SECURITY PRIORITY' ? 'High' : (decision.toUpperCase() === 'BALANCED' ? 'Medium' : 'Low'),
      transmissionFreq: `${extractNumber(logEntry.battery.sendIntervalSec)}s`,
      lastOTA: logEntry.digitalTwin.lastOTA?.split('T')[0] || 'N/A',
    },
    healthScore: Math.round(healthScore),
    anomalyScore: anomalyScore,
  };
}

/* ------------------- INITIAL STATE SETUP ------------------- */

const initialDevices = [
  mapLogToDevice(sampleLogEntry), // Map the first device from the DB log
  // Keep the original second device structure for comparison, or map another log
  {
    id: 'LORA-C3',
    type: 'LoRa Node',
    status: 'warning',
    firmwareVersion: 'v1.9.8',
    sensors: ['BME280', 'LDR'],
    capabilities: ['LoRaWAN', 'Low Power', 'Remote Wake'],
    telemetry: { temperature: 67.2, humidity: 45, distance: 0, batteryRemaining: 56, batteryUsed: 44, uptime: '8d 12h', lastContact: '1s ago' },
    gateway: { mode: 'Security Priority', securityLevel: 'High', transmissionFreq: '5s', lastOTA: '2024-01-10' },
    healthScore: 56,
    anomalyScore: 8,
  }
];


export default function Digitaltwinmonitor() {
  const { isDarkMode } = useTheme();
  const [devices, setDevices] = useState(initialDevices);
  const [selectedDevice, setSelectedDevice] = useState(initialDevices[0]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!selectedDevice && devices.length) setSelectedDevice(devices[0]);
  }, [devices, selectedDevice]);

  // Telemetry series generation (uses selectedDevice's current temp/humidity as baseline)
  const series = useMemo(() => {
    const s = [];
    for (let i = 0; i < 24; i++) {
      s.push({
        time: `${i}:00`,
        temperature: (selectedDevice?.telemetry?.temperature ?? 30) + Math.sin(i / 3) * 2 + (Math.random() - 0.5),
        humidity: (selectedDevice?.telemetry?.humidity ?? 60) + Math.cos(i / 4) * 4 + (Math.random() - 0.5)
      });
    }
    return s;
  }, [selectedDevice]);

  const getStatusColor = (status) => status === 'active' ? 'rgba(52,211,153,0.95)' : 'rgba(250,204,21,0.95)';

  function handleAddDevice(device) {
    setDevices(prev => [...prev, device]);
    setSelectedDevice(device);
    setDrawerOpen(false);
  }

  const selectedHealthScore = selectedDevice?.healthScore ?? 92;
  const healthColor = selectedHealthScore > 75 ? '#34D399' : selectedHealthScore > 50 ? '#FBBF24' : '#F87171';
  const anomalyText = selectedDevice?.anomalyScore > 0 ? `Anomaly Score: ${selectedDevice?.anomalyScore}` : 'System Nominal';
  const anomalyTextColor = selectedDevice?.anomalyScore > 0 ? '#F87171' : '#34D399';

  return (
    <div
      className={isDarkMode ? 'text-white' : 'text-slate-900'}
      style={{
        minHeight: '100vh',
        padding: 28,
        boxSizing: 'border-box',
        background: isDarkMode
          ? 'linear-gradient(180deg, rgba(10,12,18,0.98), rgba(8,10,14,0.95))'
          : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,247,250,0.98))'
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative' }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h1 style={{
              fontSize: 28,
              fontWeight: 800,
              background: isDarkMode ? 'linear-gradient(90deg,#9AE6B4,#67E8F9)' : 'linear-gradient(90deg,#059669,#06b6d4)',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              margin: 0
            }}>Digital Twin Monitor</h1>
            <p style={{ margin: 0, marginTop: 6, color: isDarkMode ? 'rgba(255,255,255,0.78)' : 'rgba(30,41,59,0.7)' }}>Virtual device profiling & real-time telemetry</p>
          </div>

          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={() => setDrawerOpen(true)}
              className={`px-4 py-2 rounded-lg border font-semibold transition-all ${isDarkMode ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30' : 'bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-600'}`}
            >
              + Add Device
            </button>
          </div>
        </div>

        {/* Device selector */}
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, marginBottom: 20 }}>
          {devices.map(d => {
            const selected = selectedDevice?.id === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDevice(d)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 18px',
                  borderRadius: 999,
                  border: selected ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  background: selected
                    ? 'linear-gradient(90deg, rgba(52,211,153,0.15), rgba(14,165,233,0.08))'
                    : isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(6px)',
                  color: isDarkMode ? '#fff' : '#09203f',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  width: 12, height: 12, borderRadius: 999,
                  background: getStatusColor(d.status)
                }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700 }}>{d.id}</div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>{d.type}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Grid cards */}
        <style>{`@media(min-width:1100px){ .dt-grid{grid-template-columns:1fr 1fr 1fr;} }`}</style>
        <div className="dt-grid" style={{ display: 'grid', gap: 20 }}>
          {/* Device Identity Card */}
          <div style={glassCardStyle(isDarkMode)}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <div style={glassIconStyle(isDarkMode)}><Cpu /></div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Device Identity</h3>
                <div style={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(30,41,59,0.6)', fontSize: 13 }}>Overview & metadata</div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              <InfoRow label="Device ID" value={selectedDevice?.id} isDark={isDarkMode} />
              <InfoRow label="Type" value={selectedDevice?.type} isDark={isDarkMode} />
              <InfoRow label="Firmware" value={selectedDevice?.firmwareVersion} isDark={isDarkMode} />
              <InfoRow label="Status" value={selectedDevice?.status} accent={getStatusColor(selectedDevice?.status)} isDark={isDarkMode} />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <SmallChip isDark={isDarkMode} label="Sensors" text={(selectedDevice?.sensors || []).join(', ')} />
              <SmallChip isDark={isDarkMode} label="Mode" text={selectedDevice?.gateway?.mode} />
            </div>
          </div>

          {/* Live Telemetry Card */}
          <div style={glassCardStyle(isDarkMode)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={glassIconStyle(isDarkMode)}><TrendingUp /></div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Live Telemetry</h3>
                  <div style={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(30,41,59,0.6)', fontSize: 13 }}>Real-time metrics</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 10, height: 10, borderRadius: 6, background: '#34D399', animation: 'pulse 2s infinite' }} />
                <div style={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(30,41,59,0.6)', fontSize: 13 }}>{selectedDevice?.telemetry?.lastContact}</div>
              </div>
            </div>

            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <defs>
                    <linearGradient id="humGrad" x1="0" y1="0" x2="0" x2="1">
                      <stop offset="0%" stopColor={isDarkMode ? '#7DD3FC' : '#0284c7'} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={isDarkMode ? '#7DD3FC' : '#0284c7'} stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={isDarkMode ? 'rgba(255,255,255,0.03)' : '#f1f5f9'} />
                  <XAxis dataKey="time" tick={{ fill: isDarkMode ? 'rgba(255,255,255,0.6)' : '#475569', fontSize: 11 }} />
                  <YAxis tick={{ fill: isDarkMode ? 'rgba(255,255,255,0.6)' : '#475569', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: isDarkMode ? '#0b1220' : '#fff', border: 'none', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="temperature" stroke={isDarkMode ? '#FB7185' : '#ef4444'} strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
                  <Area type="monotone" dataKey="humidity" stroke="transparent" fill="url(#humGrad)" fillOpacity={1} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
              <MetricCard isDark={isDarkMode} label="Temp" value={`${selectedDevice?.telemetry?.temperature}°C`} icon={<Thermometer />} />
              <MetricCard isDark={isDarkMode} label="Humidity" value={`${selectedDevice?.telemetry?.humidity}%`} icon={<Droplets />} />
              <MetricCard isDark={isDarkMode} label="Distance" value={`${selectedDevice?.telemetry?.distance} cm`} icon={<Ruler />} />
              <MetricCard isDark={isDarkMode} label="Battery" value={`${selectedDevice?.telemetry?.batteryRemaining}%`} icon={<Battery />} />
            </div>
          </div>

          {/* Gateway Policy Card */}
          <div style={glassCardStyle(isDarkMode)}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <div style={glassIconStyle(isDarkMode)}><Shield /></div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Gateway Policy</h3>
                <div style={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(30,41,59,0.6)', fontSize: 13 }}>{selectedDevice?.gateway?.mode}</div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <InfoRow label="Security Level" value={selectedDevice?.gateway?.securityLevel} isDark={isDarkMode} />
              <InfoRow label="Frequency" value={selectedDevice?.gateway?.transmissionFreq} valueRight isDark={isDarkMode} />
              <InfoRow label="Last OTA" value={selectedDevice?.gateway?.lastOTA} valueRight isDark={isDarkMode} />
            </div>

            {/* Health/Anomaly Radial Chart (using the new healthScore) */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 180, height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" data={[{ name: 'health', value: selectedHealthScore, fill: healthColor }]} startAngle={90} endAngle={-270}>
                    <RadialBar minAngle={15} background clockWise dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ textAlign: 'center', marginTop: 4 }}>
                <div style={{ fontWeight: 800, color: healthColor, fontSize: 20 }}>{selectedHealthScore}%</div>
                <div style={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(30,41,59,0.6)', fontSize: 13 }}>Device Health</div>
                <div style={{ fontWeight: 600, color: anomalyTextColor, fontSize: 14, marginTop: 4 }}>{anomalyText}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer Overlay */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 999,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease'
          }}
        />
      )}

      {/* Drawer Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: isMobile ? '100%' : 420,
          maxWidth: '100%',
          background: isDarkMode
            ? 'linear-gradient(180deg, #0f1419, #0a0d12)'
            : 'linear-gradient(180deg, #ffffff, #f8fafc)',
          boxShadow: '-10px 0 40px rgba(0,0,0,0.5)',
          zIndex: 1000,
          transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-in-out',
          overflowY: 'auto',
          padding: 24,
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Add New Device</h2>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
              background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <AddDeviceForm onAdd={(d) => handleAddDevice({...d, healthScore: 100, anomalyScore: 0})} onCancel={() => setDrawerOpen(false)} isDark={isDarkMode} />
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

/* -------- AddDeviceForm (Unmodified) -------- */
function AddDeviceForm({ onAdd, onCancel, isDark }) {
  const [form, setForm] = useState({
    id: '',
    type: '',
    firmwareVersion: 'v1.0.0',
    sensors: '',
    capabilities: '',
    batteryRemaining: 100,
    batteryUsed: 0,
    uptime: '0d 0h',
    gatewayMode: 'Balanced',
    gatewaySecurity: 'Medium',
    gatewayFreq: '10s'
  });

  const change = key => e => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.id || !form.type) return alert('Enter device id and type');

    const newDevice = {
      id: form.id,
      type: form.type,
      status: 'active',
      firmwareVersion: form.firmwareVersion,
      sensors: form.sensors ? form.sensors.split(',').map(s => s.trim()) : [],
      capabilities: form.capabilities ? form.capabilities.split(',').map(s => s.trim()) : [],
      telemetry: {
        temperature: 23 + Math.round(Math.random() * 10),
        humidity: 40 + Math.round(Math.random() * 20),
        distance: 0,
        batteryRemaining: Number(form.batteryRemaining),
        batteryUsed: Number(form.batteryUsed),
        uptime: form.uptime,
        lastContact: 'now'
      },
      gateway: {
        mode: form.gatewayMode,
        securityLevel: form.gatewaySecurity,
        transmissionFreq: form.gatewayFreq,
        lastOTA: new Date().toISOString().split('T')[0]
      }
    };

    onAdd(newDevice);
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 8,
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    color: isDark ? '#fff' : '#000',
    fontSize: 14,
    transition: 'all 0.2s',
    boxSizing: 'border-box'
  };

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
      <div>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>Device ID *</label>
        <input value={form.id} onChange={change('id')} placeholder="e.g. ESP32-A2" style={inputStyle} required />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>Device Type *</label>
        <input value={form.type} onChange={change('type')} placeholder="e.g. ESP32" style={inputStyle} required />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>Firmware Version</label>
        <input value={form.firmwareVersion} onChange={change('firmwareVersion')} style={inputStyle} />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>Sensors (comma separated)</label>
        <input value={form.sensors} onChange={change('sensors')} placeholder="DHT22, Ultrasonic" style={inputStyle} />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>Capabilities (comma separated)</label>
        <input value={form.capabilities} onChange={change('capabilities')} placeholder="WiFi, Bluetooth" style={inputStyle} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>Battery Remaining %</label>
          <input value={form.batteryRemaining} onChange={change('batteryRemaining')} type="number" min="0" max="100" style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>Battery Used %</label>
          <input value={form.batteryUsed} onChange={change('batteryUsed')} type="number" min="0" max="100" style={inputStyle} />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>Uptime</label>
        <input value={form.uptime} onChange={change('uptime')} placeholder="0d 0h" style={inputStyle} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>Gateway Mode</label>
          <select value={form.gatewayMode} onChange={change('gatewayMode')} style={inputStyle}>
            <option>Balanced</option>
            <option>Battery Saving</option>
            <option>Security Priority</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>Security Level</label>
          <select value={form.gatewaySecurity} onChange={change('gatewaySecurity')} style={inputStyle}>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>Transmission Frequency</label>
        <input value={form.gatewayFreq} onChange={change('gatewayFreq')} placeholder="10s" style={inputStyle} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button
          type="submit"
          style={{
            flex: 1,
            padding: '12px 24px',
            borderRadius: 8,
            border: 'none',
            background: '#10b981',
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Add Device
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '12px 24px',
            borderRadius: 8,
            border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.2)',
            background: 'transparent',
            color: isDark ? '#fff' : '#000',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ---------- Helpers (Unmodified) ---------- */

function glassCardStyle(isDark) {
  return {
    borderRadius: 14,
    padding: 20,
    background: isDark ? 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))' : 'rgba(255,255,255,0.95)',
    border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
    boxShadow: isDark ? '0 20px 50px rgba(2,6,23,0.7)' : '0 8px 24px rgba(2,6,23,0.08)',
    backdropFilter: 'blur(10px) saturate(130%)',
    transition: 'transform .25s ease, box-shadow .25s ease'
  };
}

function glassIconStyle(isDark) {
  return {
    width: 44,
    height: 44,
    borderRadius: 10,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isDark ? 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))' : '#f8fafc',
    boxShadow: isDark ? '0 8px 26px rgba(0,0,0,0.5)' : '0 4px 12px rgba(2,6,23,0.08)'
  };
}

const InfoRow = ({ label, value, accent, valueRight, isDark }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
    <div style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', fontSize: 14 }}>{label}</div>
    <div style={{ fontWeight: 700, color: accent || (isDark ? '#fff' : '#000'), textAlign: valueRight ? 'right' : 'left', fontSize: 14 }}>{value}</div>
  </div>
);

const SmallChip = ({ isDark, label, text }) => (
  <div style={{
    padding: '10px 14px',
    borderRadius: 999,
    background: isDark ? 'rgba(255,255,255,0.03)' : '#eef2ff',
    border: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.06)',
    color: isDark ? 'rgba(255,255,255,0.9)' : '#0f172a',
    fontSize: 13,
    display: 'inline-flex',
    gap: 10,
    alignItems: 'center'
  }}>
    <div style={{ fontWeight: 700 }}>{label}</div>
    <div style={{ opacity: 0.95, fontSize: 13 }}>{text}</div>
  </div>
);

const MetricCard = ({ isDark, label, value, icon }) => (
  <div style={{
    minWidth: 120,
    padding: 12,
    borderRadius: 12,
    background: isDark ? 'rgba(255,255,255,0.02)' : '#fff',
    border: isDark ? '1px solid rgba(255,255,255,0.02)' : '1px solid rgba(0,0,0,0.06)',
    display: 'flex',
    gap: 12,
    alignItems: 'center'
  }}>
    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 12, color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(30,41,59,0.7)' }}>{label}</div>
      <div style={{ fontWeight: 800 }}>{value}</div>
    </div>
  </div>
);