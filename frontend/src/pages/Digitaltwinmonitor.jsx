import React, { useEffect, useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, CartesianGrid, RadialBarChart, RadialBar
} from 'recharts';
import {
  Cpu, Shield, TrendingUp, Thermometer, Droplets, Ruler, X, Box
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Import the smart Sketchfab viewer
import SketchfabViewer from '../components/SketchFabViewer';

const initialDevices = [
  {
    id: 'ESP32-A1',
    type: 'ESP32', // Matches 'ESP32' key in SketchFabViewer
    status: 'active',
    firmwareVersion: 'v2.1.3',
    sensors: ['DHT22', 'Ultrasonic HC-SR04'],
    capabilities: ['WiFi', 'Bluetooth', 'Deep Sleep', 'OTA Updates'],
    telemetry: {
      temperature: 28.4,
      humidity: 65,
      distance: 102.5,
      batteryRemaining: 87,
      batteryUsed: 13,
      uptime: '12d 4h',
      lastContact: '2s ago'
    },
    gateway: { mode: 'Balanced', securityLevel: 'Medium', transmissionFreq: '10s', lastOTA: '2024-01-15' }
  },
  {
    id: 'US-SENS-01',
    type: 'Ultrasonic', // Matches 'Ultrasonic' key in SketchFabViewer
    status: 'active',
    firmwareVersion: 'v1.2.0',
    sensors: ['HC-SR04'],
    capabilities: ['Proximity', 'Obstacle Avoidance', 'Precision Measure'],
    telemetry: { temperature: 26.1, humidity: 40, distance: 15.4, batteryRemaining: 92, batteryUsed: 8, uptime: '3d 2h', lastContact: '500ms ago' },
    gateway: { mode: 'Real-time', securityLevel: 'Low', transmissionFreq: '0.5s', lastOTA: '2024-02-25' }
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
        <style>{`
          @media(min-width:1100px){ 
            .dt-grid { grid-template-columns: 1fr 1fr 1fr; } 
            .span-2 { grid-column: span 2; }
          }
        `}</style>
        <div className="dt-grid" style={{ display: 'grid', gap: 20 }}>
          
          {/* 3D Viewer Card - USING SMART SKETCHFAB VIEWER */}
          <div className="span-2" style={{ ...glassCardStyle(isDarkMode), overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <div style={glassIconStyle(isDarkMode)}><Box size={20} /></div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Live Digital Twin</h3>
                <div style={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(30,41,59,0.6)', fontSize: 13 }}>
                  Interactive 3D View • {selectedDevice?.type}
                </div>
              </div>
            </div>
            
            {/* Container for the viewer */}
            <div style={{ flex: 1, minHeight: 400, background: isDarkMode ? 'rgba(0,0,0,0.2)' : '#f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
              {/* Pass the selected device type (ESP32 or Ultrasonic) to the viewer */}
              <SketchfabViewer deviceType={selectedDevice?.type} />
            </div>
          </div>

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
          <div className="span-2" style={glassCardStyle(isDarkMode)}>
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
                    <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
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
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 180, height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" data={[{ name: 'health', value: 92, fill: '#34D399' }]} startAngle={90} endAngle={-270}>
                    <RadialBar minAngle={15} background clockWise dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 16, height: 10, background: '#34D399', borderRadius: 2 }} />
                <div style={{ color: isDarkMode ? '#34D399' : '#059669', fontWeight: 700 }}>health</div>
              </div>

              <div style={{ textAlign: 'center', marginTop: 4 }}>
                <div style={{ fontWeight: 800, color: isDarkMode ? '#34D399' : '#059669', fontSize: 20 }}>92%</div>
                <div style={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(30,41,59,0.6)', fontSize: 13 }}>Device Health</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer Overlay and Panel */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Add New Device</h2>
          <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDarkMode ? '#fff' : '#000' }}>
            <X />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const newDev = {
            id: fd.get('did'),
            type: fd.get('type'),
            status: 'active',
            firmwareVersion: 'v1.0.0',
            sensors: ['Generic'],
            capabilities: ['Basic'],
            telemetry: { temperature: 25, humidity: 50, distance: 0, batteryRemaining: 100, batteryUsed: 0, uptime: '0s', lastContact: 'Just now' },
            gateway: { mode: 'Standard', securityLevel: 'Low', transmissionFreq: '60s' }
          };
          handleAddDevice(newDev);
        }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>Device ID</label>
            <input name="did" required style={inputStyle(isDarkMode)} placeholder="e.g. ESP32-X9" />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>Type</label>
            <select name="type" style={inputStyle(isDarkMode)}>
              <option value="ESP32">ESP32</option>
              <option value="Ultrasonic">Ultrasonic</option>
              <option value="Raspberry Pi">Raspberry Pi</option>
              <option value="STM32">STM32</option>
            </select>
          </div>
          <button type="submit" style={{
            width: '100%', padding: 14, borderRadius: 12, border: 'none',
            background: isDarkMode ? '#34D399' : '#059669',
            color: isDarkMode ? '#000' : '#fff', fontWeight: 700, cursor: 'pointer'
          }}>
            Register Device
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Helper Styles & Components ---

function glassCardStyle(isDark) {
  return {
    background: isDark ? 'rgba(30,41,59,0.4)' : 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(10px)',
    borderRadius: 20,
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.6)',
    padding: 24,
    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.04)'
  };
}

function glassIconStyle(isDark) {
  return {
    width: 40, height: 40, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
    color: isDark ? '#fff' : '#334155'
  };
}

function InfoRow({ label, value, accent, valueRight, isDark }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>
      <span style={{ fontSize: 13, opacity: 0.7 }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: 13, color: accent ? accent : (isDark ? '#fff' : '#0f172a'), textAlign: valueRight ? 'right' : 'left' }}>
        {value}
      </span>
    </div>
  );
}

function SmallChip({ label, text, isDark }) {
  return (
    <div style={{
      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
      background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)'
    }}>
      <span style={{ opacity: 0.6, marginRight: 6 }}>{label}:</span>
      {text}
    </div>
  );
}

function MetricCard({ label, value, icon, isDark }) {
  return (
    <div style={{
      flex: 1, padding: 12, borderRadius: 12,
      background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
      border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.06)',
      display: 'flex', alignItems: 'center', gap: 10
    }}>
      <div style={{ color: isDark ? '#94a3b8' : '#64748b', transform: 'scale(0.85)' }}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, opacity: 0.6 }}>{label}</div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{value}</div>
      </div>
    </div>
  );
}

function inputStyle(isDark) {
  return {
    width: '100%', padding: 12, borderRadius: 10,
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
    background: isDark ? 'rgba(0,0,0,0.3)' : '#fff',
    color: isDark ? '#fff' : '#000',
    boxSizing: 'border-box'
  };
}