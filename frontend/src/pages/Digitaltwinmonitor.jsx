import React, { useEffect, useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, CartesianGrid, AreaChart, RadialBarChart, RadialBar
} from 'recharts';
import {
  Cpu, Zap, Wifi, Clock, Shield, Radio, TrendingUp, Activity,
  Battery, Thermometer, Droplets, Ruler, CheckCircle
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * Final Digitaltwinmonitor.jsx
 * - Full-viewport fixed background container to remove white edges
 * - Uses global ThemeContext (no local toggle)
 * - Glassy cards, charts, donut, spacing tweaks
 * - Uses uploaded background at /mnt/data/ui purple.jpg
 */

const Digitaltwinmonitor = () => {
  const { isDarkMode } = useTheme(); // only read theme
  const [selectedDevice, setSelectedDevice] = useState(null);

  const devices = useMemo(() => [
    {
      id: 'ESP32-A1',
      type: 'ESP32',
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
      id: 'LORA-C3',
      type: 'LoRa Node',
      status: 'warning',
      firmwareVersion: 'v1.9.8',
      sensors: ['BME280', 'LDR'],
      capabilities: ['LoRaWAN', 'Low Power', 'Remote Wake'],
      telemetry: { temperature: 67.2, humidity: 45, distance: 0, batteryRemaining: 56, batteryUsed: 44, uptime: '8d 12h', lastContact: '1s ago' },
      gateway: { mode: 'Security Priority', securityLevel: 'High', transmissionFreq: '5s', lastOTA: '2024-01-10' }
    }
  ], []);

  useEffect(() => {
    setSelectedDevice(devices[0]);
  }, [devices]);

  const series = useMemo(() => {
    const s = [];
    for (let i = 0; i < 24; i++) {
      s.push({
        time: `${i}:00`,
        temperature: (selectedDevice?.telemetry?.temperature ?? 30) + Math.sin(i / 3) * 2 + (Math.random() - 0.5),
        humidity: (selectedDevice?.telemetry?.humidity ?? 60) + Math.cos(i / 4) * 4 + (Math.random() - 0.5),
        battery: Math.max(0, (selectedDevice?.telemetry?.batteryRemaining ?? 90) - i * 0.5)
      });
    }
    return s;
  }, [selectedDevice]);

  const getStatusColor = (status) => status === 'active' ? 'rgba(52,211,153,0.95)' : 'rgba(250,204,21,0.95)';

  /* ---------- REPLACED: top-level fixed container (fills viewport) ---------- */
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        // keep the uploaded background (your environment will serve this path)
        backgroundImage: `url('/mnt/data/ui purple.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        WebkitOverflowScrolling: 'touch',
      }}
      className={isDarkMode ? 'text-white' : 'text-slate-900'}
    >
      {/* inner overlay holds page content and allows scrolling */}
      <div
        style={{
          position: 'relative',
          minHeight: '100vh',
          padding: 28,
          overflow: 'auto',
          background: isDarkMode
            ? 'linear-gradient(180deg, rgba(10,12,18,0.78), rgba(8,10,14,0.85))'
            : 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(245,247,250,0.98))',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* Header (no local toggle) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
            <div>
              <h1 style={{
                fontSize: 28,
                fontWeight: 800,
                background: isDarkMode ? 'linear-gradient(90deg,#9AE6B4,#67E8F9)' : 'linear-gradient(90deg,#059669,#06b6d4)',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                margin: 0
              }}>
                Digital Twin Monitor
              </h1>
              <p style={{ margin: 0, marginTop: 6, color: isDarkMode ? 'rgba(255,255,255,0.78)' : 'rgba(30,41,59,0.7)' }}>
                Virtual device profiling & real-time telemetry
              </p>
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
                    border: selected ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.04)',
                    background: selected ? 'linear-gradient(90deg, rgba(52,211,153,0.07), rgba(14,165,233,0.04))' : 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(6px)',
                    color: isDarkMode ? '#fff' : '#09203f',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: 12, height: 12, borderRadius: 999,
                    background: getStatusColor(d.status),
                    boxShadow: selected ? '0 6px 20px rgba(34,197,94,0.12)' : '0 4px 10px rgba(0,0,0,0.12)'
                  }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700 }}>{d.id}</div>
                    <div style={{ fontSize: 12, opacity: 0.85 }}>{d.type}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* grid */}
          <style>{`
            @media(min-width: 1100px) {
              .dt-grid { grid-template-columns: 1fr 1fr 1fr; }
            }
          `}</style>

          <div className="dt-grid" style={{ display: 'grid', gap: 20 }}>
            {/* left */}
            <div style={glassCardStyle(isDarkMode)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={glassIconStyle(isDarkMode)}><Cpu /></div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Device Identity</h3>
                  <div style={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(30,41,59,0.6)', fontSize: 13 }}>Overview & metadata</div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 8 }}>
                <InfoRow label="Device ID" value={selectedDevice?.id} />
                <InfoRow label="Type" value={selectedDevice?.type} />
                <InfoRow label="Firmware" value={selectedDevice?.firmwareVersion} />
                <InfoRow label="Status" value={selectedDevice?.status} accent={getStatusColor(selectedDevice?.status)} />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                <SmallChip isDark={isDarkMode} label="Sensors" text={(selectedDevice?.sensors || []).join(', ')} />
                <SmallChip isDark={isDarkMode} label="Mode" text={selectedDevice?.gateway?.mode} />
              </div>
            </div>

            {/* middle */}
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
                  <div style={{ width: 10, height: 10, borderRadius: 6, background: '#34D399' }} />
                  <div style={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(30,41,59,0.6)', fontSize: 13 }}>{selectedDevice?.telemetry?.lastContact}</div>
                </div>
              </div>

              {/* chart */}
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
                    <Tooltip contentStyle={{ background: isDarkMode ? '#0b1220' : '#fff' }} />
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

              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Battery />
                    <div style={{ fontWeight: 700 }}>Battery</div>
                  </div>
                  <div style={{ color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'rgba(30,41,59,0.8)' }}>{selectedDevice?.telemetry?.batteryRemaining}%</div>
                </div>
                <div style={{ height: 12, borderRadius: 999, background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)' }}>
                  <div style={{
                    height: '100%',
                    width: `${selectedDevice?.telemetry?.batteryRemaining}%`,
                    borderRadius: 999,
                    background: 'linear-gradient(90deg,#10B981,#34D399,#06B6D4)',
                    transition: 'width 0.8s ease'
                  }} />
                </div>
              </div>
            </div>

            {/* right */}
            <div style={glassCardStyle(isDarkMode)}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <div style={glassIconStyle(isDarkMode)}><Shield /></div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Gateway Policy</h3>
                  <div style={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(30,41,59,0.6)', fontSize: 13 }}>{selectedDevice?.gateway?.mode}</div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <InfoRow label="Security Level" value={selectedDevice?.gateway?.securityLevel} />
                <InfoRow label="Frequency" value={selectedDevice?.gateway?.transmissionFreq} valueRight />
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
      </div>
    </div>
  );
};

/* ---------------- Helpers ---------------- */

function glassCardStyle(isDark) {
  return {
    borderRadius: 14,
    padding: 16,
    background: isDark ? 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))' : 'rgba(255,255,255,0.94)',
    border: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.06)',
    boxShadow: isDark ? '0 20px 50px rgba(2,6,23,0.6)' : '0 8px 20px rgba(2,6,23,0.06)',
    backdropFilter: 'blur(8px) saturate(120%)',
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
    background: isDark ? 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))' : '#fff',
    boxShadow: isDark ? '0 8px 26px rgba(0,0,0,0.45)' : '0 6px 16px rgba(2,6,23,0.06)'
  };
}

const InfoRow = ({ label, value, accent, valueRight }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{label}</div>
    <div style={{ fontWeight: 700, color: accent || 'inherit', textAlign: valueRight ? 'right' : 'left' }}>{value}</div>
  </div>
);

const SmallChip = ({ isDark, label, text }) => (
  <div
    style={{
      padding: '8px 12px',
      borderRadius: 999,
      background: isDark ? 'rgba(255,255,255,0.02)' : '#eef2ff',
      border: isDark ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(0,0,0,0.06)',
      color: isDark ? 'rgba(255,255,255,0.85)' : '#0f172a',
      fontSize: 13,
      display: 'inline-flex',
      gap: 10,
      alignItems: 'center'
    }}
  >
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

export default Digitaltwinmonitor;
