import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { AlertTriangle, Info, CheckCircle, WifiOff, Thermometer, Filter } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { PageLoader } from '../components/common/Loader';

const typeConfig = {
  temp_high:  { label: 'Temp High',    variant: 'red',    icon: Thermometer },
  temp_low:   { label: 'Temp Low',     variant: 'amber',  icon: Thermometer },
  disconnect: { label: 'Disconnect',   variant: 'red',    icon: WifiOff },
  no_data:    { label: 'No Data',      variant: 'amber',  icon: Info },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'resolved'
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const data = await api.getAlerts();
      setAlerts(data);
    } catch (err) {
      console.warn('[AlertsPage] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 4000);
    return () => clearInterval(interval);
  }, []);

  const filtered = alerts.filter((a) => {
    if (filter === 'active')   return !a.resolved;
    if (filter === 'resolved') return a.resolved;
    return true;
  });

  if (loading) return <PageLoader />;

  const activeCount = alerts.filter(a => !a.resolved).length;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">System Alerts</h1>
        <p className="text-sm text-slate-500 mt-1">
          {activeCount > 0
            ? <span className="text-red-400 font-semibold">{activeCount} unresolved alert{activeCount > 1 ? 's' : ''}</span>
            : <span className="text-emerald-400 font-semibold">All clear — no active alerts</span>}
          {' '}&middot; {alerts.length} total
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="inline-flex rounded-xl overflow-hidden border border-white/10 p-0.5 bg-white/3">
        {[
          { key: 'all',      label: 'All',      count: alerts.length },
          { key: 'active',   label: 'Active',   count: activeCount },
          { key: 'resolved', label: 'Resolved', count: alerts.length - activeCount },
        ].map((tab) => (
          <button
            key={tab.key}
            id={`alerts-filter-${tab.key}`}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${filter === tab.key ? 'bg-blue-600/80 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-md
              ${filter === tab.key ? 'bg-white/20' : 'bg-white/6 text-slate-500'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filtered.map((a) => {
          const config = typeConfig[a.type] ?? typeConfig.no_data;
          const Icon = config.icon;
          return (
            <div
              key={a.id}
              className={`glass-card rounded-2xl p-5 border flex gap-4 slide-in transition-all
                ${!a.resolved
                  ? 'border-red-500/20 bg-red-500/5'
                  : 'border-white/8'}`}
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                ${!a.resolved ? 'bg-red-500/15' : 'bg-slate-500/10'}`}>
                <Icon className={`w-5 h-5 ${!a.resolved ? 'text-red-400' : 'text-slate-400'}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-semibold text-sm ${!a.resolved ? 'text-red-300' : 'text-slate-300'}`}>
                      {a.message}
                    </p>
                    <Badge variant={config.variant}>{config.label}</Badge>
                    {a.resolved && <Badge variant="green"><CheckCircle className="w-3 h-3" />Resolved</Badge>}
                  </div>
                  <time className="text-xs text-slate-500 whitespace-nowrap flex-shrink-0">
                    {new Date(a.createdAt).toLocaleString()}
                  </time>
                </div>

                {/* Meta */}
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span>Shipment: <span className="font-mono text-slate-300">{a.shipmentId}</span></span>
                  <span>Device: <span className="font-mono text-slate-300">{a.deviceId}</span></span>
                  {a.value != null && (
                    <span>
                      Value: <span className="font-mono text-red-400 font-semibold">{a.value}</span>
                      {' '}(Threshold: {a.threshold})
                    </span>
                  )}
                </div>

                {/* Action */}
                {!a.resolved && (
                  <div className="mt-3">
                    <button
                      id={`resolve-alert-${a.id}`}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium transition-colors border border-red-500/20"
                    >
                      Mark as Resolved
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="glass-card rounded-2xl p-16 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500/40 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No alerts in this category</p>
            <p className="text-slate-600 text-sm mt-1">Everything looks good!</p>
          </div>
        )}
      </div>
    </div>
  );
}
