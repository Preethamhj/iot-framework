// src/pages/Dashboard.jsx
import React, { useEffect, useRef, useState } from "react";
import { useTheme } from '../context/ThemeContext';

/* ---- fallback mock data ---- */
const FALLBACK = {
  kpis: {
    cloud_reduction_pct: 68.4,
    active_anomalies: 7,
    avg_soc: 62.3,
    policy_distribution: { balanced: 0.82, battery_saving: 0.12, security_priority: 0.06 },
    devices_online: 482,
    total_devices: 500,
    inference_latency_ms: 85,
  },
  batteryTrend: [
    { ts: "2025-11-15T00:00:00Z", avg_rul: 30.2, lower: 27.1, upper: 33.4 },
    { ts: "2025-11-16T00:00:00Z", avg_rul: 30.0, lower: 26.9, upper: 33.2 },
    { ts: "2025-11-17T00:00:00Z", avg_rul: 29.8, lower: 26.6, upper: 33.0 },
  ],
  sseEvents: [
    { id: "e1", type: "ALERT", ts: "2025-11-22T01:04:00Z", severity: "high", device_id: "ESP32-A1", message: "temp jump 28°C -> 70°C" },
    { id: "e2", type: "ACTION", ts: "2025-11-22T01:02:00Z", severity: "info", message: "Policy changed: 120 devices -> BatterySaving" },
    { id: "e3", type: "OTA", ts: "2025-11-21T23:50:00Z", severity: "info", message: "Firmware v2.1.4 deployed to 12 devices (10 success,2 fail)" },
  ],
  devicesTopRisk: [
    { device_id: "LORA-C3", model: "LORA", soc: 15, rul_days: 3, anomaly_score: 0.88, policy_mode: "battery_saving", firmware_version: "v2.0.1", last_seen: "2025-11-22T00:58:00Z" },
    { device_id: "ESP32-A1", model: "ESP32", soc: 34, rul_days: 12, anomaly_score: 0.77, policy_mode: "balanced", firmware_version: "v2.1.3", last_seen: "2025-11-22T01:00:20Z" },
  ],
  gatewayHealth: { cpu: 65, memory: 72, disk: 40, inference_latency_ms: 85, last_restart: "2025-11-20T08:00:00Z" },
};

/* ---- small util functions ---- */
const fmtDate = (iso) => {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
};

