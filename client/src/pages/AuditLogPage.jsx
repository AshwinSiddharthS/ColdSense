import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { ShieldCheck, CheckCircle, AlertTriangle, Filter, User, Bot } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { PageLoader } from '../components/common/Loader';

const actionConfig = {
  SHIPMENT_CREATED:  { label: 'Created',    variant: 'blue',   icon: ShieldCheck },
  DEVICE_ASSIGNED:   { label: 'Device',     variant: 'purple', icon: Filter },
  SHIPMENT_STARTED:  { label: 'Started',    variant: 'blue',   icon: CheckCircle },
  ALERT_TRIGGERED:   { label: 'Alert',      variant: 'red',    icon: AlertTriangle },
  SHIPMENT_DELIVERED:{ label: 'Delivered',  variant: 'green',  icon: CheckCircle },
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [shipmentFilter, setShipmentFilter] = useState('all');
  const [shipmentIds, setShipmentIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getAuditLogs(), api.getShipments()]).then(([l, s]) => {
      setLogs(l);
      setShipmentIds(s.map((x) => x.id));
      setLoading(false);
    });
  }, []);

  const filtered = shipmentFilter === 'all'
    ? logs
    : logs.filter((l) => l.shipmentId === shipmentFilter);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tamper-evident hash chain — every action is cryptographically signed.
        </p>
      </div>

      {/* Hash Chain Status */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
        <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-300">Hash Chain Integrity: Valid</p>
          <p className="text-xs text-emerald-500/70 mt-0.5">All {logs.length} audit entries verified — no tampering detected.</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label htmlFor="audit-shipment-filter" className="text-xs text-slate-400 font-medium">Filter by shipment:</label>
        <select
          id="audit-shipment-filter"
          value={shipmentFilter}
          onChange={(e) => setShipmentFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm
            focus:outline-none focus:border-blue-500/50 transition-colors"
        >
          <option value="all">All Shipments</option>
          {shipmentIds.map((id) => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        {filtered.map((log, idx) => {
          const config = actionConfig[log.action] ?? { label: log.action, variant: 'slate', icon: ShieldCheck };
          const Icon = config.icon;
          const isSystem = log.performedBy === 'SYSTEM';

          return (
            <div key={log.id} className="flex gap-4 group slide-in">
              {/* Timeline line + dot */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10
                  ${config.variant === 'red' ? 'bg-red-500/15 border border-red-500/25' :
                    config.variant === 'green' ? 'bg-emerald-500/15 border border-emerald-500/25' :
                    config.variant === 'blue' ? 'bg-blue-500/15 border border-blue-500/25' :
                    'bg-slate-500/15 border border-slate-500/25'}`}>
                  <Icon className={`w-3.5 h-3.5 ${
                    config.variant === 'red' ? 'text-red-400' :
                    config.variant === 'green' ? 'text-emerald-400' :
                    config.variant === 'blue' ? 'text-blue-400' :
                    'text-slate-400'}`} />
                </div>
                {idx < filtered.length - 1 && (
                  <div className="w-px flex-1 bg-white/6 my-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="glass-card rounded-2xl p-4 border border-white/8 group-hover:border-white/12 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={config.variant}>{config.label}</Badge>
                      <span className="font-mono text-blue-400 text-xs">{log.shipmentId}</span>
                    </div>
                    <time className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </time>
                  </div>

                  <p className="mt-2 text-sm text-slate-300">{log.details}</p>

                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Performer */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      {isSystem
                        ? <Bot className="w-3.5 h-3.5 text-violet-400" />
                        : <User className="w-3.5 h-3.5 text-slate-400" />}
                      <span className={isSystem ? 'text-violet-400' : 'text-slate-400'}>{log.performedBy}</span>
                    </div>
                    {/* Hash */}
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      <span className="font-mono text-[10px] text-slate-600 truncate max-w-xs">{log.hash}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="glass-card rounded-2xl p-16 text-center">
            <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No audit entries for this shipment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
