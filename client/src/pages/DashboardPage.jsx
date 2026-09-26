import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from 'recharts';
import {
  Truck, Thermometer, Droplets, AlertTriangle, Wifi, WifiOff,
  ArrowUpRight, CheckCircle, Clock, Plus, CheckCircle2, Cpu,
} from 'lucide-react';
import { Badge, StatusDot } from '../components/common/Badge';
import { PageLoader } from '../components/common/Loader';
import { NewShipmentModal } from '../components/shipments/NewShipmentModal';
import { RegisterDeviceModal } from '../components/devices/RegisterDeviceModal';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-xl px-4 py-3 text-xs shadow-xl">
        <p className="text-slate-400 mb-1">{new Date(label).toLocaleTimeString()}</p>
        {payload.map((p) => (
          <p key={p.dataKey} className="font-semibold" style={{ color: p.color }}>
            {p.name}: {p.value}
            {p.dataKey === 'temperature' ? '°C' : '%'}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function StatCard({ label, value, unit, icon: Icon, color, sub, to }) {
  const colorMap = {
    blue:   { icon: 'text-blue-400', ring: 'border-blue-500/20', glow: 'bg-blue-500/10' },
    green:  { icon: 'text-emerald-400', ring: 'border-emerald-500/20', glow: 'bg-emerald-500/10' },
    amber:  { icon: 'text-amber-400', ring: 'border-amber-500/20', glow: 'bg-amber-500/10' },
    red:    { icon: 'text-red-400', ring: 'border-red-500/20', glow: 'bg-red-500/10' },
    violet: { icon: 'text-violet-400', ring: 'border-violet-500/20', glow: 'bg-violet-500/10' },
  };
  const c = colorMap[color] ?? colorMap.blue;

  const Wrapper = to ? Link : 'div';

  return (
    <Wrapper
      to={to}
      className={`glass-card rounded-2xl p-5 flex flex-col gap-3 slide-in border ${c.ring} hover:border-opacity-50 transition-all group ${to ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl ${c.glow} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        {to && <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />}
      </div>
      <div>
        <p className="text-3xl font-bold text-white">
          {value}<span className="text-lg font-normal text-slate-400 ml-1">{unit}</span>
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
      {sub && <p className="text-xs text-slate-600">{sub}</p>}
    </Wrapper>
  );
}

export default function DashboardPage() {
  const [readings, setReadings] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shipmentModalOpen, setShipmentModalOpen] = useState(false);
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getSensorReadings('SHIP-001'),
      api.getShipments(),
      api.getAlerts(),
      api.getDevices(),
    ]).then(([r, s, a, d]) => {
      setReadings(r);
      setShipments(s);
      setAlerts(a);
      setDevices(d);
      setLoading(false);
    });
  }, []);

  const handleShipmentCreated = (newShipment) => {
    setShipments((prev) => [newShipment, ...prev]);
    setSuccessToast(`Shipment ${newShipment.id} created successfully!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleDeviceCreated = (newDevice) => {
    setDevices((prev) => [newDevice, ...prev]);
    setSuccessToast(`Device ${newDevice.id} registered successfully!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  if (loading) return <PageLoader />;

  const latest = readings[readings.length - 1];
  const inTransit = shipments.filter((s) => s.status === 'in-transit').length;
  const activeAlerts = alerts.filter((a) => !a.resolved).length;
  const onlineDevices = devices.filter((d) => d.status === 'online').length;

  return (
    <div className="space-y-6 fade-in">
      {/* Success Notification */}
      {successToast && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm slide-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time vaccine cold chain monitoring</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            id="dash-register-device-btn"
            onClick={() => setDeviceModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold transition-all cursor-pointer active:scale-95"
          >
            <Cpu className="w-3.5 h-3.5 text-violet-400" />
            Register Device
          </button>
          <button
            id="dash-new-shipment-btn"
            onClick={() => setShipmentModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs font-semibold hover:from-blue-500 hover:to-violet-500 transition-all shadow-lg shadow-blue-500/20 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Shipment
          </button>
        </div>
      </div>

      {/* Active Alerts Banner */}
      {activeAlerts > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/25 slide-in">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">
            <span className="font-bold">{activeAlerts} active alert{activeAlerts > 1 ? 's' : ''}</span>
            {' — '}temperature thresholds breached. Check Alerts tab for details.
          </p>
          <Link to="/alerts" className="ml-auto text-xs text-red-400 hover:text-red-300 font-semibold whitespace-nowrap">
            View Alerts →
          </Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Shipments"
          value={inTransit}
          icon={Truck}
          color="blue"
          to="/shipments"
          sub={`${shipments.length} total shipments`}
        />
        <StatCard
          label="Latest Temperature"
          value={latest?.temperature ?? '--'}
          unit="°C"
          icon={Thermometer}
          color={latest && latest.temperature > -60 ? 'red' : 'green'}
          sub="SHIP-001 · ESP32-A1B2"
        />
        <StatCard
          label="Latest Humidity"
          value={latest?.humidity ?? '--'}
          unit="%"
          icon={Droplets}
          color="violet"
          sub="SHIP-001 · ESP32-A1B2"
        />
        <StatCard
          label="Active Alerts"
          value={activeAlerts}
          icon={AlertTriangle}
          color={activeAlerts > 0 ? 'red' : 'green'}
          to="/alerts"
          sub={`${onlineDevices}/${devices.length} devices online`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Temperature Chart */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Temperature Over Time</h2>
              <p className="text-xs text-slate-500">SHIP-001 · Last 8 readings</p>
            </div>
            <Badge variant="blue">SHIP-001</Badge>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={readings}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  stroke="#475569"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <YAxis stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={-60} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Max', fill: '#ef4444', fontSize: 10 }} />
                <ReferenceLine y={-80} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'Min', fill: '#f97316', fontSize: 10 }} />
                <Area type="monotone" dataKey="temperature" name="Temp" stroke="#3b82f6" strokeWidth={2} fill="url(#tempGrad)" dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Humidity Chart */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Humidity Over Time</h2>
              <p className="text-xs text-slate-500">SHIP-001 · Last 8 readings</p>
            </div>
            <Badge variant="purple">SHIP-001</Badge>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={readings}>
                <defs>
                  <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  stroke="#475569"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <YAxis stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} domain={[30, 70]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="humidity" name="Humidity" stroke="#a78bfa" strokeWidth={2} fill="url(#humGrad)" dot={{ r: 3, fill: '#a78bfa' }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Active Shipments Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Active Shipments</h2>
          <Link to="/shipments" className="text-xs text-blue-400 hover:text-blue-300 font-medium">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Shipment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vaccine</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {shipments.filter(s => s.status === 'in-transit' || s.status === 'alert').map((s) => (
                <tr key={s.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-6 py-3">
                    <Link to={`/shipments/${s.id}`} className="font-mono text-blue-400 hover:text-blue-300 font-medium text-xs">
                      {s.id}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-slate-400 text-xs">{s.origin} → {s.destination}</td>
                  <td className="px-6 py-3 text-slate-300 text-xs">{s.vaccineType}</td>
                  <td className="px-6 py-3">
                    <Badge variant={s.status === 'alert' ? 'red' : 'blue'}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 font-mono text-slate-400 text-xs">{s.deviceId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <NewShipmentModal
        open={shipmentModalOpen}
        onClose={() => setShipmentModalOpen(false)}
        onCreated={handleShipmentCreated}
      />
      <RegisterDeviceModal
        open={deviceModalOpen}
        onClose={() => setDeviceModalOpen(false)}
        onCreated={handleDeviceCreated}
      />
    </div>
  );
}
