import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Plus, Search, Truck, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { PageLoader } from '../components/common/Loader';
import { NewShipmentModal } from '../components/shipments/NewShipmentModal';

const statusVariant = { 'in-transit': 'blue', pending: 'slate', delivered: 'green', alert: 'red' };

function statusBadge(status) {
  return <Badge variant={statusVariant[status] ?? 'slate'}>{status}</Badge>;
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState(null);

  useEffect(() => {
    api.getShipments().then((data) => {
      setShipments(data);
      setLoading(false);
    });
  }, []);

  const handleShipmentCreated = (created) => {
    setShipments((prev) => [created, ...prev]);
    setSuccessToast(`Shipment ${created.id} successfully created!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const filtered = shipments.filter(
    (s) =>
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.origin.toLowerCase().includes(search.toLowerCase()) ||
      s.destination.toLowerCase().includes(search.toLowerCase()) ||
      s.vaccineType.toLowerCase().includes(search.toLowerCase()),
  );

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
          <h1 className="text-2xl font-bold text-white">Shipments</h1>
          <p className="text-sm text-slate-500 mt-1">{shipments.length} total shipments</p>
        </div>
        <button
          id="new-shipment-btn"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold hover:from-blue-500 hover:to-violet-500 transition-all shadow-lg shadow-blue-500/20 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Shipment
        </button>
      </div>

      {/* Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'In Transit', count: shipments.filter(s => s.status === 'in-transit').length, variant: 'blue' },
          { label: 'Pending',    count: shipments.filter(s => s.status === 'pending').length,    variant: 'slate' },
          { label: 'Delivered',  count: shipments.filter(s => s.status === 'delivered').length,  variant: 'green' },
          { label: 'Alert',      count: shipments.filter(s => s.status === 'alert').length,      variant: 'red' },
        ].map((p) => (
          <div key={p.label} className="glass-card rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">{p.label}</span>
            <Badge variant={p.variant}>{p.count}</Badge>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          id="shipments-search"
          type="text"
          placeholder="Search by ID, origin, destination, or vaccine…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 placeholder-slate-500 text-sm
            focus:outline-none focus:border-blue-500/50 focus:bg-white/7 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-6 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Route</th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vaccine</th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Doses</th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Temp Range</th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Device</th>
                <th className="px-6 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-white/3 transition-colors group">
                  <td className="px-6 py-4">
                    <Link to={`/shipments/${s.id}`} className="font-mono text-blue-400 hover:text-blue-300 font-semibold text-xs">
                      {s.id}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <Truck className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate max-w-48">{s.origin}</span>
                      <span className="text-slate-600">→</span>
                      <span className="truncate max-w-48">{s.destination}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-300 max-w-40 truncate">{s.vaccineType}</td>
                  <td className="px-6 py-4 text-xs text-slate-400">{s.doses?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-400">
                    {s.tempRange.min}°C – {s.tempRange.max}°C
                  </td>
                  <td className="px-6 py-4">{statusBadge(s.status)}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{s.deviceId}</td>
                  <td className="px-6 py-4">
                    <Link to={`/shipments/${s.id}`} className="text-slate-600 group-hover:text-slate-300 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 text-sm">
                    No shipments match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Shipment Modal */}
      <NewShipmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleShipmentCreated}
      />
    </div>
  );
}