/* ---- Inline small CSS block ---- */
const InlineStyles = ({ isDark }) => (
  <style>{`
    :root{
      --bg-page: ${isDark ? '#071019' : '#f8fafc'};
      --surface: ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.95)'};
      --card-border: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.08)'};
      --neon: ${isDark ? '#00D17A' : '#059669'};
      --neon-2: ${isDark ? '#2CE2D9' : '#06b6d4'};
      --muted: ${isDark ? '#93A3A1' : '#64748b'};
      --text: ${isDark ? '#E6F1EA' : '#0f172a'};
      --card-radius: 14px;
    }

    .dashboard-root {
      background: ${isDark ? 'linear-gradient(180deg, rgba(6,10,13,0.95), rgba(8,12,16,0.98))' : 'linear-gradient(180deg, rgba(248,250,252,0.98), rgba(241,245,249,0.98))'};
      color: var(--text);
      min-height: 100vh;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
    }

    .glass {
      background: var(--surface);
      border: 1px solid var(--card-border);
      border-radius: var(--card-radius);
      box-shadow: ${isDark ? '0 10px 30px rgba(2,6,8,0.6)' : '0 4px 12px rgba(2,6,8,0.08)'};
      backdrop-filter: blur(6px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
    }

    .glass:hover {
      transform: translateY(-4px);
      box-shadow: ${isDark 
        ? '0 16px 40px rgba(2,6,8,0.8)' 
        : '0 8px 20px rgba(2,6,8,0.12)'};
    }

    .glass:active {
      transform: translateY(-2px);
      box-shadow: ${isDark 
        ? '0 12px 32px rgba(2,6,8,0.7)' 
        : '0 6px 16px rgba(2,6,8,0.1)'};
    }

    .neon-heading {
      color: var(--neon);
      text-shadow: ${isDark ? '0 1px 0 rgba(0,0,0,0.6), 0 6px 18px rgba(0,209,122,0.07), 0 2px 6px rgba(0,209,122,0.06)' : 'none'};
      animation: glow-pulse 3s ease-in-out infinite;
    }

    @keyframes glow-pulse {
      0%, 100% {
        text-shadow: ${isDark 
          ? '0 0 10px rgba(0, 209, 122, 0.3), 0 0 20px rgba(0, 209, 122, 0.2)' 
          : '0 0 5px rgba(5, 150, 105, 0.2)'};
      }
      50% {
        text-shadow: ${isDark 
          ? '0 0 20px rgba(0, 209, 122, 0.5), 0 0 30px rgba(0, 209, 122, 0.3)' 
          : '0 0 10px rgba(5, 150, 105, 0.3)'};
      }
    }

    .fade-in {
      animation: fadeInUp 450ms cubic-bezier(.2,.9,.2,1) both;
    }
    @keyframes fadeInUp {
      from { transform: translateY(10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .sparkline polyline {
      stroke-dasharray: 200;
      stroke-dashoffset: 200;
      animation: draw 1.5s ease-out forwards;
    }
    @keyframes draw {
      to { stroke-dashoffset: 0; }
    }

    .kpi-number { 
      font-weight: 800; 
      font-size: 1.6rem; 
      color: ${isDark ? '#ffffff' : '#0f172a'}; 
      animation: number-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes number-pop {
      0% { transform: scale(0.8); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    .evt-high { 
      border-left: 3px solid #FF6B6B; 
      animation: alert-pulse 2s ease-in-out infinite;
    }
    .evt-medium { border-left: 3px solid #FFC857; }
    .evt-low { border-left: 3px solid var(--neon); }

    @keyframes alert-pulse {
      0%, 100% { box-shadow: 0 0 0 rgba(255, 107, 107, 0); }
      50% { box-shadow: ${isDark ? '0 0 20px rgba(255, 107, 107, 0.3)' : '0 0 10px rgba(255, 107, 107, 0.2)'}; }
    }

    .btn-neon {
      background: linear-gradient(135deg, rgba(0,209,122,1), rgba(0,197,111,1));
      color: #04120a;
      font-weight: 700;
      padding: 10px 16px;
      border-radius: 10px;
      box-shadow: 0 6px 20px rgba(0,209,122,0.3), inset 0 -2px 6px rgba(0,0,0,0.25);
      cursor: pointer;
      border: none;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .btn-neon:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(0,209,122,0.5), inset 0 -2px 6px rgba(0,0,0,0.25);
    }

    .btn-neon:active {
      transform: translateY(0);
      box-shadow: 0 4px 15px rgba(0,209,122,0.4), inset 0 -2px 6px rgba(0,0,0,0.25);
    }

    .btn-neon::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
      transform: rotate(45deg);
      animation: shine 3s infinite;
    }

    @keyframes shine {
      0% { left: -50%; }
      100% { left: 150%; }
    }

    .btn-ghost {
      border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)'};
      color: var(--text);
      padding: 8px 12px;
      border-radius: 10px;
      background: transparent;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-ghost:hover {
      background: ${isDark ? 'rgba(0,209,122,0.1)' : 'rgba(5,150,105,0.1)'};
      border-color: var(--neon);
      transform: translateY(-2px);
    }

    .chip {
      display: inline-block;
      padding: 6px 12px;
      background: ${isDark ? 'rgba(0,209,122,0.1)' : 'rgba(5,150,105,0.1)'};
      border-radius: 999px;
      color: var(--neon);
      font-size: 0.82rem;
      border: 1px solid ${isDark ? 'rgba(0,209,122,0.2)' : 'rgba(5,150,105,0.2)'};
      font-weight: 600;
      animation: fade-in 0.5s ease-out;
    }

    .donut {
      position: relative;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 1.5rem;
      background: conic-gradient(
        var(--neon) 0deg,
        var(--neon) calc(70 * 3.6deg),
        ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)'} calc(70 * 3.6deg),
        ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)'} 360deg
      );
      box-shadow: ${isDark 
        ? '0 0 20px rgba(0, 209, 122, 0.3), inset 0 0 15px rgba(0, 0, 0, 0.5)' 
        : '0 0 10px rgba(5, 150, 105, 0.2), inset 0 0 10px rgba(0, 0, 0, 0.1)'};
      animation: rotate-donut 3s linear infinite, pulse-glow 2s ease-in-out infinite;
    }

    .donut::before {
      content: '';
      position: absolute;
      width: 65%;
      height: 65%;
      background: ${isDark ? '#0a0d12' : '#ffffff'};
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    }

    .donut-text {
      position: relative;
      z-index: 1;
      color: var(--neon);
      text-shadow: ${isDark ? '0 0 10px rgba(0, 209, 122, 0.5)' : '0 2px 4px rgba(0, 0, 0, 0.1)'};
    }

    @keyframes rotate-donut {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes pulse-glow {
      0%, 100% {
        box-shadow: ${isDark 
          ? '0 0 20px rgba(0, 209, 122, 0.3), inset 0 0 15px rgba(0, 0, 0, 0.5)' 
          : '0 0 10px rgba(5, 150, 105, 0.2), inset 0 0 10px rgba(0, 0, 0, 0.1)'};
      }
      50% {
        box-shadow: ${isDark 
          ? '0 0 35px rgba(0, 209, 122, 0.5), inset 0 0 20px rgba(0, 0, 0, 0.6)' 
          : '0 0 20px rgba(5, 150, 105, 0.3), inset 0 0 15px rgba(0, 0, 0, 0.15)'};
      }
    }

    .muted { color: ${isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)'}; }

    .live-badge {
      animation: live-pulse 2s ease-in-out infinite;
    }

    @keyframes live-pulse {
      0%, 100% { 
        box-shadow: 0 0 0 0 rgba(0, 209, 122, 0.7);
      }
      50% { 
        box-shadow: 0 0 0 8px rgba(0, 209, 122, 0);
      }
    }
  `}</style>
);

