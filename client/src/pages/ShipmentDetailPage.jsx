import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  ArrowLeft, Thermometer, Droplets, Cpu, Package,
  CheckCircle, XCircle, Clock,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { PageLoader } from '../components/common/Loader';

const statusVariant = { 'in-transit': 'blue', pending: 'slate', delivered: 'green', alert: 'red' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl px-4 py-3 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}{p.dataKey === 'temperature' ? '°C' : '%'}
        </p>
      ))}
    </div>
  );
};

export default function ShipmentDetailPage() {
  const { id } = useParams();
  const [shipment, setShipment] = useState(null);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getShipmentById(id), api.getSensorReadings(id)]).then(([s, r]) => {
      setShipment(s);
      setReadings(r);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <PageLoader />;
  if (!shipment) {
    return (
      <div className="text-center py-24">
        <p className="text-slate-500">Shipment not found.</p>
        <Link to="/shipments" className="text-blue-400 text-sm mt-2 inline-block">← Back to shipments</Link>
      </div>
    );
  }

  const latest = readings[readings.length - 1];
  const tempBreaches = readings.filter(r => r.temperature > shipment.tempRange.max || r.temperature < shipment.tempRange.min);
  const chainValid = readings.every(r => r.isValid);

  return (
    <div className="space-y-6 fade-in">
      {/* Back + Header */}
      <div>
        <Link to="/shipments" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Shipments
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white font-mono">{shipment.id}</h1>
              <Badge variant={statusVariant[shipment.status] ?? 'slate'}>{shipment.status}</Badge>
            </div>
            <p className="text-sm text-slate-400 mt-1">{shipment.origin} → {shipment.destination}</p>
          </div>
          <div className="flex items-center gap-2">
            {chainValid ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
                <CheckCircle className="w-4 h-4" />
                Hash Chain Valid
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold">
                <XCircle className="w-4 h-4" />
                Chain Integrity Broken
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Vaccine Type',   value: shipment.vaccineType,             icon: Package,      col: 'slate' },
          { label: 'Temp Range',     value: `${shipment.tempRange.min}°C – ${shipment.tempRange.max}°C`, icon: Thermometer, col: 'blue' },
          { label: 'Device',         value: shipment.deviceId,                icon: Cpu,          col: 'violet' },
          { label: 'Total Doses',    value: shipment.doses?.toLocaleString(), icon: CheckCircle,  col: 'green' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="glass-card rounded-2xl p-4">
              <Icon className="w-4 h-4 text-slate-500 mb-2" />
              <p className="text-xs text-slate-500">{card.label}</p>
              <p className="text-sm font-semibold text-slate-200 mt-1 truncate">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-white">{readings.length}</p>
          <p className="text-xs text-slate-500 mt-1">Total Readings</p>
        </div>
        <div className="glass-card rounded-2xl p-5 text-center">
          <p className={`text-3xl font-bold ${tempBreaches.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{tempBreaches.length}</p>
          <p className="text-xs text-slate-500 mt-1">Temp Breaches</p>
        </div>
        <div className="glass-card rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-blue-400">{latest?.temperature ?? '--'}°C</p>
          <p className="text-xs text-slate-500 mt-1">Latest Temp</p>
        </div>
      </div>

      {/* Temperature Chart */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-slate-200 mb-1">Temperature History</h2>
        <p className="text-xs text-slate-500 mb-5">Red bands = threshold limits</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={readings}>
              <defs>
                <linearGradient id="t2grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="timestamp" tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={shipment.tempRange.max} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `Max ${shipment.tempRange.max}°C`, fill: '#ef4444', fontSize: 9 }} />
              <ReferenceLine y={shipment.tempRange.min} stroke="#f97316" strokeDasharray="4 4" label={{ value: `Min ${shipment.tempRange.min}°C`, fill: '#f97316', fontSize: 9 }} />
              <Area type="monotone" dataKey="temperature" name="Temp" stroke="#3b82f6" strokeWidth={2} fill="url(#t2grad)" dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Humidity Chart */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-slate-200 mb-1">Humidity History</h2>
        <p className="text-xs text-slate-500 mb-5">Relative humidity (%)</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={readings}>
              <defs>
                <linearGradient id="h2grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="timestamp" tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="humidity" name="Humidity" stroke="#a78bfa" strokeWidth={2} fill="url(#h2grad)" dot={{ r: 3, fill: '#a78bfa' }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Readings Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/8">
          <h2 className="text-sm font-semibold text-slate-200">Raw Sensor Readings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5">
                {['Timestamp', 'Temp (°C)', 'Humidity (%)', 'Hash Valid', 'Current Hash'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[...readings].reverse().map((r) => {
                const breached = r.temperature > shipment.tempRange.max || r.temperature < shipment.tempRange.min;
                return (
                  <tr key={r.id} className="hover:bg-white/3">
                    <td className="px-5 py-3 font-mono text-slate-400">{new Date(r.timestamp).toLocaleString()}</td>
                    <td className={`px-5 py-3 font-mono font-semibold ${breached ? 'text-red-400' : 'text-emerald-400'}`}>{r.temperature}</td>
                    <td className="px-5 py-3 font-mono text-slate-300">{r.humidity}</td>
                    <td className="px-5 py-3">
                      {r.isValid
                        ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                        : <XCircle className="w-4 h-4 text-red-400" />
                      }
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-600 text-[10px] truncate max-w-xs">{r.currentHash}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
