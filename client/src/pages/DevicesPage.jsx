import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Plus, Wifi, WifiOff, BatteryMedium, Signal, Cpu, CheckCircle2 } from 'lucide-react';
import { Badge, StatusDot } from '../components/common/Badge';
import { PageLoader } from '../components/common/Loader';
import { RegisterDeviceModal } from '../components/devices/RegisterDeviceModal';

const statusVariant = { online: 'green', offline: 'red', disabled: 'slate' };

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState(null);

  useEffect(() => {
    api.getDevices().then((data) => {
      setDevices(data);
      setLoading(false);
    });
  }, []);

  const handleDeviceCreated = (created) => {
    setDevices((prev) => [created, ...prev]);
    setSuccessToast(`Device ${created.id} (${created.name}) successfully registered!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  if (loading) return <PageLoader />;

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
          <h1 className="text-2xl font-bold text-white">IoT Devices</h1>
          <p className="text-sm text-slate-500 mt-1">{devices.length} registered devices</p>
        </div>
        <button
          id="register-device-btn"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold hover:from-blue-500 hover:to-violet-500 transition-all shadow-lg shadow-blue-500/20 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Register Device
        </button>
      </div>

      {/* Summary pills */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Online',   count: devices.filter(d => d.status === 'online').length,   variant: 'green' },
          { label: 'Offline',  count: devices.filter(d => d.status === 'offline').length,  variant: 'red' },
          { label: 'Disabled', count: devices.filter(d => d.status === 'disabled').length, variant: 'slate' },
        ].map((p) => (
          <div key={p.label} className="glass-card rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">{p.label}</span>
            <Badge variant={p.variant}>{p.count}</Badge>
          </div>
        ))}
      </div>

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {devices.map((d) => (
          <div key={d.id} className={`glass-card rounded-2xl p-5 flex flex-col gap-4 border transition-all
            ${d.status === 'online' ? 'border-emerald-500/15 hover:border-emerald-500/30' : 'border-white/8 hover:border-white/12'}`}>

            {/* Card Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                  ${d.status === 'online' ? 'bg-emerald-500/10' : d.status === 'offline' ? 'bg-red-500/10' : 'bg-slate-500/10'}`}>
                  <Cpu className={`w-5 h-5 ${d.status === 'online' ? 'text-emerald-400' : d.status === 'offline' ? 'text-red-400' : 'text-slate-500'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-200">{d.name}</h3>
                  <p className="text-xs font-mono text-slate-500">{d.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusDot status={d.status} />
                <Badge variant={statusVariant[d.status]}>{d.status}</Badge>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              {/* Battery */}
              <div className="flex flex-col items-center p-2 rounded-xl bg-white/3">
                <BatteryMedium className="w-4 h-4 text-slate-500 mb-1" />
                <p className={`text-sm font-bold ${(d.battery ?? 0) > 20 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {d.battery != null ? `${d.battery}%` : '—'}
                </p>
                <p className="text-[9px] text-slate-600">Battery</p>
              </div>
              {/* Signal */}
              <div className="flex flex-col items-center p-2 rounded-xl bg-white/3">
                <Signal className="w-4 h-4 text-slate-500 mb-1" />
                <p className="text-sm font-bold text-blue-400">
                  {d.signalStrength != null ? `${d.signalStrength}` : '—'}
                </p>
                <p className="text-[9px] text-slate-600">Signal (dBm)</p>
              </div>
              {/* Firmware */}
              <div className="flex flex-col items-center p-2 rounded-xl bg-white/3">
                <Cpu className="w-4 h-4 text-slate-500 mb-1" />
                <p className="text-sm font-bold text-violet-400">{d.firmware ?? '—'}</p>
                <p className="text-[9px] text-slate-600">Firmware</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-white/6">
              <div className="text-xs text-slate-500">
                Assigned: <span className="text-slate-300 font-mono">{d.assignedShipmentId ?? 'None'}</span>
              </div>
              <div className="text-xs text-slate-600">
                Last seen: {new Date(d.lastSeenAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Register Device Modal */}
      <RegisterDeviceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleDeviceCreated}
      />
    </div>
  );
}