/* ---- Child components ---- */

function KpiCard({ title, subtitle, value, sparkPoints = null, isDark, hideDate = false }) {
  const points = (sparkPoints || [10, 20, 18, 22, 19, 24]).map((v, i) => `${(i/(Math.max(1, sparkPoints ? sparkPoints.length-1 : 5))*100).toFixed(1)},${(100 - v).toFixed(1)}`).join(" ");
  return (
    <div className="glass p-4 fade-in">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm muted">{title}</div>
          {subtitle && <div className="text-xs muted mt-1">{subtitle}</div>}
        </div>
        {!hideDate && <div className="text-xs muted">{fmtDate(new Date().toISOString())}</div>}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <div className="kpi-number">{value}</div>
        </div>

        <div className="w-28 h-8 sparkline">
          <svg viewBox="0 0 100 30" preserveAspectRatio="none" width="100%" height="100%">
            <polyline fill="none" stroke={isDark ? "#00D17A" : "#059669"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} opacity="0.98" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function IncidentTimeline({ events = [], onAcknowledge = () => {}, onOpen = () => {}, isDark }) {
  return (
    <div className="glass p-4 fade-in">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold neon-heading">Incident Timeline</h3>
        <div className="text-xs muted">{events.length} recent</div>
      </div>

      <div className="mt-3 space-y-3 max-h-64 overflow-auto pr-2">
        {events.map((e) => {
          const cls = e.severity === "high" ? "evt-high" : e.severity === "medium" ? "evt-medium" : "evt-low";
          return (
            <div key={e.id ?? e.ts} className={`${cls} glass p-3 flex items-center justify-between`}>
              <div>
                <div className="font-medium text-sm" style={{ color: e.severity === "high" ? "#FFB4B4" : isDark ? "#E6F1EA" : "#0f172a" }}>{e.message}</div>
                <div className="text-xs muted mt-1">{e.device_id ? <strong className="mr-2">{e.device_id}</strong> : null}{fmtDate(e.ts)}</div>
              </div>

              <div className="flex items-center gap-2">
                <button className="btn-ghost text-xs" onClick={() => onOpen(e.device_id)}>Open</button>
                <button className="btn-neon text-xs" onClick={() => onAcknowledge(e.id)}>Acknowledge</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GatewayHealth({ health, isDark }) {
  if (!health) return null;
  return (
    <div className="glass p-4 fade-in">
      <div className="flex justify-between items-center">
        <div><h4 className="text-lg font-semibold">Gateway Health</h4><div className="text-xs muted">{`Last restart: ${fmtDate(health.last_restart)}`}</div></div>
        <div className="chip live-badge">Live</div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="text-sm muted flex justify-between"><span>CPU</span><span>{health.cpu}%</span></div>
        <div className="w-full bg-[rgba(255,255,255,0.03)] h-2 rounded">
          <div style={{ width: `${health.cpu}%`, background: "linear-gradient(90deg,#00D17A,#2CE2D9)" }} className="h-2 rounded"></div>
        </div>

        <div className="text-sm muted flex justify-between mt-2"><span>Memory</span><span>{health.memory}%</span></div>
        <div className="w-full bg-[rgba(255,255,255,0.03)] h-2 rounded">
          <div style={{ width: `${health.memory}%`, background: "linear-gradient(90deg,#7B61FF,#00D17A)" }} className="h-2 rounded"></div>
        </div>

        <div className="text-sm muted flex justify-between mt-2"><span>Inference Latency</span><span>{health.inference_latency_ms} ms</span></div>
      </div>
    </div>
  );
}

function TopDevices({ devices = [], onAction = () => {}, isDark }) {
  return (
    <div className="glass p-4 fade-in">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold">Top Devices</h4>
        <div className="text-xs muted">Actionable</div>
      </div>

      <div className="mt-3 space-y-2">
        {devices.map((d) => (
          <div key={d.device_id} className="flex items-center justify-between p-2 glass">
            <div>
              <div className="font-medium">{d.device_id} <span className="text-xs muted">({d.model})</span></div>
              <div className="text-xs muted mt-1">SoC: {d.soc}% • RUL: {d.rul_days}d • Score: {d.anomaly_score}</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-ghost text-xs" onClick={() => onAction("telemetry", d)}>Telemetry</button>
              <button className="btn-neon text-xs" onClick={() => onAction("policy", d)}>Policy</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BatteryTrend({ data = [], isDark }) {
  const len = Math.max(2, data.length);
  const pts = data.map((d, i) => {
    const x = (i / (len - 1)) * 100;
    const y = 100 - Math.min(100, Math.max(0, (d.avg_rul / 36) * 100));
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <div className="glass p-4 fade-in">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold">Battery Trend (RUL)</h4>
        <div className="text-xs muted">7 day</div>
      </div>

      <div className="mt-3 h-36">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%">
          <polyline points={pts} fill="none" stroke="#FF9FB1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={pts} fill="none" stroke={isDark ? "#00D17A" : "#059669"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="sparkline" />
        </svg>
      </div>
    </div>
  );
}

function FirmwareWidget({ distribution = {}, outdatedCount = 0, isDark }) {
  const total = Object.values(distribution).reduce((s, v) => s + v, 0) || 1;
  const pct = Math.round(((distribution["v2.1.4"] || 0) / total) * 100);
  return (
    <div className="glass p-4 fade-in">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold">Firmware Rollout</h4>
        <div className="text-xs muted">{outdatedCount} outdated</div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="donut">
          <div className="donut-text">{pct}%</div>
        </div>
        <div className="text-sm muted">
          <div>Latest: <strong style={{ color: isDark ? '#00D17A' : '#059669' }}>v2.1.4</strong></div>
          <div className="mt-2">Success: <strong style={{ color: isDark ? '#00D17A' : '#059669' }}>{pct}%</strong></div>
          <div className="mt-2 text-xs muted">Click to open firmware page</div>
        </div>
      </div>
    </div>
  );
}

/* ---- Main Dashboard component ---- */

export default function Dashboard() {
  const { isDarkMode } = useTheme();
  const [kpis, setKpis] = useState(null);
  const [events, setEvents] = useState([]);
  const [batteryTrend, setBatteryTrend] = useState([]);
  const [devicesTop, setDevicesTop] = useState([]);
  const [gatewayHealth, setGatewayHealth] = useState(null);
  const esRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/kpis"); if (!r.ok) throw new Error();
        setKpis(await r.json());
      } catch { setKpis(FALLBACK.kpis); }

      try {
        const r2 = await fetch("/api/metrics/battery-trend?period=7d"); if (!r2.ok) throw new Error();
        setBatteryTrend(await r2.json());
      } catch { setBatteryTrend(FALLBACK.batteryTrend); }

      try {
        const r3 = await fetch("/api/devices?filter=top_risk"); if (!r3.ok) throw new Error();
        setDevicesTop(await r3.json());
      } catch { setDevicesTop(FALLBACK.devicesTopRisk); }

      try {
        const r4 = await fetch("/api/gateway/health"); if (!r4.ok) throw new Error();
        setGatewayHealth(await r4.json());
      } catch { setGatewayHealth(FALLBACK.gatewayHealth); }
    })();
  }, []);

  useEffect(() => {
    if (typeof EventSource !== "undefined") {
      try {
        const es = new EventSource("/api/events/stream");
        esRef.current = es;
        es.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data);
            setEvents(prev => [data, ...prev].slice(0, 150));
          } catch {}
        };
        es.onerror = () => {
          es.close();
          setEvents(prev => [...FALLBACK.sseEvents, ...prev].slice(0, 150));
        };
      } catch {
        setEvents(FALLBACK.sseEvents);
      }
    } else {
      setEvents(FALLBACK.sseEvents);
    }

    return () => { if (esRef.current) { esRef.current.close(); esRef.current = null; } };
  }, []);

  const triggerOTA = async () => {
    const target = devicesTop.slice(0, 2).map(d => d.device_id);
    try {
      const res = await fetch("/api/ota", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ devices: target, firmware_id: "v2.1.4" }) });
      const job = await res.json();
      setEvents(prev => [{ id: `ota-${Date.now()}`, ts: new Date().toISOString(), severity: "info", message: `OTA scheduled ${job.job_id || "(ok)"}` }, ...prev]);
      alert("OTA scheduled");
    } catch {
      setEvents(prev => [{ id: `ota-${Date.now()}`, ts: new Date().toISOString(), severity: "info", message: `OTA scheduled (mock)` }, ...prev]);
      alert("OTA (mock) scheduled");
    }
  };

  const forcePolicy = async () => {
    try {
      await fetch("/api/policy/override", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ devices: ["*"], mode: "battery_saving", dry_run: true }) });
      setEvents(prev => [{ id: `pol-${Date.now()}`, ts: new Date().toISOString(), severity: "info", message: `Policy override (dry-run)` }, ...prev]);
      alert("Policy dry-run executed");
    } catch {
      setEvents(prev => [{ id: `pol-${Date.now()}`, ts: new Date().toISOString(), severity: "info", message: `Policy override (mock)` }, ...prev]);
      alert("Policy override (mock)");
    }
  };

  const retrainModel = async () => {
    try {
      await fetch("/api/model/retrain", { method: "POST" });
      setEvents(prev => [{ id: `ml-${Date.now()}`, ts: new Date().toISOString(), severity: "info", message: `Battery model retrain triggered` }, ...prev]);
      alert("Retrain triggered");
    } catch {
      setEvents(prev => [{ id: `ml-${Date.now()}`, ts: new Date().toISOString(), severity: "info", message: `Battery model retrain (mock)` }, ...prev]);
      alert("Retrain (mock)");
    }
  };

  const acknowledge = (id) => {
    setEvents(prev => prev.map(e => (e.id === id ? { ...e, acknowledged: true } : e)));
  };

  const openDevice = (deviceId) => {
    alert("Open device: " + deviceId);
  };

  return (
    <div className="dashboard-root p-6">
      <InlineStyles isDark={isDarkMode} />

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-3xl font-extrabold neon-heading">Gateway Dashboard</div>
          <div className="text-sm muted mt-1">Real-time monitoring and system analytics</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm muted">{new Date().toLocaleString()}</div>
          <button className="btn-neon live-badge">Live</button>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-5 gap-4 mb-4">
        <KpiCard title="Cloud Traffic Reduced" subtitle="vs baseline" value={kpis ? `${kpis.cloud_reduction_pct}%` : "—"} isDark={isDarkMode} hideDate={true} />
        <KpiCard title="Active Anomalies" subtitle="critical / high" value={kpis ? kpis.active_anomalies : "—"} isDark={isDarkMode} hideDate={true} />
        <KpiCard title="Avg Battery (SoC%)" subtitle="fleet average" value={kpis ? `${kpis.avg_soc}%` : "—"} isDark={isDarkMode} hideDate={true} />
        <KpiCard title="Policy Distribution" subtitle="mode split" value={kpis ? `${Math.round((kpis.policy_distribution?.balanced||0)*100)}% Balanced` : "—"} isDark={isDarkMode} hideDate={true} />
        <KpiCard title="Online / Total" subtitle={`Inference: ${kpis ? kpis.inference_latency_ms + "ms" : "—"}`} value={kpis ? `${kpis.devices_online}/${kpis.total_devices}` : "—"} isDark={isDarkMode} hideDate={false} />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 space-y-4">
          <IncidentTimeline events={events.length ? events : FALLBACK.sseEvents} onAcknowledge={acknowledge} onOpen={openDevice} isDark={isDarkMode} />

          <div className="grid grid-cols-2 gap-4">
            <BatteryTrend data={batteryTrend.length ? batteryTrend : FALLBACK.batteryTrend} isDark={isDarkMode} />
            <div className="space-y-4">
              <FirmwareWidget distribution={{ "v2.1.4": 350, "v2.0.1": 120, "v1.9.8": 30 }} outdatedCount={30} isDark={isDarkMode} />
              <div className="glass p-4 fade-in">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold">Anomaly Overview</h4>
                  <div className="text-xs muted">by type</div>
                </div>
                <div className="mt-3 text-sm muted">sensor_fault: 12 • comm_failure: 8 • spoofing: 2</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-4">
          <GatewayHealth health={gatewayHealth || FALLBACK.gatewayHealth} isDark={isDarkMode} />
          <TopDevices devices={devicesTop.length ? devicesTop : FALLBACK.devicesTopRisk} onAction={(a,d) => { if (a === "policy") alert("Policy: " + d.device_id); else alert(a + ":" + d.device_id); }} isDark={isDarkMode} />
          <div className="glass p-4 fade-in">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold">Quick Actions</h4>
              <div className="text-xs muted">Admin</div>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <button className="btn-neon" onClick={triggerOTA}>Trigger OTA</button>
              <button className="btn-ghost" onClick={forcePolicy}>Force Policy Mode</button>
              <button className="btn-ghost" onClick={retrainModel}>Retrain Battery Model</button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer explainability */}
      <div className="mt-4 glass p-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-lg font-semibold">Explainability — Battery Model</h4>
            <div className="text-xs muted">Top contributing features</div>
          </div>
          <div className="text-xs muted">Model v1.2</div>
        </div>
        <div className="mt-3">
          <span className="chip mr-2">avg_temp</span>
          <span className="chip mr-2">charge_cycles</span>
          <span className="chip">voltage_variance</span>
        </div>
      </div>
    </div>
  );
}